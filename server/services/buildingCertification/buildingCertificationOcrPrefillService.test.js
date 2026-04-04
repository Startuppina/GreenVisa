/**
 * Batch 3 — building certification OCR prefill unit tests.
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { makeApeEntity } from '../../tests/ocr/apeBatch3Fixtures.js';

const require = createRequire(import.meta.url);
const { buildBuildingCertificationPrefill } = require('./buildingCertificationOcrPrefillService.js');
const {
  mapApeProviderEntitiesToFields,
  buildApeDerivedOutputFromNormalizedFields,
} = require('../ocr/apeFieldMapper.js');
const { applyApeNormalizations, validateApeNormalizedOutput } = require('../ocr/apeOcrOutputValidator.js');

function pipeline(entities, raw = [], prefillOpts = {}) {
  const fields = applyApeNormalizations(mapApeProviderEntitiesToFields(entities, raw));
  const validationIssues = validateApeNormalizedOutput(fields);
  const prefill = buildBuildingCertificationPrefill({
    documentId: 1,
    reviewFields: fields,
    validationIssues,
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

describe('buildBuildingCertificationPrefill', () => {
  it('builds building metadata patch from normalized fields', () => {
    const { prefill } = pipeline([
      makeApeEntity('building_region', 'TOSCANA'),
      makeApeEntity('building_municipality', 'GROSSETO'),
      makeApeEntity('building_street_name', 'via Bonghi'),
      makeApeEntity('building_street_number', '7'),
      makeApeEntity('building_climate_zone', 'D'),
      makeApeEntity('building_construction_year', '1960'),
      makeApeEntity('building_use_type', 'Non residenziale'),
    ]);
    expect(prefill.building.location.region).toBe('TOSCANA');
    expect(prefill.building.location.municipality).toBe('GROSSETO');
    expect(prefill.building.location.street).toBe('via Bonghi');
    expect(prefill.building.location.streetNumber).toBe('7');
    expect(prefill.building.location.climateZone).toBe('D');
    expect(prefill.building.details.constructionYear).toBe(1960);
    expect(prefill.building.details.useType).toBe('non_residential');
  });

  it('adds electricity consumption as building-level row', () => {
    const { prefill } = pipeline([makeApeEntity('grid_electricity_annual_consumption_raw', '4130.84 kWh')]);
    expect(prefill.consumptions).toContainEqual({
      energySource: 'electricity',
      amount: 4130.84,
      plantId: null,
    });
  });

  it('adds natural gas consumption as building-level row', () => {
    const { prefill } = pipeline([makeApeEntity('natural_gas_annual_consumption_raw', '2000 m3')]);
    expect(prefill.consumptions).toContainEqual({
      energySource: 'natural_gas',
      amount: 2000,
      plantId: null,
    });
  });

  it('sets plantId null on every consumption row', () => {
    const { prefill } = pipeline([
      makeApeEntity('grid_electricity_annual_consumption_raw', '1 kWh'),
      makeApeEntity('natural_gas_annual_consumption_raw', '2 m3'),
    ]);
    for (const row of prefill.consumptions) {
      expect(row.plantId).toBeNull();
    }
  });

  it('excludes suspicious GPL from prefill while keeping it in review fields and derived consumptions list', () => {
    const { fields, prefill } = pipeline([makeApeEntity('lpg_annual_consumption_raw', '1000 m3')]);
    expect(fields.some((f) => f.key === 'consumptions.gpl.amount')).toBe(true);
    expect(prefill.consumptions.some((c) => c.energySource === 'gpl')).toBe(false);
    const derived = buildApeDerivedOutputFromNormalizedFields(fields);
    expect(derived.parsedConsumptions.some((c) => c.energySource === 'gpl')).toBe(true);
    expect(derived.suspiciousFields).toContain('consumptions.gpl.amount');
  });

  it('excludes invalid climate zone and unparseable consumption from prefill', () => {
    const { prefill } = pipeline([
      makeApeEntity('building_climate_zone', 'Z'),
      makeApeEntity('grid_electricity_annual_consumption_raw', 'abc kWh'),
      makeApeEntity('building_region', 'X'),
    ]);
    expect(prefill.building.location).not.toHaveProperty('climateZone');
    expect(prefill.consumptions.some((c) => c.energySource === 'electricity')).toBe(false);
    expect(prefill.building.location.region).toBe('X');
  });

  it('with gplUserAccepted, includes GPL in prefill despite suspected_false_positive', () => {
    const { fields, validationIssues, prefill } = pipeline(
      [makeApeEntity('lpg_annual_consumption_raw', '1000 m3')],
      [],
      { gplUserAccepted: true },
    );
    expect(fields.some((f) => f.key === 'consumptions.gpl.amount')).toBe(true);
    expect(validationIssues.some((i) => i.type === 'suspected_false_positive')).toBe(true);
    expect(prefill.consumptions.some((c) => c.energySource === 'gpl')).toBe(true);
  });

  it('does not embed OCR-only metadata keys inside prefill JSON', () => {
    const { prefill } = pipeline([
      makeApeEntity('building_region', 'TOSCANA'),
      makeApeEntity('grid_electricity_annual_consumption_raw', '10 kWh'),
    ]);
    const banned = ['confidence', 'warnings', 'sourceEntityType', 'rawValue', 'boundingPoly'];
    const all = collectKeys(prefill);
    for (const b of banned) {
      expect(all.some((k) => k === b || k.endsWith(`.${b}`))).toBe(false);
    }
  });
});
