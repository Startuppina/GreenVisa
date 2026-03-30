const path = require('path');

const config = {
  provider: process.env.OCR_PROVIDER || 'google-document-ai',
  mockMode: process.env.OCR_MOCK_MODE === 'true',

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
