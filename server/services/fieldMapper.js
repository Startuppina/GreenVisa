// Maps provider-specific entity types to the stable vehicle field schema.
// Only the five OCR-relevant transport fields are mapped.
// Adding a new field = one entry here + validation in ocrOutputValidator.

const FIELD_DEFINITIONS = [
  {
    key: 'registrationYear',
    label: 'Anno immatricolazione',
    providerType: 'registration_year',
    required: true,
  },
  {
    key: 'euroClass',
    label: 'Classe Euro',
    providerType: 'euro_class',
    required: true,
  },
  {
    key: 'fuelType',
    label: 'Tipo di carburante',
    providerType: 'fuel_type',
    required: true,
  },
  {
    key: 'wltpHomologation',
    label: 'Omologazione WLTP',
    providerType: 'wltp_homologation',
    required: true,
  },
  {
    key: 'goodsVehicleOver2_5Tons',
    label: 'Veicolo merci oltre 2.5 tonnellate',
    providerType: 'goods_vehicle_over_2_5_tons',
    required: false,
  },
];

function normalizeProviderOutput(providerResult) {
  const { entities } = providerResult;

  const entityByType = new Map();
  for (const entity of entities) {
    if (!entityByType.has(entity.type)) {
      entityByType.set(entity.type, entity);
    }
  }

  const fields = FIELD_DEFINITIONS.map((def) => {
    const entity = entityByType.get(def.providerType);

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

module.exports = { normalizeProviderOutput, FIELD_DEFINITIONS };
