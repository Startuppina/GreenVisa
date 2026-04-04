/**
 * Batch 3 — APE normalization and validation unit tests.
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { makeApeEntity } from '../../tests/ocr/apeBatch3Fixtures.js';

const require = createRequire(import.meta.url);
const {
  applyApeNormalizations,
  validateApeNormalizedOutput,
  parseConsumptionText,
} = require('./apeOcrOutputValidator.js');
const { mapApeProviderEntitiesToFields } = require('./apeFieldMapper.js');

function mapAndNormalize(entities, raw = []) {
  return applyApeNormalizations(mapApeProviderEntitiesToFields(entities, raw));
}

describe('parseConsumptionText', () => {
  it('parses 4130.84 kWh', () => {
    const r = parseConsumptionText('4130.84 kWh');
    expect(r).toEqual({ ok: true, amount: 4130.84, unit: 'kWh' });
  });

  it('parses 2000 m3', () => {
    const r = parseConsumptionText('2000 m3');
    expect(r).toEqual({ ok: true, amount: 2000, unit: 'm3' });
  });

  it('normalizes m³ unit to m3', () => {
    const r = parseConsumptionText('2000 m³');
    expect(r).toEqual({ ok: true, amount: 2000, unit: 'm3' });
  });

  it('parses Italian comma decimal', () => {
    const r = parseConsumptionText('4130,84 kWh');
    expect(r).toEqual({ ok: true, amount: 4130.84, unit: 'kWh' });
  });

  it('tolerates extra internal whitespace', () => {
    const r = parseConsumptionText('  4130.84   kWh  ');
    expect(r).toEqual({ ok: true, amount: 4130.84, unit: 'kWh' });
  });

  it('returns parse_error for abc kWh', () => {
    const r = parseConsumptionText('abc kWh');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('parse_error');
  });

  it('returns negative_amount for negative values', () => {
    const r = parseConsumptionText('-5 kWh');
    expect(r.ok).toBe(false);
    expect(r.code).toBe('negative_amount');
  });
});

describe('applyApeNormalizations', () => {
  it('trims region, municipality, street', () => {
    const f = mapAndNormalize([
      makeApeEntity('building_region', '  TOSCANA  '),
      makeApeEntity('building_municipality', '  GROSSETO '),
      makeApeEntity('building_street_name', ' via Bonghi '),
    ]);
    expect(f.find((x) => x.key === 'building.location.region').normalizedValue).toBe('TOSCANA');
    expect(f.find((x) => x.key === 'building.location.municipality').normalizedValue).toBe('GROSSETO');
    expect(f.find((x) => x.key === 'building.location.street').normalizedValue).toBe('via Bonghi');
  });

  it('keeps street number as string', () => {
    const f = mapAndNormalize([makeApeEntity('building_street_number', '7')]);
    const v = f.find((x) => x.key === 'building.location.streetNumber').normalizedValue;
    expect(v).toBe('7');
    expect(typeof v).toBe('string');
  });

  it('uppercases climate zone', () => {
    const f = mapAndNormalize([makeApeEntity('building_climate_zone', 'd')]);
    expect(f.find((x) => x.key === 'building.location.climateZone').normalizedValue).toBe('D');
  });

  it('accepts valid uppercase climate zone unchanged', () => {
    const f = mapAndNormalize([makeApeEntity('building_climate_zone', 'D')]);
    expect(f.find((x) => x.key === 'building.location.climateZone').normalizedValue).toBe('D');
  });

  it('uses providerIntegerValue for construction year when set on field', () => {
    const raw = [{ type: 'building_construction_year', normalizedValue: { integerValue: 1960 } }];
    const f = mapAndNormalize([makeApeEntity('building_construction_year', 'noise')], raw);
    expect(f.find((x) => x.key === 'building.details.constructionYear').normalizedValue).toBe(1960);
  });

  it('falls back to parsing year from OCR text', () => {
    const f = mapAndNormalize([makeApeEntity('building_construction_year', 'built in 1985')], []);
    expect(f.find((x) => x.key === 'building.details.constructionYear').normalizedValue).toBe(1985);
  });

  it('normalizes use types', () => {
    expect(
      mapAndNormalize([makeApeEntity('building_use_type', 'Residenziale')]).find(
        (x) => x.key === 'building.details.useType',
      ).normalizedValue,
    ).toBe('residential');
    expect(
      mapAndNormalize([makeApeEntity('building_use_type', 'Non residenziale')]).find(
        (x) => x.key === 'building.details.useType',
      ).normalizedValue,
    ).toBe('non_residential');
    expect(
      mapAndNormalize([makeApeEntity('building_use_type', 'Altro uso')]).find(
        (x) => x.key === 'building.details.useType',
      ).normalizedValue,
    ).toBe('other');
  });

  it('parses electricity and gas consumption into structured normalizedValue', () => {
    const f = mapAndNormalize([
      makeApeEntity('grid_electricity_annual_consumption_raw', '4130.84 kWh'),
      makeApeEntity('natural_gas_annual_consumption_raw', '2000 m3'),
    ]);
    expect(f.find((x) => x.key === 'consumptions.electricity.amount').normalizedValue).toEqual({
      amount: 4130.84,
      unit: 'kWh',
    });
    expect(f.find((x) => x.key === 'consumptions.natural_gas.amount').normalizedValue).toEqual({
      amount: 2000,
      unit: 'm3',
    });
  });

  it('adds GPL warning when value present', () => {
    const f = mapAndNormalize([makeApeEntity('lpg_annual_consumption_raw', '1000 m3')]);
    const gpl = f.find((x) => x.key === 'consumptions.gpl.amount');
    expect(gpl.warnings).toContain('possible_table_row_mismatch');
  });
});

describe('validateApeNormalizedOutput', () => {
  it('does not emit invalid_enum for a valid uppercase climate zone', () => {
    const fields = mapAndNormalize([makeApeEntity('building_climate_zone', 'D')]);
    const issues = validateApeNormalizedOutput(fields);
    expect(issues.filter((i) => i.type === 'invalid_enum')).toHaveLength(0);
  });

  it('flags invalid climate zone as invalid_enum', () => {
    const fields = mapAndNormalize([makeApeEntity('building_climate_zone', 'Z')]);
    const issues = validateApeNormalizedOutput(fields);
    expect(issues.some((i) => i.type === 'invalid_enum' && i.fieldKey === 'building.location.climateZone')).toBe(
      true,
    );
  });

  it('flags invalid construction year as invalid_number', () => {
    const fields = mapAndNormalize([makeApeEntity('building_construction_year', '9999')], []);
    const issues = validateApeNormalizedOutput(fields);
    expect(
      issues.some((i) => i.type === 'invalid_number' && i.fieldKey === 'building.details.constructionYear'),
    ).toBe(true);
  });

  it('flags unparseable consumption as parse_error', () => {
    const fields = mapAndNormalize([
      makeApeEntity('grid_electricity_annual_consumption_raw', 'abc kWh'),
    ]);
    const issues = validateApeNormalizedOutput(fields);
    expect(issues.some((i) => i.type === 'parse_error' && i.fieldKey === 'consumptions.electricity.amount')).toBe(
      true,
    );
  });

  it('flags negative consumption as invalid_number', () => {
    const fields = applyApeNormalizations([
      {
        key: 'consumptions.electricity.amount',
        label: 'E',
        value: '-5 kWh',
        confidence: 0.99,
        sourceMethod: 'EXTRACT',
        sourcePage: 1,
        boundingPoly: null,
        sourceEntityType: 'grid_electricity_annual_consumption_raw',
        required: false,
      },
    ]);
    const issues = validateApeNormalizedOutput(fields);
    expect(issues.some((i) => i.type === 'invalid_number' && i.fieldKey === 'consumptions.electricity.amount')).toBe(
      true,
    );
  });

  it('emits low_confidence when below threshold', () => {
    const fields = mapAndNormalize([
      makeApeEntity('building_region', 'TOSCANA', { confidence: 0.5 }),
    ]);
    const issues = validateApeNormalizedOutput(fields);
    expect(issues.some((i) => i.type === 'low_confidence')).toBe(true);
  });

  it('emits suspected_false_positive for GPL with a value', () => {
    const fields = mapAndNormalize([makeApeEntity('lpg_annual_consumption_raw', '1000 m3')]);
    const issues = validateApeNormalizedOutput(fields);
    expect(
      issues.some((i) => i.type === 'suspected_false_positive' && i.fieldKey === 'consumptions.gpl.amount'),
    ).toBe(true);
  });
});
