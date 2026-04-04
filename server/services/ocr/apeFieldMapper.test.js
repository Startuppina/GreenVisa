/**
 * APE field mapper — `normalizeApeProviderOutput` + `markApeSuspiciousLpgFromOcr`.
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { makeApeEntity } from '../../tests/ocr/apeBatch3Fixtures.js';

const require = createRequire(import.meta.url);
const {
  normalizeApeProviderOutput,
  markApeSuspiciousLpgFromOcr,
  findEntityByProviderTypes,
} = require('./apeFieldMapper.js');

describe('normalizeApeProviderOutput', () => {
  it('maps region entity to review field key region', () => {
    const { fields } = normalizeApeProviderOutput({
      entities: [makeApeEntity('region', 'Toscana')],
    });
    const f = fields.find((x) => x.key === 'region');
    expect(f).toBeDefined();
    expect(f.value).toBe('Toscana');
    expect(f.sourceMethod).toBe('EXTRACT');
  });

  it('maps electricity consumption entity to consumption_electricity', () => {
    const { fields } = normalizeApeProviderOutput({
      entities: [makeApeEntity('consumption_electricity', '100 kWh')],
    });
    const f = fields.find((x) => x.key === 'consumption_electricity');
    expect(f?.value).toBe('100 kWh');
  });

  it('fills NOT_FOUND slots for missing entities', () => {
    const { fields } = normalizeApeProviderOutput({ entities: [] });
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.every((f) => f.key && f.label)).toBe(true);
    expect(fields.filter((f) => f.sourceMethod === 'NOT_FOUND').length).toBeGreaterThan(0);
  });
});

describe('markApeSuspiciousLpgFromOcr', () => {
  it('marks extracted LPG consumption as suspicious', () => {
    const fields = [
      {
        key: 'consumption_lpg',
        label: 'GPL',
        value: '10',
        confidence: 0.9,
        sourceMethod: 'EXTRACT',
        sourcePage: 1,
        boundingPoly: null,
      },
    ];
    const out = markApeSuspiciousLpgFromOcr(fields);
    expect(out[0].suspiciousLpg).toBe(true);
  });

  it('does not mark NOT_FOUND LPG', () => {
    const fields = [
      {
        key: 'consumption_lpg',
        label: 'GPL',
        value: null,
        confidence: 0,
        sourceMethod: 'NOT_FOUND',
        sourcePage: null,
        boundingPoly: null,
      },
    ];
    const out = markApeSuspiciousLpgFromOcr(fields);
    expect(out[0].suspiciousLpg).toBeUndefined();
  });
});

describe('findEntityByProviderTypes', () => {
  it('returns first matching entity type', () => {
    const entities = [makeApeEntity('noise', 'x'), makeApeEntity('municipality', 'Roma')];
    const hit = findEntityByProviderTypes(entities, ['municipality', 'comune']);
    expect(hit?.mentionText).toBe('Roma');
  });
});
