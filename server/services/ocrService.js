const googleDocAi = require('./googleDocumentAiService');
const { normalizeProviderOutput } = require('./fieldMapper');
const { validateNormalizedOutput, applyNormalizations } = require('./ocrOutputValidator');
const repo = require('./documentRepository');
const { readFileBytes } = require('./documentStorageService');
const { buildTransportV2VehiclePrefill } = require('./transportV2OcrPrefillService');

async function processDocument(documentRecord) {
  const docId = documentRecord.id;

  try {
    await repo.updateDocumentStatus(docId, 'processing');

    const fileBytes = readFileBytes(documentRecord.storage_path);

    const providerResult = await googleDocAi.processDocument(
      fileBytes,
      documentRecord.mime_type,
    );

    const { fields: rawFields } = normalizeProviderOutput(providerResult);

    const normalizedFields = applyNormalizations(rawFields);

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

    await repo.createResult({
      documentId: docId,
      rawProviderOutput: providerResult.raw,
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

    await repo.updateDocumentStatus(docId, 'needs_review');

    return { status: 'needs_review', fields: normalizedFields, validationIssues };
  } catch (err) {
    console.error(`OCR processing failed for document ${docId}:`, err.message);

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
