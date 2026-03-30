const fs = require('fs');
const ocrConfig = require('../../config/ocr');
const { resetTestDb, setupTestDb, teardownTestDb } = require('./testDb');

function resetUploadedDocumentsDir() {
  try {
    if (fs.existsSync(ocrConfig.upload.storageDir)) {
      fs.rmSync(ocrConfig.upload.storageDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Failed to reset uploaded documents directory:', error);
  }
}

function registerIntegrationHooks() {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    resetUploadedDocumentsDir();
    await resetTestDb();
  });

  afterAll(async () => {
    resetUploadedDocumentsDir();
    await teardownTestDb();
  });
}

module.exports = {
  registerIntegrationHooks,
};
