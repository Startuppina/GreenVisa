// Maps provider-specific entity types to the stable Transport V2 OCR review schema.
// The review fields remain document-centric, while the prefill row is built later.

const FIELD_DEFINITIONS = [
  {
    key: 'registration_year',
    label: 'Anno immatricolazione',
    providerTypes: ['registration_year'],
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
    key: 'wltp_homologation',
    label: 'Omologazione WLTP',
    providerTypes: ['wltp_homologation'],
    required: false,
  },
  {
    key: 'vehicle_mass_kg',
    label: 'Massa veicolo (kg)',
    providerTypes: [
      'vehicle_mass_kg',
      'gross_vehicle_mass_kg',
      'gross_mass_kg',
      'vehicle_mass',
    ],
    required: false,
  },
];

function normalizeProviderOutput(providerResult) {
  const { entities } = providerResult;

  const fields = FIELD_DEFINITIONS.map((def) => {
    const entity = findEntityByProviderTypes(entities, def.providerTypes);

    return {
      key: def.key,
      label: def.label,
      value: entity?.normalizedValue ?? entity?.mentionText ?? null,
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

module.exports = { normalizeProviderOutput, FIELD_DEFINITIONS };
