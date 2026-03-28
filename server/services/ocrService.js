const googleDocAi = require('./googleDocumentAiService');
const { normalizeProviderOutput } = require('./fieldMapper');
const { validateNormalizedOutput, applyNormalizations } = require('./ocrOutputValidator');
const repo = require('./documentRepository');
const { readFileBytes } = require('./documentStorageService');

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

    const derivedOutput = buildDerivedOutput(normalizedFields);

    const reviewPayload = {
      fields: normalizedFields,
      validationIssues,
      derivedSummary: derivedOutput,
    };

    await repo.createResult({
      documentId: docId,
      rawProviderOutput: providerResult.raw,
      normalizedOutput: { fields: normalizedFields },
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

function buildDerivedOutput(normalizedFields) {
  const fieldMap = Object.fromEntries(normalizedFields.map((f) => [f.key, f.value]));
  return {
    vehicleSummary: {
      registrationYear: fieldMap.registrationYear || null,
      euroClass: fieldMap.euroClass || null,
      fuelType: fieldMap.fuelType || null,
      wltpHomologation: fieldMap.wltpHomologation || null,
      goodsVehicleOver2_5Tons: fieldMap.goodsVehicleOver2_5Tons || null,
    },
  };
}

module.exports = { processDocument };
