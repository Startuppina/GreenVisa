/**
 * Building certification OCR prefill — aligned with `buildingCertificationOcrPrefillService.js` + live field keys.
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { makeApeEntity } from '../../tests/ocr/apeBatch3Fixtures.js';

const require = createRequire(import.meta.url);
const { buildBuildingCertificationPrefill } = require('./buildingCertificationOcrPrefillService.js');
const { normalizeApeProviderOutput, markApeSuspiciousLpgFromOcr } = require('../ocr/apeFieldMapper.js');
const { applyApeNormalizations, validateApeNormalizedOutput } = require('../ocr/apeOcrOutputValidator.js');

function pipeline(entities, prefillOpts = {}) {
  const raw = markApeSuspiciousLpgFromOcr(normalizeApeProviderOutput({ entities }).fields);
  const fields = applyApeNormalizations(raw);
  const validationIssues = validateApeNormalizedOutput(fields);
  const prefill = buildBuildingCertificationPrefill({
    documentId: 1,
    reviewFields: fields,
    ...prefillOpts,
  });
  return { fields, validationIssues, prefill };
}

function collectKeys(obj, prefix = '') {
  const keys = [];
  if (obj === null || obj === undefined) return keys;
  if (typeof obj !== 'object') return keys;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => keys.push(...collectKeys(item, `${prefix}[${i}]`)));
    return keys;
  }
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    keys.push(path);
    keys.push(...collectKeys(obj[k], path));
  }
  return keys;
}

describe('buildBuildingCertificationPrefill (from live APE field keys)', () => {
  it('builds building metadata patch from normalized fields', () => {
    const { prefill } = pipeline([
      makeApeEntity('region', 'TOSCANA'),
      makeApeEntity('municipality', 'GROSSETO'),
      makeApeEntity('street', 'via Bonghi'),
      makeApeEntity('street_number', '7'),
      makeApeEntity('climate_zone', 'D'),
      makeApeEntity('construction_year', '1960'),
      makeApeEntity('use_type', 'Ufficio'),
    ]);
    expect(prefill.building.location.region).toBe('TOSCANA');
    expect(prefill.building.location.municipality).toBe('GROSSETO');
    expect(prefill.building.location.street).toBe('via Bonghi');
    expect(prefill.building.location.streetNumber).toBe('7');
    expect(prefill.building.location.climateZone).toBe('D');
    expect(prefill.building.details.constructionYear).toBe(1960);
    expect(prefill.building.details.useType).toBe('Ufficio');
  });

  it('adds electricity and gas as Italian-labelled building-level rows', () => {
    const { prefill } = pipeline([
      makeApeEntity('consumption_electricity', '4130.84 kWh'),
      makeApeEntity('natural_gas_consumption', '2000 m3'),
    ]);
    expect(prefill.consumptions).toContainEqual({
      energySource: 'Elettricità',
      consumption: 4130.84,
      plantId: null,
    });
    expect(prefill.consumptions).toContainEqual({
      energySource: 'Gas naturale',
      consumption: 2000,
      plantId: null,
    });
  });

  it('sets plantId null on every consumption row', () => {
    const { prefill } = pipeline([
      makeApeEntity('consumption_electricity', '1 kWh'),
      makeApeEntity('natural_gas_consumption', '2 m3'),
    ]);
    for (const row of prefill.consumptions) {
      expect(row.plantId).toBeNull();
    }
  });

  it('excludes suspicious GPL from prefill until confirmPass', () => {
    const { fields, prefill } = pipeline([makeApeEntity('lpg_consumption', '1000 m3')]);
    expect(fields.some((f) => f.key === 'consumption_lpg')).toBe(true);
    expect(fields.find((f) => f.key === 'consumption_lpg')?.suspiciousLpg).toBe(true);
    expect(prefill.consumptions.some((c) => c.energySource === 'GPL')).toBe(false);
  });

  it('includes GPL in prefill when confirmPass true', () => {
    const { prefill } = pipeline([makeApeEntity('lpg_consumption', '1000 m3')], { confirmPass: true });
    expect(prefill.consumptions.some((c) => c.energySource === 'GPL')).toBe(true);
  });

  it('excludes invalid climate zone and unparseable consumption from prefill', () => {
    const { prefill } = pipeline([
      makeApeEntity('climate_zone', 'Z'),
      makeApeEntity('consumption_electricity', 'abc kWh'),
      makeApeEntity('region', 'X'),
    ]);
    expect(prefill.building.location).not.toHaveProperty('climateZone');
    expect(prefill.consumptions.some((c) => c.energySource === 'Elettricità')).toBe(false);
    expect(prefill.building.location.region).toBe('X');
  });

  it('does not embed OCR-only metadata keys inside prefill JSON', () => {
    const { prefill } = pipeline([
      makeApeEntity('region', 'TOSCANA'),
      makeApeEntity('consumption_electricity', '10 kWh'),
    ]);
    const banned = ['confidence', 'warnings', 'sourceEntityType', 'rawValue', 'boundingPoly'];
    const all = collectKeys(prefill);
    for (const b of banned) {
      expect(all.some((k) => k === b || k.endsWith(`.${b}`))).toBe(false);
    }
  });
});
