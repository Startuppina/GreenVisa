// Maps provider-specific entity types to the stable Transport V2 OCR review schema.
// The review fields remain document-centric, while the prefill row is built later.
// Provider-specific names (e.g. Google Document AI `type` values) stay in this file.
// Entity types returned by Document AI that are not listed in FIELD_DEFINITIONS are ignored
// for normalized/review output (they may still appear in raw_provider_output.document.entities).

const FIELD_DEFINITIONS = [
  {
    key: 'registration_year',
    label: 'Anno immatricolazione',
    providerTypes: ['registration_year', 'first_registration_date'],
    required: false,
  },
  {
    key: 'euro_class',
    label: 'Classe Euro',
    providerTypes: ['euro_class'],
    required: false,
  },
  {
    key: 'fuel_type',
    label: 'Tipo di carburante',
    providerTypes: ['fuel_type'],
    required: false,
  },
  {
    key: 'max_vehicle_mass_kg',
    label: 'Massa massima veicolo (kg)',
    providerTypes: ['max_vehicle_mass_kg', 'gross_vehicle_mass_kg', 'vehicle_mass'],
    required: false,
  },
  {
    key: 'co2_emissions_g_km',
    label: 'Emissioni CO2 (g/km)',
    providerTypes: ['co2_emissions_g_km'],
    required: false,
  },
  {
    key: 'vehicle_use_text',
    label: 'Destinazione / uso veicolo (testo)',
    providerTypes: ['vehicle_use_text'],
    required: false,
  },
];

/**
 * Derives a calendar year integer from provider registration text (ISO date, d.m.y, or bare year).
 */
function extractRegistrationYearFromProviderText(raw) {
  if (raw == null) {
    return null;
  }

  const str = String(raw).trim();
  if (!str) {
    return null;
  }

  const isoYear = str.match(/^(\d{4})-\d{2}-\d{2}/);
  if (isoYear) {
    return Number.parseInt(isoYear[1], 10);
  }

  const dmy = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmy) {
    return Number.parseInt(dmy[3], 10);
  }

  const embedded = str.match(/\b(19\d{2}|20\d{2})\b/);
  return embedded ? Number.parseInt(embedded[1], 10) : null;
}

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

function mapReviewValue(def, entity) {
  if (!entity) {
    return null;
  }

  const raw = pickProviderRawText(entity);

  if (def.key === 'registration_year') {
    const year = extractRegistrationYearFromProviderText(raw);
    return year !== null ? year : raw;
  }

  return raw ?? null;
}

function normalizeProviderOutput(providerResult) {
  const { entities } = providerResult;

  const fields = FIELD_DEFINITIONS.map((def) => {
    const entity = findEntityByProviderTypes(entities, def.providerTypes);

    return {
      key: def.key,
      label: def.label,
      value: mapReviewValue(def, entity),
      confidence: entity ? +(entity.confidence).toFixed(4) : 0,
      required: def.required,
      sourceMethod: entity ? 'EXTRACT' : 'NOT_FOUND',
      sourcePage: entity?.pageNumber ?? null,
      boundingPoly: entity?.boundingPoly ?? null,
    };
  });

  return { fields };
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

/**
 * Maps Google / provider "uso veicolo" free text (J.1) to internal Transport V2 transport_mode.
 * Conservative: only substring checks for Italian keywords; no value if neither matches.
 */
function deriveTransportModeFromVehicleUseText(raw) {
  if (raw == null) {
    return null;
  }

  const lower = String(raw).toLowerCase();
  if (lower.includes('persone')) {
    return 'passenger';
  }
  if (lower.includes('cose')) {
    return 'goods';
  }

  return null;
}

module.exports = {
  normalizeProviderOutput,
  FIELD_DEFINITIONS,
  deriveTransportModeFromVehicleUseText,
};
