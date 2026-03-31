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
        fields: [
          {
            key: 'registration_year',
            value: 2021,
            confidence: 0.94,
          },
          {
            key: 'fuel_type',
            value: 'diesel',
            confidence: 0.91,
          },
          {
            key: 'euro_class',
            value: 'EURO_6',
            confidence: 0.9,
          },
        ],
      },
    ],
    validationIssues: [],
    confirmedOutput: null,
  };
}
