const googleDocAi = require('./googleDocumentAiService');
const { normalizeProviderOutput } = require('./fieldMapper');
const apeFieldMapper = require('./apeFieldMapper');
const {
  validateNormalizedOutput,
  applyNormalizations,
  injectDerivedGoodsVehicleReviewField,
} = require('./ocrOutputValidator');
const { applyApeNormalizations, validateApeNormalizedOutput } = require('./apeOcrOutputValidator');
const repo = require('../documents/documentRepository');
const documentStorageService = require('../documents/documentStorageService');
const { buildTransportV2VehiclePrefill } = require('../transportV2/transportV2OcrPrefillService');
const { buildBuildingCertificationPrefill } = require('../buildingCertification/buildingCertificationOcrPrefillService');
const logger = require('../../logger');
const ocrConfig = require('../../config/ocr');

function resolveProcessorConfig(category) {
  const config = ocrConfig.google.processors[category];
  if (!config) {
    throw new Error(`No processor config found for category: ${category}`);
  }
  return config;
}

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
  const { skipMarkProcessing = false, category: optionCategory = 'transport' } = options;

  try {
    if (!skipMarkProcessing) {
      await repo.updateDocumentStatus(docId, 'processing', {
        errorCode: null,
        errorMessage: null,
      });
    }

    const batchRow =
      documentRecord.batch_id != null ? await repo.getBatchById(documentRecord.batch_id) : null;
    const category = batchRow?.category || optionCategory;

    const fileBytes = documentStorageService.readFileBytes(documentRecord.storage_path);

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

    let normalizedFields;
    let validationIssues;
    let normalizedOutput;
    let derivedOutput;
    let reviewPayload;

    if (category === 'ape') {
      const rawApeFields = apeFieldMapper.markApeSuspiciousLpgFromOcr(
        apeFieldMapper.normalizeApeProviderOutput(providerResult).fields,
      );
      normalizedFields = applyApeNormalizations(rawApeFields);
      validationIssues = validateApeNormalizedOutput(normalizedFields);
      const buildingCertificationPrefill = buildBuildingCertificationPrefill({
        documentId: docId,
        reviewFields: normalizedFields,
        confirmPass: false,
      });
      derivedOutput = { building_certification_prefill: buildingCertificationPrefill };
      reviewPayload = {
        fields: normalizedFields,
        validationIssues,
        building_certification_prefill: buildingCertificationPrefill,
        derivedSummary: derivedOutput,
      };
      normalizedOutput = {
        fields: normalizedFields,
        building_certification_prefill: buildingCertificationPrefill,
      };
    } else {
      const { fields: rawFields } = normalizeProviderOutput(providerResult);
      normalizedFields = injectDerivedGoodsVehicleReviewField(applyNormalizations(rawFields));
      validationIssues = validateNormalizedOutput(normalizedFields);
      const transportV2VehiclePrefill = buildTransportV2VehiclePrefill({
        documentId: docId,
        reviewFields: normalizedFields,
      });
      derivedOutput = buildDerivedTransportDerivedOutput(transportV2VehiclePrefill);
      reviewPayload = {
        fields: normalizedFields,
        validationIssues,
        transport_v2_vehicle_prefill: transportV2VehiclePrefill,
        derivedSummary: derivedOutput,
      };
      normalizedOutput = {
        fields: normalizedFields,
        transport_v2_vehicle_prefill: transportV2VehiclePrefill,
      };
    }

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

function buildDerivedTransportDerivedOutput(transportV2VehiclePrefill) {
  return {
    transport_v2_vehicle_prefill: transportV2VehiclePrefill,
  };
}

module.exports = { processDocument, resolveProcessorConfig };
