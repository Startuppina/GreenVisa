const crypto = require('crypto');

function computeSha256FromBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = { computeSha256FromBuffer };
