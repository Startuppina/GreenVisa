const path = require('path');

function readProviderTimeoutMs() {
  const raw = process.env.OCR_PROVIDER_TIMEOUT_MS;
  if (raw === undefined || raw === '') {
    return 45000;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return 45000;
  }
  return Math.trunc(n);
}

const config = {
  provider: process.env.OCR_PROVIDER || 'google-document-ai',

  /** Wall-clock cap for the synchronous Document AI RPC. Set to 0 to disable (not recommended in production). */
  providerTimeoutMs: readProviderTimeoutMs(),

  google: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    location: process.env.GOOGLE_DOCUMENT_AI_LOCATION || 'eu',
    processorId: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID || '',
    processorVersion: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_VERSION || '',
  },

  upload: {
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxFilesPerBatch: 20,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    storageDir: path.join(__dirname, '..', 'uploaded_documents'),
  },

  confidence: {
    lowThreshold: 0.8,
  },
};

module.exports = config;
