/**
 * APE confirm path produces building_certification_prefill (not transport prefill).
 */
const { applyApeNormalizations, validateApeNormalizedOutput } = require('../../services/ocr/apeOcrOutputValidator');
const { buildBuildingCertificationPrefill } = require('../../services/buildingCertification/buildingCertificationOcrPrefillService');

describe('APE OCR confirm payload shape', () => {
  it('builds building certification prefill from reviewed fields', () => {
    const fields = applyApeNormalizations([
      {
        key: 'region',
        label: 'Regione',
        value: 'Lazio',
        confidence: 0.95,
        required: false,
        sourceMethod: 'EXTRACT',
        sourcePage: 1,
        boundingPoly: null,
      },
    ]);
    const validationIssues = validateApeNormalizedOutput(fields);
    const buildingCertificationPrefill = buildBuildingCertificationPrefill({
      documentId: 7,
      reviewFields: fields,
      confirmPass: true,
    });
    const confirmedOutput = {
      fields,
      validationIssues,
      building_certification_prefill: buildingCertificationPrefill,
      confirmedBy: 1,
      confirmedAt: new Date().toISOString(),
    };
    expect(confirmedOutput.building_certification_prefill).toBeDefined();
    expect(confirmedOutput.building_certification_prefill.ocr_document_id).toBe(7);
    expect(confirmedOutput).not.toHaveProperty('transport_v2_vehicle_prefill');
  });
});
