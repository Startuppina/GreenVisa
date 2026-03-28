const SIGNATURES = {
  'application/pdf': { bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 },
  'image/jpeg':      { bytes: [0xFF, 0xD8, 0xFF],       offset: 0 },
  'image/png':       { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 },
};

function validateMagicBytes(buffer, mimeType) {
  const sig = SIGNATURES[mimeType];
  if (!sig) {
    return { valid: false, reason: `No known signature for MIME type "${mimeType}"` };
  }

  if (buffer.length < sig.offset + sig.bytes.length) {
    return { valid: false, reason: 'File too small to contain valid magic bytes' };
  }

  for (let i = 0; i < sig.bytes.length; i++) {
    if (buffer[sig.offset + i] !== sig.bytes[i]) {
      return { valid: false, reason: `File content does not match expected ${mimeType} signature` };
    }
  }

  return { valid: true };
}

module.exports = { validateMagicBytes };
