const googleDocAiService = require('../../services/ocr/googleDocumentAiService');

/** Deterministic Document AI payload for integration tests (no real Google call). */
function getSuccessfulDocAiMockResult() {
  const rawEntities = [
    { type: 'fuel_type', mentionText: 'diesel', confidence: 0.95 },
    { type: 'euro_class', mentionText: 'EURO_6', confidence: 0.95 },
    { type: 'registration_year', mentionText: '2018', confidence: 0.95 },
    { type: 'co2_emissions_g_km', mentionText: '143', confidence: 0.95 },
    { type: 'max_vehicle_mass_kg', mentionText: '7500', confidence: 0.95 },
  ];
  const entities = rawEntities.map((e) => ({
    type: e.type,
    mentionText: e.mentionText,
    confidence: e.confidence,
    normalizedValue: e.mentionText,
    pageNumber: 1,
    boundingPoly: null,
  }));
  return {
    rawProviderOutput: {
      document: { text: 'integration-test', entities: rawEntities },
    },
    entities,
    metadata: { processorName: 'test-processor' },
  };
}

/** Default hooks: successful OCR on every `processDocument` call unless a test overrides the spy. */
function useDocAiSuccessByDefault() {
  beforeEach(() => {
    vi.spyOn(googleDocAiService, 'processDocument').mockResolvedValue(getSuccessfulDocAiMockResult());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
}

module.exports = {
  getSuccessfulDocAiMockResult,
  useDocAiSuccessByDefault,
};
