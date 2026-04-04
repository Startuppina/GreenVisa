/**
 * Batch 1 + Batch 2 — ocrService: processor selection and lifecycle tests.
 *
 * resolveProcessorConfig is a pure function that reads from ocrConfig.
 * It requires no mocking — the env vars are set in tests/setup/env.js.
 *
 * Batch 2 additions:
 *   - APE processor config selects the APE-specific processor id (not transport)
 *   - processDocument throws a clear error when the APE processor is unconfigured
 *   - The APE output skeleton has no transport-specific keys (contract guard)
 *
 * globals: true in vitest.config.js — describe/it/expect available globally.
 */

import { resolveProcessorConfig } from '../../services/ocr/ocrService.js';
import { processDocument as googleProcessDocument } from '../../services/ocr/googleDocumentAiService.js';
import {
  normalizeApeProviderOutput,
  markApeSuspiciousLpgFromOcr,
} from '../../services/ocr/apeFieldMapper.js';
import { applyApeNormalizations, validateApeNormalizedOutput } from '../../services/ocr/apeOcrOutputValidator.js';
import { buildBuildingCertificationPrefill } from '../../services/buildingCertification/buildingCertificationOcrPrefillService.js';

function buildApeNormalizedOutputLike(documentId = 1) {
  const fields = markApeSuspiciousLpgFromOcr(normalizeApeProviderOutput({ entities: [] }).fields);
  const normalizedFields = applyApeNormalizations(fields);
  const prefill = buildBuildingCertificationPrefill({
    documentId,
    reviewFields: normalizedFields,
    confirmPass: false,
  });
  return {
    fields: normalizedFields,
    building_certification_prefill: prefill,
  };
}

function buildApeDerivedOutputLike(documentId = 1) {
  const normalized = buildApeNormalizedOutputLike(documentId);
  return { building_certification_prefill: normalized.building_certification_prefill };
}

function buildApeReviewPayloadLike(documentId = 1) {
  const normalized = buildApeNormalizedOutputLike(documentId);
  const derived = buildApeDerivedOutputLike(documentId);
  return {
    fields: normalized.fields,
    validationIssues: validateApeNormalizedOutput(normalized.fields),
    building_certification_prefill: normalized.building_certification_prefill,
    derivedSummary: derived,
  };
}

// ── resolveProcessorConfig ────────────────────────────────────────────────────

describe('resolveProcessorConfig — category-aware processor selection', () => {
  it('transport: returns transport processor config', () => {
    const config = resolveProcessorConfig('transport');
    expect(config).toBeDefined();
    expect(config.processorId).toBe('transport-proc-id');
  });

  it('ape: returns APE processor config', () => {
    const config = resolveProcessorConfig('ape');
    expect(config).toBeDefined();
    expect(config.processorId).toBe('ape-proc-id');
  });

  it('transport and APE use different processor ids (Batch 2: live execution guard)', () => {
    const transport = resolveProcessorConfig('transport');
    const ape = resolveProcessorConfig('ape');
    expect(transport.processorId).not.toBe(ape.processorId);
  });

  it('throws for an unsupported category', () => {
    expect(() => resolveProcessorConfig('unknown-category')).toThrow(
      /No processor config found for category/,
    );
  });

  it('transport config has processorId and processorVersion fields', () => {
    const config = resolveProcessorConfig('transport');
    expect(config).toHaveProperty('processorId');
    expect(config).toHaveProperty('processorVersion');
  });

  it('ape config has processorId and processorVersion fields', () => {
    const config = resolveProcessorConfig('ape');
    expect(config).toHaveProperty('processorId');
    expect(config).toHaveProperty('processorVersion');
  });
});

// ── APE provider config validation (Batch 2) ─────────────────────────────────
// When the APE processor ID env var is not set, the provider layer must throw
// a clear error before attempting any RPC call.

describe('APE provider config — unconfigured processor guard', () => {
  it('provider throws when APE processorId is empty string', async () => {
    await expect(
      googleProcessDocument(
        Buffer.from('test'),
        'application/pdf',
        { processorId: '', processorVersion: '' },
      ),
    ).rejects.toThrow(/not configured/i);
  });

  it('error message references Google Document AI env var names', async () => {
    await expect(
      googleProcessDocument(
        Buffer.from('test'),
        'application/pdf',
        { processorId: '', processorVersion: '' },
      ),
    ).rejects.toThrow(/GOOGLE_DOCUMENT_AI/);
  });
});

// ── APE output contract guard (Batch 2) ──────────────────────────────────────
// Guards against transport-specific keys leaking into APE outputs during
// the full provider → persist lifecycle.

describe('APE post-processing output contract', () => {
  it('normalized_output has no transport_v2_vehicle_prefill key', () => {
    expect(buildApeNormalizedOutputLike()).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('derived_output has no transport_v2_vehicle_prefill key', () => {
    expect(buildApeDerivedOutputLike()).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('review_payload has no transport_v2_vehicle_prefill key', () => {
    expect(buildApeReviewPayloadLike()).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('review_payload has no keys prefixed with transport_', () => {
    const payload = buildApeReviewPayloadLike();
    for (const key of Object.keys(payload)) {
      expect(key).not.toMatch(/^transport_/);
    }
  });

  it('normalized_output default shape (empty provider entities)', () => {
    const out = buildApeNormalizedOutputLike(99);
    expect(out.fields.length).toBeGreaterThan(0);
    expect(out.building_certification_prefill).toMatchObject({
      ocr_document_id: 99,
      building: {},
      consumptions: [],
    });
  });

  it('review_payload default includes derivedSummary mirroring derived_output', () => {
    const p = buildApeReviewPayloadLike(7);
    expect(p.fields).toEqual(buildApeNormalizedOutputLike(7).fields);
    expect(p.validationIssues).toEqual(validateApeNormalizedOutput(p.fields));
    expect(p.derivedSummary).toEqual(buildApeDerivedOutputLike(7));
  });

  it('derived_output default is building_certification_prefill only', () => {
    expect(buildApeDerivedOutputLike(3)).toEqual({
      building_certification_prefill: buildApeNormalizedOutputLike(3).building_certification_prefill,
    });
  });
});
