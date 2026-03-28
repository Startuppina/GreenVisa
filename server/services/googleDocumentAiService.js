const ocrConfig = require('../config/ocr');

// ── Lazy-loaded Google client ─────────────────────────────────
// The @google-cloud/documentai package is NOT required in mock mode.
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
        'Run: npm install @google-cloud/documentai  — or enable OCR_MOCK_MODE=true',
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
  if (ocrConfig.mockMode) {
    return generateMockResponse();
  }

  const { projectId, processorId } = ocrConfig.google;
  if (!projectId || !processorId) {
    throw new Error(
      'Google Document AI not configured. ' +
      'Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_DOCUMENT_AI_PROCESSOR_ID, or enable OCR_MOCK_MODE=true.',
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
    raw: result,
    entities: extractEntitiesFromResponse(result),
    metadata: {
      processorName: name,
      processorVersion: ocrConfig.google.processorVersion || null,
    },
  };
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

// ── Mock response ─────────────────────────────────────────────
// Returns the same shape as the real path.
// Confidence values are set so some fields trigger low-confidence
// warnings in the review UI (threshold is typically 0.8).

function generateMockResponse() {
  const entities = [
    {
      type: 'registration_year',
      mentionText: '2019',
      confidence: 0.93,
      normalizedValue: '2019',
      pageNumber: 1,
      boundingPoly: null,
    },
    {
      type: 'euro_class',
      mentionText: 'Euro 6',
      confidence: 0.58,
      normalizedValue: 'Euro 6',
      pageNumber: 1,
      boundingPoly: null,
    },
    {
      type: 'fuel_type',
      mentionText: 'Diesel',
      confidence: 0.95,
      normalizedValue: 'Diesel',
      pageNumber: 1,
      boundingPoly: null,
    },
    {
      type: 'wltp_homologation',
      mentionText: 'Si',
      confidence: 0.72,
      normalizedValue: 'Si',
      pageNumber: 1,
      boundingPoly: null,
    },
    {
      type: 'goods_vehicle_over_2_5_tons',
      mentionText: 'No',
      confidence: 0.61,
      normalizedValue: 'No',
      pageNumber: 1,
      boundingPoly: null,
    },
  ];

  const rawGoogleShape = {
    document: {
      entities: entities.map((e) => ({
        type: e.type,
        mentionText: e.mentionText,
        confidence: e.confidence,
        normalizedValue: { text: e.normalizedValue },
        pageAnchor: {
          pageRefs: [{ page: String(e.pageNumber - 1) }],
        },
      })),
    },
  };

  return {
    raw: rawGoogleShape,
    entities,
    metadata: {
      processorName: 'projects/mock-project/locations/eu/processors/mock-processor',
      processorVersion: 'mock-v1',
    },
  };
}

module.exports = { processDocument };
