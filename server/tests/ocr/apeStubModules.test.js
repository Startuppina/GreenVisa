/**
 * APE OCR shapes aligned with `ocrService.processDocument` (no legacy envelope builders).
 *
 * globals: true in vitest.config.js — describe/it/expect available globally.
 */

import {
  validateApeNormalizedOutput,
  applyApeNormalizations,
} from '../../services/ocr/apeOcrOutputValidator.js';
import {
  normalizeApeProviderOutput,
  markApeSuspiciousLpgFromOcr,
} from '../../services/ocr/apeFieldMapper.js';
import { buildBuildingCertificationPrefill } from '../../services/buildingCertification/buildingCertificationOcrPrefillService.js';

function emptyApePersistedShapes(documentId) {
  const fields = markApeSuspiciousLpgFromOcr(normalizeApeProviderOutput({ entities: [] }).fields);
  const normalizedFields = applyApeNormalizations(fields);
  const buildingCertificationPrefill = buildBuildingCertificationPrefill({
    documentId,
    reviewFields: normalizedFields,
    confirmPass: false,
  });
  const derivedOutput = { building_certification_prefill: buildingCertificationPrefill };
  const normalizedOutput = {
    fields: normalizedFields,
    building_certification_prefill: buildingCertificationPrefill,
  };
  const reviewPayload = {
    fields: normalizedFields,
    validationIssues: validateApeNormalizedOutput(normalizedFields),
    building_certification_prefill: buildingCertificationPrefill,
    derivedSummary: derivedOutput,
  };
  return { normalizedOutput, reviewPayload, derivedOutput };
}

describe('APE persisted shapes (match ocrService.processDocument ape branch)', () => {
  it('normalizedOutput has fields + building_certification_prefill, no transport prefill', () => {
    const { normalizedOutput } = emptyApePersistedShapes(1);
    expect(normalizedOutput).not.toHaveProperty('transport_v2_vehicle_prefill');
    expect(normalizedOutput).toHaveProperty('fields');
    expect(normalizedOutput).toHaveProperty('building_certification_prefill');
    expect(normalizedOutput).not.toHaveProperty('category');
  });

  it('reviewPayload has no transport_v2_vehicle_prefill', () => {
    const { reviewPayload } = emptyApePersistedShapes(2);
    expect(reviewPayload).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('reviewPayload has no keys prefixed with transport_', () => {
    const { reviewPayload } = emptyApePersistedShapes(3);
    for (const key of Object.keys(reviewPayload)) {
      expect(key).not.toMatch(/^transport_/);
    }
  });

  it('derivedOutput is only building_certification_prefill wrapper', () => {
    const { derivedOutput, normalizedOutput } = emptyApePersistedShapes(4);
    expect(derivedOutput).toEqual({
      building_certification_prefill: normalizedOutput.building_certification_prefill,
    });
    expect(derivedOutput).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('derivedSummary in reviewPayload mirrors derivedOutput', () => {
    const { reviewPayload, derivedOutput } = emptyApePersistedShapes(5);
    expect(reviewPayload.derivedSummary).toEqual(derivedOutput);
  });
});

describe('validateApeNormalizedOutput', () => {
  it('returns an empty array for empty input', () => {
    expect(validateApeNormalizedOutput([])).toEqual([]);
  });
});

describe('applyApeNormalizations', () => {
  it('returns empty array for non-array input', () => {
    expect(applyApeNormalizations(null)).toEqual([]);
  });
});

describe('buildBuildingCertificationPrefill', () => {
  it('returns building + consumptions envelope', () => {
    const result = buildBuildingCertificationPrefill({ documentId: 1, reviewFields: [] });
    expect(result).toHaveProperty('building');
    expect(result).toHaveProperty('consumptions');
    expect(Array.isArray(result.consumptions)).toBe(true);
  });

  it('requires documentId and reviewFields', () => {
    expect(() => buildBuildingCertificationPrefill()).toThrow();
  });
});
