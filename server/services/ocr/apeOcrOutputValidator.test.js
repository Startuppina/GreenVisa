/**
 * APE normalization and validation — aligned with `apeOcrOutputValidator.js`.
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { makeApeEntity } from '../../tests/ocr/apeBatch3Fixtures.js';

const require = createRequire(import.meta.url);
const { applyApeNormalizations, validateApeNormalizedOutput, normalizeApeFieldValue } = require('./apeOcrOutputValidator.js');
const { normalizeApeProviderOutput, markApeSuspiciousLpgFromOcr } = require('./apeFieldMapper.js');

function mapAndNormalize(entities) {
  const raw = markApeSuspiciousLpgFromOcr(normalizeApeProviderOutput({ entities }).fields);
  return applyApeNormalizations(raw);
}

describe('applyApeNormalizations', () => {
  it('normalizes region and municipality display strings', () => {
    const f = mapAndNormalize([
      makeApeEntity('region', '  Lazio  '),
      makeApeEntity('municipality', ' Roma '),
    ]);
    expect(f.find((x) => x.key === 'region')?.normalizedValue).toBe('Lazio');
    expect(f.find((x) => x.key === 'municipality')?.normalizedValue).toBe('Roma');
  });

  it('uppercases valid climate zone letter', () => {
    const f = mapAndNormalize([makeApeEntity('climate_zone', 'd')]);
    expect(f.find((x) => x.key === 'climate_zone')?.normalizedValue).toBe('D');
  });

  it('parses consumption_electricity as finite number', () => {
    const f = mapAndNormalize([makeApeEntity('consumption_electricity', '4130,84')]);
    expect(f.find((x) => x.key === 'consumption_electricity')?.normalizedValue).toBe(4130.84);
  });
});

describe('normalizeApeFieldValue', () => {
  it('returns null for unparseable consumption text', () => {
    expect(normalizeApeFieldValue('consumption_electricity', 'abc')).toBe(null);
  });
});

describe('validateApeNormalizedOutput', () => {
  it('flags low confidence', () => {
    const fields = mapAndNormalize([makeApeEntity('region', 'Lazio', { confidence: 0.1 })]);
    const issues = validateApeNormalizedOutput(fields);
    expect(issues.some((i) => i.type === 'low_confidence')).toBe(true);
  });

  it('flags unknown region spelling against REGION_OPTIONS', () => {
    const fields = mapAndNormalize([makeApeEntity('region', 'Atlantis')]);
    const issues = validateApeNormalizedOutput(fields);
    expect(issues.some((i) => i.fieldKey === 'region' && i.type === 'unrecognized_value')).toBe(true);
  });
});
