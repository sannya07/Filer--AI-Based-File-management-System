const { extractTextFromBuffer } = require('../services/textExtractionService');
const { analyzeDocumentText } = require('../services/aiService');

/**
 * @desc    Analyze uploaded document buffer using AI before saving to cloud
 * @route   POST /api/ai/analyze
 * @access  Private
 */
const analyzeDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a file to analyze.'
      });
    }

    const { originalname, buffer, size } = req.file;

    // 1. Extract text from buffer
    const text = await extractTextFromBuffer(buffer, originalname);

    // 2. Perform AI classification and summarization
    const analysis = await analyzeDocumentText(text, originalname);

    res.status(200).json({
      success: true,
      fileName: originalname,
      fileSize: size,
      ...analysis
    });
  } catch (error) {
    console.error('AI Analysis Controller Error:', error);
    next(error);
  }
};

module.exports = {
  analyzeDocument
};
