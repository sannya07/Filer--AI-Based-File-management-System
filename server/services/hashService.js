const crypto = require('crypto');

/**
 * Generates SHA-256 hash string for duplicate detection
 * @param {Buffer} buffer - File buffer
 * @returns {string} Hexadecimal hash
 */
const generateHash = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Valid buffer is required for hash generation');
  }
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

module.exports = {
  generateHash
};
