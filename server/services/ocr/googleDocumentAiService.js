const ocrConfig = require('../../config/ocr');

// ── Lazy-loaded Google client ─────────────────────────────────
// Install it when ready for real processing:
//   npm install @google-cloud/documentai
// https://eu-documentai.googleapis.com/v1/projects/764213885095/locations/eu/processors/c6f33fb0291cfb57:process
let DocumentProcessorServiceClient = null;

function getClient() {
  if (!DocumentProcessorServiceClient) {
    try {
      const mod = require('@google-cloud/documentai');
      DocumentProcessorServiceClient = mod.v1.DocumentProcessorServiceClient;
    } catch {
      throw new Error(
        '@google-cloud/documentai is not installed. ' +
        'Run: npm install @google-cloud/documentai',
      );
    }
  }

  return new DocumentProcessorServiceClient({
    apiEndpoint: `${ocrConfig.google.location}-documentai.googleapis.com`,
  });
}

function buildProcessorName() {
  const { projectId, location, processorId, processorVersion } = ocrConfig.google;
  const base = `projects/${projectId}/locations/${location}/processors/${processorId}`;
  return processorVersion ? `${base}/processorVersions/${processorVersion}` : base;
}

// ── Public entry point ────────────────────────────────────────

async function processDocument(fileBytes, mimeType) {

  const { projectId, processorId } = ocrConfig.google;
  if (!projectId || !processorId) {
    throw new Error(
      'Google Document AI not configured. ' +
      'Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_DOCUMENT_AI_PROCESSOR_ID',
    );
  }

  const client = getClient();
  const name = buildProcessorName();

  const request = {
    name,
    rawDocument: {
      content: fileBytes.toString('base64'),
      mimeType,
    },
  };

  const [result] = await client.processDocument(request);

  return {
    rawProviderOutput: buildRawProviderOutputForPersistence(result),
    entities: extractEntitiesFromResponse(result),
    metadata: {
      processorName: name,
      processorVersion: ocrConfig.google.processorVersion || null,
    },
  };
}

/**
 * JSON persisted on document_results.raw_provider_output.
 * Keeps only full OCR text and entity payloads; drops pages/layout/tokens etc.
 */
function buildRawProviderOutputForPersistence(apiResult) {
  const doc = apiResult && apiResult.document;
  if (!doc) {
    return { document: { text: '', entities: [] } };
  }
  const text = typeof doc.text === 'string' ? doc.text : doc.text != null ? String(doc.text) : '';
  const entities = Array.isArray(doc.entities) ? doc.entities : [];
  return { document: { text, entities } };
}

// ── Parse Google response into uniform entity list ────────────

function extractEntitiesFromResponse(result) {
  const doc = result.document;
  if (!doc || !doc.entities) return [];

  return doc.entities.map((entity) => ({
    type: entity.type || '',
    mentionText: entity.mentionText || '',
    confidence: entity.confidence ?? 0,
    normalizedValue: entity.normalizedValue?.text || entity.mentionText || '',
    pageNumber: entity.pageAnchor?.pageRefs?.[0]?.page
      ? Number(entity.pageAnchor.pageRefs[0].page) + 1
      : 1,
    boundingPoly: entity.pageAnchor?.pageRefs?.[0]?.boundingPoly || null,
  }));
}

module.exports = { processDocument, buildRawProviderOutputForPersistence };
