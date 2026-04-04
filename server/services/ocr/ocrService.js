const googleDocAi = require('./googleDocumentAiService');
const fieldMapper = require('./fieldMapper');
const {
  validateNormalizedOutput,
  applyNormalizations,
  injectDerivedGoodsVehicleReviewField,
} = require('./ocrOutputValidator');
const repo = require('../documents/documentRepository');
const documentStorageService = require('../documents/documentStorageService');
const { buildTransportV2VehiclePrefill } = require('../transportV2/transportV2OcrPrefillService');
const ocrConfig = require('../../config/ocr');
const logger = require('../../logger');

// ── APE post-processing modules ───────────────────────────────────────────────
const apeFieldMapper = require('./apeFieldMapper');
const { validateApeNormalizedOutput, applyApeNormalizations } = require('./apeOcrOutputValidator');
const { buildBuildingCertificationPrefill } = require('../buildingCertification/buildingCertificationOcrPrefillService');

/**
 * Run the full OCR pipeline for a stored document.
 *
 * @param {object} documentRecord — row from `documents` (needs `id`, `storage_path`, `mime_type`).
 * @param {object} [options]
 * @param {string} [options.category] — 'transport' | 'ape'. Defaults to 'transport'.
 * @param {boolean} [options.skipMarkProcessing] — when true, the document is already `processing`
 *   (e.g. claimed by the background worker). Skips the initial status transition.
 */
async function processDocument(documentRecord, options = {}) {
  const docId = documentRecord.id;
  const { skipMarkProcessing = false, category = 'transport' } = options;

  try {
    if (!skipMarkProcessing) {
      await repo.updateDocumentStatus(docId, 'processing', {
        errorCode: null,
        errorMessage: null,
      });
    }

    const fileBytes = documentStorageService.readFileBytes(documentRecord.storage_path);

    // ── Resolve the correct Google processor for this category ────────────
    const processorConfig = resolveProcessorConfig(category);

    logger.info(
      {
        event: 'ocr_processor_selected',
        document_id: docId,
        category,
        processor_id: processorConfig.processorId || '(not configured)',
      },
      'OCR processor resolved for category',
    );

    const providerResult = await googleDocAi.processDocument(
      fileBytes,
      documentRecord.mime_type,
      processorConfig,
    );

    // ── Category dispatch ─────────────────────────────────────────────────
    // Each category has its own post-processing path. Generic OCR shell steps
    // (file read, provider call, raw persistence) are shared above.
    if (category === 'transport') {
      return await processTransportDocument(docId, providerResult);
    } else if (category === 'ape') {
      return await processApeDocument(docId, providerResult);
    } else {
      // Should never reach here — category is validated at the route level.
      throw new Error(`Unsupported OCR category: "${category}"`);
    }
  } catch (err) {
    if (err.code === 'OCR_PROVIDER_TIMEOUT') {
      logger.warn(
        {
          event: 'ocr_provider_timeout',
          document_id: docId,
          category,
          retryable: err.retryable === true,
          err: { message: err.message, code: err.code },
        },
        err.message || 'Google Document AI request timed out',
      );
    } else {
      logger.error(
        {
          event: 'ocr_processing_failed',
          document_id: docId,
          category,
          err: { message: err.message, code: err.code },
        },
        'OCR provider or pipeline failed',
      );
    }

    await repo.updateDocumentStatus(docId, 'failed', {
      errorCode: err.code || 'PROCESSING_ERROR',
      errorMessage: err.message || 'Unknown error during OCR processing',
    });

    return { status: 'failed', error: err.message };
  }
}

// ── Processor config resolution ───────────────────────────────────────────────

/**
 * Return the Google Document AI processor config for the given category.
 * Throws if the category is not recognised (defence-in-depth; routes validate first).
 *
 * @param {string} category
 * @returns {{ processorId: string, processorVersion: string }}
 */
function resolveProcessorConfig(category) {
  const processors = ocrConfig.google.processors;
  if (processors[category]) {
    return processors[category];
  }
  throw new Error(`No processor config found for category "${category}"`);
}

// ── Transport-specific OCR post-processing ────────────────────────────────────

async function processTransportDocument(docId, providerResult) {
  const { fields: rawFields } = fieldMapper.normalizeProviderOutput(providerResult);

  const normalizedFields = injectDerivedGoodsVehicleReviewField(applyNormalizations(rawFields));

  const validationIssues = validateNormalizedOutput(normalizedFields);

  const transportV2VehiclePrefill = buildTransportV2VehiclePrefill({
    documentId: docId,
    reviewFields: normalizedFields,
  });

  const derivedOutput = {
    transport_v2_vehicle_prefill: transportV2VehiclePrefill,
  };

  const reviewPayload = {
    fields: normalizedFields,
    validationIssues,
    transport_v2_vehicle_prefill: transportV2VehiclePrefill,
    derivedSummary: derivedOutput,
  };

  await repo.deleteResultByDocumentId(docId);

  await repo.createResult({
    documentId: docId,
    rawProviderOutput: providerResult.rawProviderOutput,
    normalizedOutput: {
      fields: normalizedFields,
      transport_v2_vehicle_prefill: transportV2VehiclePrefill,
    },
    derivedOutput,
    reviewPayload,
    validationIssues,
  });

  await repo.updateDocumentStatus(docId, 'needs_review', {
    errorCode: null,
    errorMessage: null,
  });

  return { status: 'needs_review', fields: normalizedFields, validationIssues };
}

// ── APE OCR post-processing (Batch 3: semantic layer) ─────────────────────────

async function processApeDocument(docId, providerResult) {
  const rawEntities = providerResult.rawProviderOutput?.document?.entities;
  const rawFields = apeFieldMapper.mapApeProviderEntitiesToFields(providerResult.entities, rawEntities);
  const normalizedFields = applyApeNormalizations(rawFields);
  const validationIssues = validateApeNormalizedOutput(normalizedFields);
  const derivedOutput = apeFieldMapper.buildApeDerivedOutputFromNormalizedFields(normalizedFields);
  const prefill = buildBuildingCertificationPrefill({
    documentId: docId,
    reviewFields: normalizedFields,
    validationIssues,
  });

  const normalizedOutput = apeFieldMapper.buildApeNormalizedOutput(normalizedFields, prefill);
  const reviewPayload = apeFieldMapper.buildApeReviewPayload({
    fields: normalizedFields,
    validationIssues,
    building_certification_prefill: prefill,
    derivedSummary: derivedOutput,
  });

  await repo.deleteResultByDocumentId(docId);

  await repo.createResult({
    documentId: docId,
    rawProviderOutput: providerResult.rawProviderOutput,
    normalizedOutput,
    derivedOutput,
    reviewPayload,
    validationIssues,
  });

  await repo.updateDocumentStatus(docId, 'needs_review', {
    errorCode: null,
    errorMessage: null,
  });

  logger.info(
    { event: 'ocr_ape_result_persisted', document_id: docId },
    'APE OCR result persisted',
  );

  return { status: 'needs_review', fields: normalizedFields, validationIssues };
}

module.exports = { processDocument, resolveProcessorConfig };
