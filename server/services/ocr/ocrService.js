const googleDocAi = require('./googleDocumentAiService');
const { normalizeProviderOutput } = require('./fieldMapper');
const {
  validateNormalizedOutput,
  applyNormalizations,
  injectDerivedGoodsVehicleReviewField,
} = require('./ocrOutputValidator');
const repo = require('../documents/documentRepository');
const documentStorageService = require('../documents/documentStorageService');
const { buildTransportV2VehiclePrefill } = require('../transportV2OcrPrefillService');
const logger = require('../../logger');

/**
 * Run the full OCR pipeline for a stored document.
 *
 * @param {object} documentRecord — row from `documents` (needs `id`, `storage_path`, `mime_type`).
 * @param {object} [options]
 * @param {boolean} [options.skipMarkProcessing] — when true, the document is already `processing`
 *   (e.g. claimed by the background worker). Skips the initial status transition.
 */
async function processDocument(documentRecord, options = {}) {
  const docId = documentRecord.id;
  const { skipMarkProcessing = false } = options;

  try {
    if (!skipMarkProcessing) {
      await repo.updateDocumentStatus(docId, 'processing', {
        errorCode: null,
        errorMessage: null,
      });
    }

    const fileBytes = documentStorageService.readFileBytes(documentRecord.storage_path);

    const providerResult = await googleDocAi.processDocument(
      fileBytes,
      documentRecord.mime_type,
    );

    const { fields: rawFields } = normalizeProviderOutput(providerResult);

    const normalizedFields = injectDerivedGoodsVehicleReviewField(applyNormalizations(rawFields));

    const validationIssues = validateNormalizedOutput(normalizedFields);

    const transportV2VehiclePrefill = buildTransportV2VehiclePrefill({
      documentId: docId,
      reviewFields: normalizedFields,
    });

    const derivedOutput = buildDerivedOutput(transportV2VehiclePrefill);

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
      processorId: providerResult.metadata?.processorName || null,
      processorVersion: providerResult.metadata?.processorVersion || null,
    });

    await repo.updateDocumentStatus(docId, 'needs_review', {
      errorCode: null,
      errorMessage: null,
    });

    return { status: 'needs_review', fields: normalizedFields, validationIssues };
  } catch (err) {
    if (err.code === 'OCR_PROVIDER_TIMEOUT') {
      logger.warn(
        {
          event: 'ocr_provider_timeout',
          document_id: docId,
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

function buildDerivedOutput(transportV2VehiclePrefill) {
  return {
    transport_v2_vehicle_prefill: transportV2VehiclePrefill,
  };
}

module.exports = { processDocument };
