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
  buildApeNormalizedOutput,
  buildApeDerivedOutput,
  buildApeReviewPayload,
} from '../../services/ocr/apeFieldMapper.js';

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
    expect(buildApeNormalizedOutput()).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('derived_output has no transport_v2_vehicle_prefill key', () => {
    expect(buildApeDerivedOutput()).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('review_payload has no transport_v2_vehicle_prefill key', () => {
    expect(buildApeReviewPayload()).not.toHaveProperty('transport_v2_vehicle_prefill');
  });

  it('review_payload has no keys prefixed with transport_', () => {
    const payload = buildApeReviewPayload();
    for (const key of Object.keys(payload)) {
      expect(key).not.toMatch(/^transport_/);
    }
  });

  it('normalized_output default envelope (Batch 3)', () => {
    expect(buildApeNormalizedOutput()).toEqual({
      category: 'ape',
      version: 1,
      fields: [],
      building_certification_prefill: {},
    });
  });

  it('review_payload default envelope includes derivedSummary with consumptions arrays', () => {
    const p = buildApeReviewPayload();
    expect(p.category).toBe('ape');
    expect(p.fields).toEqual([]);
    expect(p.validationIssues).toEqual([]);
    expect(p.building_certification_prefill).toEqual({});
    expect(p.derivedSummary.parsedConsumptions).toEqual([]);
    expect(p.derivedSummary.suspiciousFields).toEqual([]);
  });

  it('derived_output default includes parsedConsumptions and suspiciousFields', () => {
    expect(buildApeDerivedOutput()).toEqual({
      category: 'ape',
      version: 1,
      parsedConsumptions: [],
      suspiciousFields: [],
    });
  });
});
