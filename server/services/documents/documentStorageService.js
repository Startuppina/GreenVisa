const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ocrConfig = require('../../config/ocr');

function ensureStorageDir() {
  if (!fs.existsSync(ocrConfig.upload.storageDir)) {
    fs.mkdirSync(ocrConfig.upload.storageDir, { recursive: true });
  }
}

function generateSafeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const uid = crypto.randomUUID();
  return `${Date.now()}_${uid}${ext}`;
}

function storeFileFromBuffer(buffer, originalName) {
  ensureStorageDir();
  const safeName = generateSafeFilename(originalName);
  const destPath = path.join(ocrConfig.upload.storageDir, safeName);
  fs.writeFileSync(destPath, buffer);
  return { storedName: safeName, storagePath: destPath };
}

function readFileBytes(storagePath) {
  return fs.readFileSync(storagePath);
}

function deleteStoredFile(storagePath) {
  try {
    if (fs.existsSync(storagePath)) fs.unlinkSync(storagePath);
  } catch (err) {
    console.error(`Failed to delete file at ${storagePath}:`, err.message);
  }
}

module.exports = { storeFileFromBuffer, readFileBytes, deleteStoredFile, ensureStorageDir };
