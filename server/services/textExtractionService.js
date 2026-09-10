const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw textual content from uploaded file buffer
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original file name with extension
 * @returns {Promise<string>} Extracted text (truncated to 8,000 characters)
 */
const extractTextFromBuffer = async (buffer, originalName) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Valid buffer is required for text extraction');
  }

  const ext = path.extname(originalName).toLowerCase();
  let extractedText = '';

  try {
    if (ext === '.pdf') {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || '';
    } else if (ext === '.docx' || ext === '.doc') {
      const docxData = await mammoth.extractRawText({ buffer });
      extractedText = docxData.value || '';
    } else if (['.txt', '.csv', '.json', '.md'].includes(ext)) {
      extractedText = buffer.toString('utf-8');
    } else {
      // For images, archives, or other formats without OCR in v1, use filename and header preview
      extractedText = `Document Name: ${originalName}\nFormat: ${ext}\nSize: ${buffer.length} bytes`;
    }
  } catch (error) {
    console.warn(`Text extraction warning for ${originalName}:`, error.message);
    extractedText = `Document Name: ${originalName}\nFile Type: ${ext}`;
  }

  // Clean and cap extracted text to 8,000 characters to prevent prompt bloat
  const cleanedText = extractedText
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000);

  return cleanedText || `File name: ${originalName}`;
};

module.exports = {
  extractTextFromBuffer
};
