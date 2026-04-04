/**
 * Batch 1 + Batch 2 — ocrService.processDocument: dispatch, persistence, lifecycle, regression.
 *
 * Google, storage, field mapping, validator, transport prefill, and documentRepository are
 * wired with `vi.spyOn` on the real CommonJS modules before `require('./ocrService.js')`
 * so ocrService shares the same instances (Vitest `vi.mock` does not replace nested `require()`).
 *
 * `afterAll` drops `ocrService` from `require.cache` so route tests that `vi.mock` ocrService
 * still work when this file runs first in the same Vitest worker.
 *
 * Env: tests/setup/env.js (vitest root config).
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { realisticApeProviderResult, lowConfidenceApeProviderResult } from '../../tests/ocr/apeBatch3Fixtures.js';

const require = createRequire(import.meta.url);

const defaultGoogleResult = {
  rawProviderOutput: { document: { text: 'test', entities: [] } },
  entities: [],
  metadata: { processorName: 'projects/p/locations/eu/processors/x', processorVersion: null },
};

let processDocument;
let repoModule;
let documentStorageServiceMod;
let googleDocumentAiMod;
let fieldMapperMod;
let ocrOutputValidatorMod;
let transportV2PrefillMod;
let apeFieldMapperMod;
let ocrConfigModule;

function makeDocRecord(overrides = {}) {
  return {
    id: 42,
    storage_path: '/fake/path/doc.pdf',
    mime_type: 'application/pdf',
    batch_id: 7,
    ...overrides,
  };
}

function wireSpies() {
  vi.mocked(documentStorageServiceMod.readFileBytes).mockReturnValue(Buffer.from('fake-bytes'));
  vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue(defaultGoogleResult);
  vi.mocked(fieldMapperMod.normalizeProviderOutput).mockReturnValue({ fields: [] });
  vi.mocked(ocrOutputValidatorMod.validateNormalizedOutput).mockReturnValue([]);
  vi.mocked(ocrOutputValidatorMod.applyNormalizations).mockImplementation((f) => f);
  vi.mocked(ocrOutputValidatorMod.injectDerivedGoodsVehicleReviewField).mockImplementation((f) => f);
  vi.mocked(transportV2PrefillMod.buildTransportV2VehiclePrefill).mockReturnValue({ transport_mode: null });
  vi.mocked(repoModule.updateDocumentStatus).mockResolvedValue({});
  vi.mocked(repoModule.deleteResultByDocumentId).mockResolvedValue(undefined);
  vi.mocked(repoModule.createResult).mockResolvedValue({});
}

function lastCreateResultPayload() {
  const calls = vi.mocked(repoModule.createResult).mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][0];
}

beforeAll(() => {
  documentStorageServiceMod = require('../documents/documentStorageService.js');
  vi.spyOn(documentStorageServiceMod, 'readFileBytes');

  googleDocumentAiMod = require('./googleDocumentAiService.js');
  vi.spyOn(googleDocumentAiMod, 'processDocument');

  fieldMapperMod = require('./fieldMapper.js');
  vi.spyOn(fieldMapperMod, 'normalizeProviderOutput');

  ocrOutputValidatorMod = require('./ocrOutputValidator.js');
  vi.spyOn(ocrOutputValidatorMod, 'validateNormalizedOutput');
  vi.spyOn(ocrOutputValidatorMod, 'applyNormalizations');
  vi.spyOn(ocrOutputValidatorMod, 'injectDerivedGoodsVehicleReviewField');

  transportV2PrefillMod = require('../transportV2/transportV2OcrPrefillService.js');
  vi.spyOn(transportV2PrefillMod, 'buildTransportV2VehiclePrefill');

  repoModule = require('../documents/documentRepository.js');
  vi.spyOn(repoModule, 'updateDocumentStatus');
  vi.spyOn(repoModule, 'deleteResultByDocumentId');
  vi.spyOn(repoModule, 'createResult');

  apeFieldMapperMod = require('./apeFieldMapper.js');

  ocrConfigModule = require('../../config/ocr.js');

  // CJS require so this module shares the same dependency graph as the spies above.
  const ocrMod = require('./ocrService.js');
  processDocument = ocrMod.processDocument;
});

afterAll(() => {
  const ocrPath = require.resolve('./ocrService.js');
  delete require.cache[ocrPath];
});

describe('ocrService.processDocument', () => {
  let normalizeApeProviderOutputSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    wireSpies();
    normalizeApeProviderOutputSpy = vi.spyOn(apeFieldMapperMod, 'normalizeApeProviderOutput');
  });

  afterEach(() => {
    normalizeApeProviderOutputSpy?.mockRestore();
  });

  describe('processor selection (via Google client args)', () => {
    it('transport: passes transport processor config to Document AI', async () => {
      await processDocument(makeDocRecord(), { category: 'transport' });
      expect(googleDocumentAiMod.processDocument).toHaveBeenCalledOnce();
      const [, , processorConfig] = googleDocumentAiMod.processDocument.mock.calls[0];
      expect(processorConfig.processorId).toBe('transport-proc-id');
    });

    it('ape: passes APE processor config to Document AI', async () => {
      await processDocument(makeDocRecord(), { category: 'ape' });
      const [, , processorConfig] = googleDocumentAiMod.processDocument.mock.calls[0];
      expect(processorConfig.processorId).toBe('ape-proc-id');
    });

    it('defaults category to transport when omitted', async () => {
      await processDocument(makeDocRecord());
      const [, , processorConfig] = googleDocumentAiMod.processDocument.mock.calls[0];
      expect(processorConfig.processorId).toBe('transport-proc-id');
    });
  });

  describe('category dispatch', () => {
    it('transport path invokes normalizeProviderOutput, not APE provider normalizer', async () => {
      await processDocument(makeDocRecord(), { category: 'transport' });
      expect(fieldMapperMod.normalizeProviderOutput).toHaveBeenCalled();
      expect(normalizeApeProviderOutputSpy).not.toHaveBeenCalled();
    });

    it('APE path normalizes provider output, not transport field mapper', async () => {
      await processDocument(makeDocRecord(), { category: 'ape' });
      expect(normalizeApeProviderOutputSpy).toHaveBeenCalled();
      expect(fieldMapperMod.normalizeProviderOutput).not.toHaveBeenCalled();
    });

    it('unsupported category fails before category handlers (no silent fallback)', async () => {
      const result = await processDocument(makeDocRecord(), { category: 'invoice' });
      expect(result.status).toBe('failed');
      expect(result.error).toMatch(/No processor config found/i);
      expect(fieldMapperMod.normalizeProviderOutput).not.toHaveBeenCalled();
      expect(normalizeApeProviderOutputSpy).not.toHaveBeenCalled();
    });
  });

  describe('persisted shapes (repository createResult)', () => {
    it('transport: normalized_output has transport shape, no APE category', async () => {
      await processDocument(makeDocRecord(), { category: 'transport' });
      const { normalizedOutput } = lastCreateResultPayload();
      expect(Array.isArray(normalizedOutput.fields)).toBe(true);
      expect(normalizedOutput).toHaveProperty('transport_v2_vehicle_prefill');
      expect(normalizedOutput.transport_v2_vehicle_prefill).toEqual({ transport_mode: null });
      expect(normalizedOutput).not.toHaveProperty('category');
      expect(normalizedOutput).not.toHaveProperty('building_certification_prefill');
    });

    it('ape: normalized_output has fields + prefill when provider has no entities', async () => {
      await processDocument(makeDocRecord(), { category: 'ape' });
      const { normalizedOutput } = lastCreateResultPayload();
      expect(normalizedOutput).not.toHaveProperty('category');
      expect(Array.isArray(normalizedOutput.fields)).toBe(true);
      expect(normalizedOutput.fields.length).toBeGreaterThan(0);
      expect(normalizedOutput.building_certification_prefill).toMatchObject({
        ocr_document_id: 42,
        building: {},
        consumptions: [],
      });
    });

    it('ape: review_payload mirrors normalized fields and derivedSummary when no entities', async () => {
      await processDocument(makeDocRecord(), { category: 'ape' });
      const p = lastCreateResultPayload();
      expect(p.reviewPayload).not.toHaveProperty('category');
      expect(p.reviewPayload.fields).toEqual(p.normalizedOutput.fields);
      expect(p.reviewPayload.validationIssues).toEqual(p.validationIssues);
      expect(p.reviewPayload.building_certification_prefill).toEqual(
        p.normalizedOutput.building_certification_prefill,
      );
      expect(p.reviewPayload.derivedSummary).toEqual(p.derivedOutput);
    });

    it('ape: validation_issues is empty when no extractable entities', async () => {
      await processDocument(makeDocRecord(), { category: 'ape' });
      const { validationIssues } = lastCreateResultPayload();
      expect(validationIssues).toEqual([]);
    });

    it('ape: no transport_v2_vehicle_prefill on normalized_output or review_payload', async () => {
      await processDocument(makeDocRecord(), { category: 'ape' });
      const { normalizedOutput, reviewPayload } = lastCreateResultPayload();
      expect(normalizedOutput).not.toHaveProperty('transport_v2_vehicle_prefill');
      expect(reviewPayload).not.toHaveProperty('transport_v2_vehicle_prefill');
    });
  });

  describe('provider errors', () => {
    it('marks document failed when provider throws', async () => {
      googleDocumentAiMod.processDocument.mockRejectedValueOnce(new Error('Network error'));
      const result = await processDocument(makeDocRecord(), { category: 'transport' });
      expect(result.status).toBe('failed');
      expect(repoModule.updateDocumentStatus).toHaveBeenCalledWith(
        42,
        'failed',
        expect.objectContaining({
          errorCode: expect.anything(),
          errorMessage: expect.stringMatching(/network error/i),
        }),
      );
    });
  });

  describe('Batch 2 — APE OCR execution, persistence, lifecycle, transport regression', () => {
    describe('provider execution', () => {
      it('APE: calls Google processDocument exactly once', async () => {
        await processDocument(makeDocRecord(), { category: 'ape' });
        expect(googleDocumentAiMod.processDocument).toHaveBeenCalledOnce();
      });

      it('APE: readFileBytes is called once with storage_path and bytes are passed to Google', async () => {
        await processDocument(makeDocRecord({ storage_path: '/store/a.pdf' }), { category: 'ape' });
        expect(documentStorageServiceMod.readFileBytes).toHaveBeenCalledTimes(1);
        expect(documentStorageServiceMod.readFileBytes).toHaveBeenCalledWith('/store/a.pdf');
        const [buf] = googleDocumentAiMod.processDocument.mock.calls[0];
        expect(Buffer.isBuffer(buf)).toBe(true);
        expect(buf.equals(Buffer.from('fake-bytes'))).toBe(true);
      });

      it('APE: passes uploaded MIME type to Google', async () => {
        await processDocument(makeDocRecord({ mime_type: 'image/png' }), { category: 'ape' });
        expect(googleDocumentAiMod.processDocument.mock.calls[0][1]).toBe('image/png');
      });

      it('APE: provider receives APE processor id and version from config', async () => {
        await processDocument(makeDocRecord(), { category: 'ape' });
        expect(googleDocumentAiMod.processDocument.mock.calls[0][2]).toEqual({
          processorId: 'ape-proc-id',
          processorVersion: '',
        });
      });

      it('transport: provider still receives transport processor config (regression)', async () => {
        await processDocument(makeDocRecord(), { category: 'transport' });
        expect(googleDocumentAiMod.processDocument.mock.calls[0][2]).toEqual({
          processorId: 'transport-proc-id',
          processorVersion: '',
        });
      });
    });

    describe('persisted raw_provider_output and placeholders (APE)', () => {
      it('persists document.text and document.entities; raw payload has no pages key', async () => {
        vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue({
          rawProviderOutput: {
            document: {
              text: 'ape-text',
              entities: [{ type: 'k', mentionText: 'v' }],
            },
          },
          entities: [],
          metadata: {},
        });
        await processDocument(makeDocRecord(), { category: 'ape' });
        expect(repoModule.createResult).toHaveBeenCalled();
        const { rawProviderOutput } = lastCreateResultPayload();
        expect(rawProviderOutput.document.text).toBe('ape-text');
        expect(rawProviderOutput.document.entities).toEqual([{ type: 'k', mentionText: 'v' }]);
        expect(rawProviderOutput.document).not.toHaveProperty('pages');
      });

      it('APE: derived_output is building_certification_prefill wrapper only', async () => {
        await processDocument(makeDocRecord(), { category: 'ape' });
        const p = lastCreateResultPayload();
        expect(p.derivedOutput).toEqual({
          building_certification_prefill: p.normalizedOutput.building_certification_prefill,
        });
      });

      it('APE: normalized/review payloads have no transport-only keys', async () => {
        await processDocument(makeDocRecord(), { category: 'ape' });
        const { normalizedOutput, reviewPayload, derivedOutput } = lastCreateResultPayload();
        expect(normalizedOutput).not.toHaveProperty('transport_v2_vehicle_prefill');
        expect(reviewPayload).not.toHaveProperty('transport_v2_vehicle_prefill');
        expect(reviewPayload.derivedSummary).toEqual(derivedOutput);
        expect(derivedOutput).not.toHaveProperty('transport_v2_vehicle_prefill');
      });
    });

    describe('lifecycle and errors (APE)', () => {
      it('successful APE ends in needs_review with cleared OCR errors', async () => {
        await processDocument(makeDocRecord(), { category: 'ape' });
        expect(repoModule.updateDocumentStatus).toHaveBeenCalledWith(
          42,
          'needs_review',
          expect.objectContaining({ errorCode: null, errorMessage: null }),
        );
      });

      it('failed APE ends in failed with OCR error metadata and does not call createResult', async () => {
        googleDocumentAiMod.processDocument.mockRejectedValueOnce(new Error('provider down'));
        const result = await processDocument(makeDocRecord(), { category: 'ape' });
        expect(result.status).toBe('failed');
        expect(repoModule.updateDocumentStatus).toHaveBeenCalledWith(
          42,
          'failed',
          expect.objectContaining({
            errorCode: 'PROCESSING_ERROR',
            errorMessage: expect.stringMatching(/provider down/i),
          }),
        );
        expect(repoModule.createResult).not.toHaveBeenCalled();
      });

      it('APE timeout is failed with OCR_PROVIDER_TIMEOUT metadata', async () => {
        const { OcrProviderTimeoutError } = require('./ocrProviderErrors.js');
        googleDocumentAiMod.processDocument.mockRejectedValueOnce(new OcrProviderTimeoutError());
        const result = await processDocument(makeDocRecord(), { category: 'ape' });
        expect(result.status).toBe('failed');
        expect(repoModule.updateDocumentStatus).toHaveBeenCalledWith(
          42,
          'failed',
          expect.objectContaining({
            errorCode: 'OCR_PROVIDER_TIMEOUT',
            errorMessage: expect.stringMatching(/timed out/i),
          }),
        );
      });

      it('missing APE processor id fails clearly and does not use transport processor in the request', async () => {
        const prev = ocrConfigModule.google.processors.ape.processorId;
        ocrConfigModule.google.processors.ape.processorId = '';
        googleDocumentAiMod.processDocument.mockImplementation(async (_buf, _mime, cfg) => {
          if (!cfg.processorId) {
            throw new Error(
              'Google Document AI not configured. Set GOOGLE_CLOUD_PROJECT_ID and the appropriate GOOGLE_DOCUMENT_AI_*_PROCESSOR_ID',
            );
          }
          return defaultGoogleResult;
        });
        try {
          const result = await processDocument(makeDocRecord(), { category: 'ape' });
          expect(result.status).toBe('failed');
          expect(googleDocumentAiMod.processDocument).toHaveBeenCalled();
          const [, , passedCfg] = googleDocumentAiMod.processDocument.mock.calls[0];
          expect(passedCfg.processorId).toBe('');
          expect(passedCfg.processorId).not.toBe(ocrConfigModule.google.processors.transport.processorId);
        } finally {
          ocrConfigModule.google.processors.ape.processorId = prev;
          vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue(defaultGoogleResult);
        }
      });
    });

    describe('transport regression (Batch 2)', () => {
      it('transport OCR still succeeds with needs_review', async () => {
        const result = await processDocument(makeDocRecord(), { category: 'transport' });
        expect(result.status).toBe('needs_review');
      });

      it('transport: createResult raw output carries text and entities without pages', async () => {
        vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue({
          rawProviderOutput: {
            document: { text: 'tr', entities: [{ t: 1 }] },
          },
          entities: [],
          metadata: {},
        });
        await processDocument(makeDocRecord(), { category: 'transport' });
        const { rawProviderOutput } = lastCreateResultPayload();
        expect(rawProviderOutput.document.text).toBe('tr');
        expect(rawProviderOutput.document.entities).toEqual([{ t: 1 }]);
        expect(rawProviderOutput.document).not.toHaveProperty('pages');
      });

      it('transport: normalized output has no APE placeholder keys', async () => {
        await processDocument(makeDocRecord(), { category: 'transport' });
        const { normalizedOutput, reviewPayload } = lastCreateResultPayload();
        expect(normalizedOutput).not.toHaveProperty('category');
        expect(normalizedOutput).not.toHaveProperty('building_certification_prefill');
        expect(reviewPayload).not.toHaveProperty('category');
        expect(reviewPayload).not.toHaveProperty('building_certification_prefill');
      });

      it('transport: provider failure ends in failed', async () => {
        googleDocumentAiMod.processDocument.mockRejectedValueOnce(new Error('rpc fail'));
        const result = await processDocument(makeDocRecord(), { category: 'transport' });
        expect(result.status).toBe('failed');
        expect(repoModule.updateDocumentStatus).toHaveBeenCalledWith(
          42,
          'failed',
          expect.objectContaining({ errorMessage: expect.stringMatching(/rpc fail/i) }),
        );
      });
    });
  });

  describe('Batch 3 — APE semantic orchestration & transport regression', () => {
    it('44: successful APE persists non-empty normalized_output.fields with expected keys', async () => {
      vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue(realisticApeProviderResult());
      await processDocument(makeDocRecord(), { category: 'ape' });
      const { normalizedOutput } = lastCreateResultPayload();
      expect(normalizedOutput.fields.length).toBeGreaterThan(0);
      const keys = normalizedOutput.fields.map((f) => f.key);
      expect(keys).toEqual(
        expect.arrayContaining([
          'region',
          'municipality',
          'consumption_electricity',
          'consumption_natural_gas',
          'consumption_lpg',
        ]),
      );
      const prefill = normalizedOutput.building_certification_prefill;
      expect(prefill.consumptions).toHaveLength(2);
      expect(prefill.consumptions).toContainEqual({
        energySource: 'Elettricità',
        consumption: 4130.84,
        plantId: null,
      });
      expect(prefill.consumptions).toContainEqual({
        energySource: 'Gas naturale',
        consumption: 2000,
        plantId: null,
      });
    });

    it('45: flags suspicious LPG on field and low-confidence region', async () => {
      vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue(realisticApeProviderResult());
      await processDocument(makeDocRecord(), { category: 'ape' });
      const first = lastCreateResultPayload();
      const lpgField = first.normalizedOutput.fields.find((f) => f.key === 'consumption_lpg');
      expect(lpgField?.suspiciousLpg).toBe(true);

      vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue(lowConfidenceApeProviderResult());
      await processDocument(makeDocRecord(), { category: 'ape' });
      const second = lastCreateResultPayload().validationIssues;
      expect(second.some((i) => i.type === 'low_confidence')).toBe(true);
    });

    it('46: derived_output mirrors prefill; GPL omitted from prefill when suspicious', async () => {
      vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue(realisticApeProviderResult());
      await processDocument(makeDocRecord(), { category: 'ape' });
      const { derivedOutput, normalizedOutput } = lastCreateResultPayload();
      expect(derivedOutput).toEqual({
        building_certification_prefill: normalizedOutput.building_certification_prefill,
      });
      expect(
        normalizedOutput.building_certification_prefill.consumptions.some((c) => c.energySource === 'GPL'),
      ).toBe(false);
    });

    it('47: review_payload is fully populated for APE', async () => {
      vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue(realisticApeProviderResult());
      await processDocument(makeDocRecord(), { category: 'ape' });
      const p = lastCreateResultPayload();
      expect(p.reviewPayload.fields.length).toBeGreaterThan(0);
      expect(p.reviewPayload.validationIssues).toEqual(p.validationIssues);
      expect(p.reviewPayload.building_certification_prefill).toEqual(p.normalizedOutput.building_certification_prefill);
      expect(p.reviewPayload.derivedSummary).toEqual(p.derivedOutput);
    });

    it('48: processDocument return includes real APE fields for the upload response', async () => {
      vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue(realisticApeProviderResult());
      const result = await processDocument(makeDocRecord(), { category: 'ape' });
      expect(result.fields.length).toBeGreaterThan(0);
      expect(result.fields.map((f) => f.key)).toContain('region');
    });

    it('50–51: trimmed raw provider output and no transport keys on APE semantic payloads', async () => {
      vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue(realisticApeProviderResult());
      await processDocument(makeDocRecord(), { category: 'ape' });
      const p = lastCreateResultPayload();
      expect(p.rawProviderOutput.document.text).toBeTruthy();
      expect(Array.isArray(p.rawProviderOutput.document.entities)).toBe(true);
      expect(p.rawProviderOutput.document).not.toHaveProperty('pages');
      expect(p.normalizedOutput).not.toHaveProperty('transport_v2_vehicle_prefill');
      expect(p.reviewPayload).not.toHaveProperty('transport_v2_vehicle_prefill');
      expect(p.derivedOutput).not.toHaveProperty('transport_v2_vehicle_prefill');
    });

    it('52: transport field mapper output still flows into normalized_output.fields', async () => {
      vi.mocked(fieldMapperMod.normalizeProviderOutput).mockReturnValue({
        fields: [
          {
            key: 'fuel_type',
            label: 'Fuel',
            value: 'diesel',
            confidence: 0.99,
            sourceMethod: 'EXTRACT',
            sourcePage: 1,
            boundingPoly: null,
            required: false,
            normalizedValue: 'diesel',
          },
        ],
      });
      await processDocument(makeDocRecord(), { category: 'transport' });
      expect(fieldMapperMod.normalizeProviderOutput).toHaveBeenCalled();
      const { normalizedOutput } = lastCreateResultPayload();
      expect(normalizedOutput.fields.some((f) => f.key === 'fuel_type')).toBe(true);
    });

    it('53: transport review payload shape has no APE-only building_certification_prefill', async () => {
      await processDocument(makeDocRecord(), { category: 'transport' });
      expect(lastCreateResultPayload().reviewPayload).not.toHaveProperty('building_certification_prefill');
    });

    it('54–55: transport raw output stays trimmed and success path remains needs_review', async () => {
      vi.mocked(googleDocumentAiMod.processDocument).mockResolvedValue({
        rawProviderOutput: {
          document: { text: 'reg', entities: [{ type: 'fuel_type' }] },
        },
        entities: [],
        metadata: {},
      });
      const result = await processDocument(makeDocRecord(), { category: 'transport' });
      expect(result.status).toBe('needs_review');
      expect(lastCreateResultPayload().rawProviderOutput.document).not.toHaveProperty('pages');
    });
  });
});
