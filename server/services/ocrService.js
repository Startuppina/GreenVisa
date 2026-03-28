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

    const hasLowConfidence = validationIssues.some((i) => i.type === 'low_confidence');
    const hasMissing = validationIssues.some((i) => i.type === 'missing_required');
    const finalStatus = hasMissing || hasLowConfidence ? 'needs_review' : 'completed';

    await repo.createResult({
      documentId: docId,
      rawProviderOutput: providerResult.raw,
      normalizedOutput: { fields: normalizedFields },
      validationIssues,
      processorId: providerResult.metadata?.processorName || null,
      processorVersion: providerResult.metadata?.processorVersion || null,
    });

    await repo.updateDocumentStatus(docId, finalStatus);

    return { status: finalStatus, fields: normalizedFields, validationIssues };
  } catch (err) {
    console.error(`OCR processing failed for document ${docId}:`, err.message);

    await repo.updateDocumentStatus(docId, 'failed', {
      errorCode: err.code || 'PROCESSING_ERROR',
      errorMessage: err.message || 'Unknown error during OCR processing',
    });

    return { status: 'failed', error: err.message };
  }
}

module.exports = { processDocument };
