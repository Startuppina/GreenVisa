const path = require('path');
const ocrConfig = require('../../config/ocr');
const { validateMagicBytes } = require('../../utils/fileSignature');
const { computeSha256FromBuffer } = require('../hashService');

function validateFile(file, existingHashes = new Set()) {
  const issues = [];

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ocrConfig.upload.allowedExtensions.includes(ext)) {
    issues.push({
      type: 'invalid_extension',
      message: `Estensione "${ext}" non consentita. Formati accettati: PDF, JPG, PNG.`,
    });
  }

  if (file.mimetype && !ocrConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
    issues.push({
      type: 'invalid_mime_type',
      message: `Tipo MIME "${file.mimetype}" non consentito.`,
    });
  }

  if (file.size > ocrConfig.upload.maxFileSizeBytes) {
    const maxMB = (ocrConfig.upload.maxFileSizeBytes / (1024 * 1024)).toFixed(0);
    issues.push({
      type: 'file_too_large',
      message: `File troppo grande (${(file.size / (1024 * 1024)).toFixed(1)} MB). Limite: ${maxMB} MB.`,
    });
  }

  if (!file.buffer || file.buffer.length === 0) {
    issues.push({ type: 'empty_file', message: 'Il file è vuoto.' });
    return { valid: false, issues, hash: null };
  }

  const sigCheck = validateMagicBytes(file.buffer, file.mimetype);
  if (!sigCheck.valid) {
    issues.push({
      type: 'invalid_signature',
      message: `Il contenuto del file non corrisponde al tipo dichiarato (${file.mimetype}).`,
    });
  }

  const hash = computeSha256FromBuffer(file.buffer);
  if (existingHashes.has(hash)) {
    issues.push({
      type: 'duplicate_file',
      message: 'File duplicato rilevato in questo batch.',
    });
  }

  return { valid: issues.length === 0, issues, hash };
}

module.exports = { validateFile };
