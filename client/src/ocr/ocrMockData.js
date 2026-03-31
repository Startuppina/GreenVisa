// Dev-only mock extraction aligned with server/services/ocr/fieldMapper.js review fields.

const MOCK_FIELDS = [
  {
    key: 'registration_year',
    label: 'Anno immatricolazione',
    value: '2019',
    confidence: 0.92,
    required: false,
    sourceMethod: 'EXTRACT',
    sourcePage: 1,
  },
  {
    key: 'euro_class',
    label: 'Classe Euro',
    value: 'Euro 6',
    confidence: 0.88,
    required: false,
    sourceMethod: 'EXTRACT',
    sourcePage: 1,
  },
  {
    key: 'fuel_type',
    label: 'Tipo di carburante',
    value: 'Diesel',
    confidence: 0.95,
    required: false,
    sourceMethod: 'EXTRACT',
    sourcePage: 1,
  },
  {
    key: 'wltp_homologation',
    label: 'Omologazione WLTP',
    value: '',
    confidence: 0,
    required: false,
    sourceMethod: 'NOT_FOUND',
    sourcePage: null,
  },
  {
    key: 'vehicle_mass_kg',
    label: 'Massa veicolo (kg)',
    value: '1850',
    confidence: 0.72,
    required: false,
    sourceMethod: 'EXTRACT',
    sourcePage: 1,
  },
];

/**
 * @param {string} documentId
 * @param {string} fileName
 */
export function generateMockExtraction(documentId, fileName) {
  return {
    documentId,
    fileName,
    status: 'needs_review',
    entities: [
      {
        entityId: `doc_${documentId}_vehicle`,
        entityType: 'vehicle',
        displayName: 'Veicolo',
        fields: MOCK_FIELDS.map((f) => ({ ...f })),
      },
    ],
    validationIssues: [
      {
        fieldKey: 'vehicle_mass_kg',
        type: 'low_confidence',
        message: 'Massa veicolo (kg): confidenza bassa (72%)',
      },
    ],
    confirmedOutput: null,
  };
}
