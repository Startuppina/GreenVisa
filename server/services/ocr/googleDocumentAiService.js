const ocrConfig = require('../../config/ocr');
const { withTimeout } = require('../../utils/withTimeout');
const { OcrProviderTimeoutError } = require('./ocrProviderErrors');

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

/**
 * Build the full processor resource name.
 *
 * @param {object} processorConfig — { processorId, processorVersion }
 */
function buildProcessorName(processorConfig) {
  const { projectId, location } = ocrConfig.google;
  const { processorId, processorVersion } = processorConfig;
  const base = `projects/${projectId}/locations/${location}/processors/${processorId}`;
  return processorVersion ? `${base}/processorVersions/${processorVersion}` : base;
}

const PROCESSOR_VERSION_SEGMENT = '/processorVersions/';

/**
 * Processor version id actually used for this request, from the ProcessDocument response only.
 * Document AI exposes this on Document.revision[].processor (full resource name). If absent, null.
 */
function extractProcessorVersionFromProcessResponse(apiResult) {
  if (!apiResult || typeof apiResult !== 'object') return null;

  const topLevel =
    apiResult.processorVersion ?? apiResult.processor_version;
  if (typeof topLevel === 'string') {
    const fromTop = normalizeProcessorVersionString(topLevel);
    if (fromTop) return fromTop;
  }

  const doc = apiResult.document;
  if (!doc || typeof doc !== 'object') return null;

  const revisions = doc.revisions;
  if (!Array.isArray(revisions) || revisions.length === 0) return null;

  for (let i = revisions.length - 1; i >= 0; i -= 1) {
    const rev = revisions[i];
    if (!rev || typeof rev !== 'object') continue;
    const proc = rev.processor;
    if (typeof proc !== 'string' || !proc) continue;
    const id = normalizeProcessorVersionString(proc);
    if (id) return id;
  }

  return null;
}

function normalizeProcessorVersionString(value) {
  const t = value.trim();
  if (!t) return null;
  const idx = t.indexOf(PROCESSOR_VERSION_SEGMENT);
  if (idx !== -1) {
    const rest = t.slice(idx + PROCESSOR_VERSION_SEGMENT.length);
    const id = rest.split('/')[0];
    return id || null;
  }
  if (!t.includes('/')) return t;
  return null;
}

// ── Public entry point ────────────────────────────────────────

/**
 * Submit a document to Google Document AI and return the trimmed provider result.
 *
 * @param {Buffer} fileBytes
 * @param {string} mimeType
 * @param {object} processorConfig — { processorId, processorVersion } for the target category.
 *   Callers should resolve this from `ocrConfig.google.processors[category]` before calling.
 *   Falls back to the transport processor config when omitted (backward compat).
 */
async function processDocument(fileBytes, mimeType, processorConfig) {
  // Resolve processor config: explicit param > transport default.
  const resolved = processorConfig || ocrConfig.google.processors.transport;

  const { projectId } = ocrConfig.google;
  if (!projectId || !resolved.processorId) {
    throw new Error(
      'Google Document AI not configured. ' +
      'Set GOOGLE_CLOUD_PROJECT_ID and the appropriate GOOGLE_DOCUMENT_AI_*_PROCESSOR_ID',
    );
  }

  const client = getClient();
  const name = buildProcessorName(resolved);

  const request = {
    name,
    rawDocument: {
      content: fileBytes.toString('base64'),
      mimeType,
    },
  };

  const rpcPromise = client.processDocument(request);
  const [result] = await withTimeout(
    rpcPromise,
    ocrConfig.providerTimeoutMs,
    () => new OcrProviderTimeoutError(),
  );

  return {
    rawProviderOutput: buildRawProviderOutputForPersistence(result),
    entities: extractEntitiesFromResponse(result),
    metadata: {
      processorName: name,
      processorVersion: extractProcessorVersionFromProcessResponse(result),
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

module.exports = {
  processDocument,
  buildRawProviderOutputForPersistence,
  extractProcessorVersionFromProcessResponse,
};
