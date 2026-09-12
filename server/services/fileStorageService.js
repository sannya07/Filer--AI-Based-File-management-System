const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

// In serverless environments (AWS Lambda / Vercel), /var/task is read-only.
// Use os.tmpdir() (/tmp) which is the only writable directory in serverless.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production');
const STORAGE_DIR = isServerless
  ? path.join(os.tmpdir(), 'filer_storage')
  : path.join(__dirname, '../storage/uploads');

// Ensure storage directory exists safely (never crash on module load)
try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Storage directory initialization notice:', err.message);
}

/**
 * Persists a buffer locally for instant on-demand lazy processing
 * @param {string} fileId 
 * @param {string} hash 
 * @param {Buffer} buffer 
 */
const saveLocalBuffer = (fileId, hash, buffer) => {
  try {
    if (fileId) {
      const idPath = path.join(STORAGE_DIR, `${fileId}`);
      fs.writeFileSync(idPath, buffer);
    }
    if (hash) {
      const hashPath = path.join(STORAGE_DIR, `${hash}`);
      fs.writeFileSync(hashPath, buffer);
    }
  } catch (err) {
    console.warn('Could not save local buffer cache:', err.message);
  }
};

/**
 * Retrieves the file buffer for on-demand lazy text extraction
 * @param {Object} file - Mongoose File document
 * @returns {Promise<Buffer>}
 */
const getFileBuffer = async (file) => {
  if (!file) {
    throw new Error('File object is required to retrieve buffer');
  }

  // 1. Try local cache by ID
  const idPath = path.join(STORAGE_DIR, `${file._id}`);
  if (fs.existsSync(idPath)) {
    return fs.readFileSync(idPath);
  }

  // 2. Try local cache by Hash
  if (file.hash) {
    const hashPath = path.join(STORAGE_DIR, `${file.hash}`);
    if (fs.existsSync(hashPath)) {
      return fs.readFileSync(hashPath);
    }
  }

  // 3. Try fetching from Cloudinary URL if it's a real remote URL
  if (
    file.cloudinaryUrl &&
    file.cloudinaryUrl.startsWith('http') &&
    !file.cloudinaryUrl.includes('sample.jpg')
  ) {
    try {
      const response = await axios.get(file.cloudinaryUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      const buffer = Buffer.from(response.data);
      // Cache locally for subsequent questions
      saveLocalBuffer(file._id, file.hash, buffer);
      return buffer;
    } catch (err) {
      console.warn(`Failed to fetch file from Cloudinary (${file.cloudinaryUrl}):`, err.message);
    }
  }

  // 4. Fallback: Synthesize buffer from metadata if no binary is on disk/network
  const syntheticText = [
    `Document Name: ${file.fileName}`,
    `Category: ${file.category || 'General'}`,
    file.subcategory ? `Subcategory: ${file.subcategory}` : '',
    file.summary ? `Summary: ${file.summary}` : '',
    file.description ? `Description: ${file.description}` : '',
    file.tags && file.tags.length > 0 ? `Key Topics: ${file.tags.join(', ')}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  return Buffer.from(syntheticText, 'utf-8');
};

module.exports = {
  saveLocalBuffer,
  getFileBuffer
};
