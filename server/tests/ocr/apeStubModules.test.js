/**
 * Batch 3 — APE module exports: envelope shapes and transport isolation.
 *
 * globals: true in vitest.config.js — describe/it/expect available globally.
 */

import {
  buildApeNormalizedOutput,
  buildApeDerivedOutput,
  buildApeReviewPayload,
} from '../../services/ocr/apeFieldMapper.js';
import {
  validateApeNormalizedOutput,
  applyApeNormalizations,
} from '../../services/ocr/apeOcrOutputValidator.js';
import { buildBuildingCertificationPrefill } from '../../services/buildingCertification/buildingCertificationOcrPrefillService.js';

describe('buildApeNormalizedOutput', () => {
  it('returns an object with category=ape', () => {
    expect(buildApeNormalizedOutput().category).toBe('ape');
  });

  it('returns version=1', () => {
    expect(buildApeNormalizedOutput().version).toBe(1);
  });

  it('defaults to empty fields and empty prefill object', () => {
    const out = buildApeNormalizedOutput();
    expect(out.fields).toEqual([]);
    expect(out.building_certification_prefill).toEqual({});
  });

  it('does NOT include transport_v2_vehicle_prefill', () => {
    expect(buildApeNormalizedOutput()).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('has stable top-level keys', () => {
    expect(Object.keys(buildApeNormalizedOutput()).sort()).toEqual(
      ['building_certification_prefill', 'category', 'fields', 'version'].sort(),
    );
  });
});

describe('buildApeDerivedOutput', () => {
  it('returns category=ape', () => {
    expect(buildApeDerivedOutput().category).toBe('ape');
  });

  it('returns version=1', () => {
    expect(buildApeDerivedOutput().version).toBe(1);
  });

  it('defaults parsedConsumptions and suspiciousFields to empty arrays', () => {
    const d = buildApeDerivedOutput();
    expect(d.parsedConsumptions).toEqual([]);
    expect(d.suspiciousFields).toEqual([]);
  });

  it('does NOT include transport_v2_vehicle_prefill', () => {
    expect(buildApeDerivedOutput()).not.toHaveProperty('transport_v2_vehicle_prefill');
  });
});

describe('buildApeReviewPayload', () => {
  it('returns category=ape', () => {
    expect(buildApeReviewPayload().category).toBe('ape');
  });

  it('returns version=1', () => {
    expect(buildApeReviewPayload().version).toBe(1);
  });

  it('defaults empty fields and validationIssues', () => {
    const p = buildApeReviewPayload();
    expect(p.fields).toEqual([]);
    expect(p.validationIssues).toEqual([]);
  });

  it('has building_certification_prefill and derivedSummary', () => {
    const p = buildApeReviewPayload();
    expect(p.building_certification_prefill).toEqual({});
    expect(p.derivedSummary.category).toBe('ape');
    expect(p.derivedSummary.parsedConsumptions).toEqual([]);
  });

  it('does NOT include transport_v2_vehicle_prefill', () => {
    expect(buildApeReviewPayload()).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('has no transport-prefixed key names on review payload', () => {
    const p = buildApeReviewPayload();
    for (const key of Object.keys(p)) {
      expect(key).not.toMatch(/^transport_/);
    }
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

  it('is callable without arguments without throwing', () => {
    expect(() => buildBuildingCertificationPrefill()).not.toThrow();
  });
});
