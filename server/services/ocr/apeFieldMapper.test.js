/**
 * Batch 3 — APE field mapper unit tests.
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { makeApeEntity } from '../../tests/ocr/apeBatch3Fixtures.js';

const require = createRequire(import.meta.url);
const { mapApeProviderEntitiesToFields } = require('./apeFieldMapper.js');

function fieldByKey(fields, key) {
  return fields.find((f) => f.key === key);
}

describe('mapApeProviderEntitiesToFields', () => {
  const cases = [
    ['building_region', 'building.location.region'],
    ['building_municipality', 'building.location.municipality'],
    ['building_street_name', 'building.location.street'],
    ['building_street_number', 'building.location.streetNumber'],
    ['building_climate_zone', 'building.location.climateZone'],
    ['building_construction_year', 'building.details.constructionYear'],
    ['building_use_type', 'building.details.useType'],
    ['grid_electricity_annual_consumption_raw', 'consumptions.electricity.amount'],
    ['natural_gas_annual_consumption_raw', 'consumptions.natural_gas.amount'],
    ['lpg_annual_consumption_raw', 'consumptions.gpl.amount'],
  ];

  it.each(cases)('maps %s → %s', (providerType, expectedKey) => {
    const fields = mapApeProviderEntitiesToFields([makeApeEntity(providerType, 'x')], []);
    expect(fieldByKey(fields, expectedKey)).toBeDefined();
  });

  it('preserves provider provenance metadata on mapped fields', () => {
    const poly = { vertices: [{ x: 1, y: 2 }] };
    const fields = mapApeProviderEntitiesToFields(
      [makeApeEntity('building_region', 'TOSCANA', { confidence: 0.9123, pageNumber: 3, boundingPoly: poly })],
      [],
    );
    const f = fieldByKey(fields, 'building.location.region');
    expect(f.confidence).toBe(0.9123);
    expect(f.sourceEntityType).toBe('building_region');
    expect(f.sourcePage).toBe(3);
    expect(f.boundingPoly).toEqual(poly);
    expect(f.sourceMethod).toBe('EXTRACT');
  });

  it('ignores unsupported Google entity types', () => {
    const fields = mapApeProviderEntitiesToFields(
      [makeApeEntity('unknown_custom_label', 'noise'), makeApeEntity('building_region', 'LAZIO')],
      [],
    );
    expect(fields).toHaveLength(1);
    expect(fieldByKey(fields, 'building.location.region')?.value).toBe('LAZIO');
  });

  it('does not emit placeholder fields when entities are absent', () => {
    const fields = mapApeProviderEntitiesToFields([makeApeEntity('building_region', 'X')], []);
    expect(fieldByKey(fields, 'building.location.municipality')).toBeUndefined();
    expect(fieldByKey(fields, 'consumptions.electricity.amount')).toBeUndefined();
  });

  it('uses provider integerValue for construction year when raw document entities provide it', () => {
    const fields = mapApeProviderEntitiesToFields(
      [makeApeEntity('building_construction_year', '1960')],
      [{ type: 'building_construction_year', normalizedValue: { integerValue: 1960 } }],
    );
    const f = fieldByKey(fields, 'building.details.constructionYear');
    expect(f.providerIntegerValue).toBe(1960);
  });

  it('dedupes by internal field key (first entity wins)', () => {
    const fields = mapApeProviderEntitiesToFields(
      [
        makeApeEntity('building_region', 'FIRST'),
        makeApeEntity('building_region', 'SECOND'),
      ],
      [],
    );
    expect(fields).toHaveLength(1);
    expect(fields[0].value).toBe('FIRST');
  });
});
