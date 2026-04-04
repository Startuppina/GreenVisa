// Maps Google Document AI entity types to the APE OCR review schema (building + consumptions).

const APE_FIELD_DEFINITIONS = [
  {
    key: 'region',
    label: 'Regione',
    providerTypes: ['region', 'ape_region', 'administrative_area'],
    required: false,
  },
  {
    key: 'municipality',
    label: 'Comune',
    providerTypes: ['municipality', 'comune', 'city'],
    required: false,
  },
  {
    key: 'street',
    label: 'Via',
    providerTypes: ['street', 'road', 'street_name'],
    required: false,
  },
  {
    key: 'street_number',
    label: 'Civico',
    providerTypes: ['street_number', 'civic_number', 'street_number_civic'],
    required: false,
  },
  {
    key: 'climate_zone',
    label: 'Zona climatica',
    providerTypes: ['climate_zone', 'zona_climatica'],
    required: false,
  },
  {
    key: 'construction_year',
    label: 'Anno di costruzione',
    providerTypes: ['construction_year', 'year_of_construction'],
    required: false,
  },
  {
    key: 'use_type',
    label: "Destinazione d'uso",
    providerTypes: ['use_type', 'building_use', 'destination_of_use'],
    required: false,
  },
  {
    key: 'consumption_electricity',
    label: 'Consumo elettricità (kWh)',
    providerTypes: ['electricity_consumption', 'consumption_electricity', 'annual_electricity_kwh'],
    required: false,
  },
  {
    key: 'consumption_natural_gas',
    label: 'Consumo gas naturale',
    providerTypes: ['natural_gas_consumption', 'methane_consumption', 'gas_natural_consumption'],
    required: false,
  },
  {
    key: 'consumption_lpg',
    label: 'Consumo GPL',
    providerTypes: ['lpg_consumption', 'gpl_consumption', 'consumption_gpl'],
    required: false,
  },
  {
    key: 'consumption_diesel',
    label: 'Consumo gasolio',
    providerTypes: ['diesel_consumption', 'gasoil_consumption'],
    required: false,
  },
];

function pickProviderRawText(entity) {
  const normalized = entity.normalizedValue;
  const mention = entity.mentionText;
  if (normalized != null && String(normalized).trim() !== '') {
    return normalized;
  }
  if (mention != null && String(mention).trim() !== '') {
    return mention;
  }
  return null;
}

function findEntityByProviderTypes(entities, providerTypes) {
  if (!Array.isArray(entities) || !Array.isArray(providerTypes)) {
    return null;
  }
  for (const providerType of providerTypes) {
    const entity = entities.find((candidate) => candidate.type === providerType);
    if (entity) {
      return entity;
    }
  }
  return null;
}

function mapReviewValue(def, entity) {
  if (!entity) {
    return null;
  }
  return pickProviderRawText(entity) ?? null;
}

/**
 * @param {object} providerResult — `{ entities }` from Google Document AI parsing layer.
 */
function normalizeApeProviderOutput(providerResult) {
  const { entities } = providerResult;

  const fields = APE_FIELD_DEFINITIONS.map((def) => {
    const entity = findEntityByProviderTypes(entities, def.providerTypes);
    return {
      key: def.key,
      label: def.label,
      value: mapReviewValue(def, entity),
      confidence: entity ? +Number(entity.confidence).toFixed(4) : 0,
      required: def.required,
      sourceMethod: entity ? 'EXTRACT' : 'NOT_FOUND',
      sourcePage: entity?.pageNumber ?? null,
      boundingPoly: entity?.boundingPoly ?? null,
    };
  });

  return { fields };
}

function markApeSuspiciousLpgFromOcr(fields) {
  if (!Array.isArray(fields)) {
    return [];
  }
  return fields.map((f) => {
    if (!f || f.key !== 'consumption_lpg') {
      return f;
    }
    if (f.sourceMethod === 'NOT_FOUND') {
      return f;
    }
    // APE GPL/LPG is often misread; never auto-apply without an explicit confirm pass (Batch 3/4).
    return { ...f, suspiciousLpg: true };
  });
}

module.exports = {
  APE_FIELD_DEFINITIONS,
  normalizeApeProviderOutput,
  markApeSuspiciousLpgFromOcr,
  findEntityByProviderTypes,
};
