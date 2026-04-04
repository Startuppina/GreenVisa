/**
 * Reusable APE Google Document AI–shaped fixtures for Batch 3 tests.
 * `entities` matches the uniform shape from googleDocumentAiService.extractEntitiesFromResponse.
 */

export function makeApeEntity(type, mentionText, overrides = {}) {
  return {
    type,
    mentionText,
    normalizedValue: overrides.normalizedValue ?? mentionText,
    confidence: overrides.confidence ?? 0.95,
    pageNumber: overrides.pageNumber ?? 1,
    boundingPoly: overrides.boundingPoly ?? { normalizedVertices: [{ x: 0.1, y: 0.2 }] },
    ...overrides,
  };
}

/** Full happy-path APE extraction (simplified entities + raw document.entities for integer year). */
export function realisticApeProviderResult(overrides = {}) {
  const entities = [
    makeApeEntity('building_region', 'TOSCANA'),
    makeApeEntity('building_municipality', 'GROSSETO'),
    makeApeEntity('building_street_name', 'via Bonghi'),
    makeApeEntity('building_street_number', '7'),
    makeApeEntity('building_climate_zone', 'd', { normalizedValue: 'd' }),
    makeApeEntity('building_construction_year', '1960'),
    makeApeEntity('building_use_type', 'Non residenziale'),
    makeApeEntity('grid_electricity_annual_consumption_raw', '4130.84 kWh'),
    makeApeEntity('natural_gas_annual_consumption_raw', '2000 m3'),
    makeApeEntity('lpg_annual_consumption_raw', '1000 m3', { confidence: 0.95 }),
  ];

  const rawDocumentEntities = [
    {
      type: 'building_construction_year',
      mentionText: '1960',
      normalizedValue: { integerValue: 1960 },
    },
  ];

  return {
    rawProviderOutput: {
      document: {
        text: 'ATTESTATO…',
        entities: rawDocumentEntities,
      },
    },
    entities,
    metadata: { processorName: 'projects/p/locations/eu/processors/ape', processorVersion: null },
    ...overrides,
  };
}

export function lowConfidenceApeProviderResult() {
  const base = realisticApeProviderResult();
  base.entities = base.entities.map((e) =>
    e.type === 'building_region' ? { ...e, confidence: 0.5 } : e,
  );
  return base;
}

export function invalidClimateZoneApeResult() {
  const base = realisticApeProviderResult();
  base.entities = base.entities.map((e) =>
    e.type === 'building_climate_zone' ? { ...e, mentionText: 'Z', normalizedValue: 'Z' } : e,
  );
  return base;
}

export function invalidConstructionYearApeResult() {
  const base = realisticApeProviderResult();
  base.entities = base.entities.map((e) =>
    e.type === 'building_construction_year'
      ? { ...e, mentionText: 'abc', normalizedValue: 'abc' }
      : e,
  );
  base.rawProviderOutput.document.entities = [
    { type: 'building_construction_year', mentionText: 'abc', normalizedValue: {} },
  ];
  return base;
}

export function badElectricityParseApeResult() {
  const base = realisticApeProviderResult();
  base.entities = base.entities.map((e) =>
    e.type === 'grid_electricity_annual_consumption_raw'
      ? { ...e, mentionText: 'abc kWh', normalizedValue: 'abc kWh' }
      : e,
  );
  return base;
}

export function missingOptionalFieldsApeResult() {
  return {
    rawProviderOutput: { document: { text: 'x', entities: [] } },
    entities: [
      makeApeEntity('building_region', 'TOSCANA'),
      makeApeEntity('building_municipality', 'GROSSETO'),
    ],
    metadata: {},
  };
}
