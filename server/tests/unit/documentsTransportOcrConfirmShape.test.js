/**
 * Regression: transport OCR confirm path still produces transport_v2_vehicle_prefill
 * (not building_certification_prefill).
 */
const { applyNormalizations, validateNormalizedOutput } = require('../../services/ocr/ocrOutputValidator');
const { buildTransportV2VehiclePrefill } = require('../../services/transportV2/transportV2OcrPrefillService');

describe('transport OCR confirm payload shape', () => {
  it('builds transport prefill from normalized transport fields', () => {
    const fields = applyNormalizations([
      {
        key: 'fuel_type',
        label: 'Carburante',
        value: 'diesel',
        confidence: 0.95,
        required: false,
        sourceMethod: 'EXTRACT',
        sourcePage: 1,
        boundingPoly: null,
      },
    ]);
    const validationIssues = validateNormalizedOutput(fields);
    const transportV2VehiclePrefill = buildTransportV2VehiclePrefill({
      documentId: 42,
      reviewFields: fields,
    });
    const confirmedOutput = {
      fields,
      validationIssues,
      transport_v2_vehicle_prefill: transportV2VehiclePrefill,
      confirmedBy: 1,
      confirmedAt: new Date().toISOString(),
    };
    expect(confirmedOutput.transport_v2_vehicle_prefill).toBeDefined();
    expect(confirmedOutput.transport_v2_vehicle_prefill.ocr_document_id).toBe(42);
    expect(confirmedOutput).not.toHaveProperty('building_certification_prefill');
  });
});
