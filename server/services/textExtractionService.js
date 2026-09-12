const path = require('path');

// Polyfill DOMMatrix for PDF parsing in headless/serverless environments
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
  };
}

let pdfParseModule = null;
const getPdfParser = () => {
  if (!pdfParseModule) {
    try {
      pdfParseModule = require('pdf-parse');
    } catch (err) {
      console.warn('pdf-parse lazy load notice:', err.message);
    }
  }
  return pdfParseModule;
};

let mammothModule = null;
const getMammoth = () => {
  if (!mammothModule) {
    try {
      mammothModule = require('mammoth');
    } catch (err) {
      console.warn('mammoth lazy load notice:', err.message);
    }
  }
  return mammothModule;
};

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
      const parser = getPdfParser();
      if (typeof parser === 'function') {
        const pdfData = await parser(buffer);
        extractedText = pdfData.text || '';
      } else if (parser && parser.PDFParse) {
        const instance = new parser.PDFParse({ data: buffer });
        try {
          const result = await instance.getText();
          extractedText = result.text || '';
        } finally {
          await instance.destroy();
        }
      } else {
        extractedText = `Document Name: ${originalName}\nFormat: ${ext}\nSize: ${buffer.length} bytes`;
      }
    } else if (ext === '.docx' || ext === '.doc') {
      const mammoth = getMammoth();
      if (mammoth) {
        const docxData = await mammoth.extractRawText({ buffer });
        extractedText = docxData.value || '';
      } else {
        extractedText = `Document Name: ${originalName}\nFormat: ${ext}\nSize: ${buffer.length} bytes`;
      }
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
