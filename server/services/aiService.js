const axios = require('axios');
const config = require('../config/config');

const DEFAULT_CATEGORIES = config.defaultCategories;

/**
 * Checks if OpenRouter is properly configured with a live key
 */
const isOpenRouterConfigured = () => {
  const { apiKey } = config.openRouter;
  return Boolean(apiKey && apiKey !== 'your_openrouter_api_key');
};

const cleanUnicode = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/[\u202F\u00A0\u2000-\u200B\uFEFF]/g, ' ')
    .replace(/â€¯/g, ' ')
    .replace(/â€“|â€”/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Heuristic/rule-based analysis fallback when API key is not present or offline
 */
const generateHeuristicAnalysis = (text, fileName) => {
  const cleanName = cleanUnicode(fileName);
  const cleanText = cleanUnicode(text);
  const lowerText = (cleanText + ' ' + cleanName).toLowerCase();

  let category = 'Others';
  let confidence = '85%';
  let reasoning = 'General document based on content analysis.';
  let tags = ['document', 'file'];

  if (/resume|curriculum vitae|\bc\.?v\.?\b|experience|education|skills|work history/i.test(lowerText)) {
    category = 'Resumes';
    confidence = '94%';
    reasoning = 'Document contains career details, work experience, and educational background.';
    tags = ['resume', 'career', 'skills', 'experience'];
  } else if (/notes|lecture|exam|tutorial|study|syllabus|chapter|quiz|textbook|guide|fundamentals/i.test(lowerText)) {
    category = 'Study Material';
    confidence = '91%';
    reasoning = 'Document includes educational notes, technical topics, and study concepts.';
    tags = ['study', 'notes', 'education', 'reference'];
  } else if (/project|architecture|repository|frontend|backend|api|database|github|system design/i.test(lowerText)) {
    category = 'Projects';
    confidence = '89%';
    reasoning = 'Document describes technical software development, project setup, and architecture.';
    tags = ['project', 'development', 'software', 'architecture'];
  } else if (/certificate|completion|accreditation|licensed|verified|award/i.test(lowerText)) {
    category = 'Certificates';
    confidence = '95%';
    reasoning = 'Document certifies completion, accreditation, or awarded credentials.';
    tags = ['certificate', 'credentials', 'achievement'];
  } else if (/news|press|bulletin|announcement|headline/i.test(lowerText)) {
    category = 'News';
    confidence = '88%';
    reasoning = 'Document resembles an informational bulletin or news announcement.';
    tags = ['news', 'announcement', 'updates'];
  } else if (/invoice|receipt|bank|statement|personal|identity|passport|license/i.test(lowerText)) {
    category = 'Personal';
    confidence = '90%';
    reasoning = 'Document contains personal identification, records, or billing information.';
    tags = ['personal', 'records', 'archive'];
  }

  // Extract relevant words for extra tags
  const words = lowerText.match(/[a-z]{4,15}/g) || [];
  const wordFreq = {};
  words.forEach((w) => {
    if (!['this', 'that', 'with', 'from', 'have', 'file', 'document', 'test', 'screenshot'].includes(w)) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  });
  const topWords = Object.keys(wordFreq)
    .sort((a, b) => wordFreq[b] - wordFreq[a])
    .slice(0, 3);

  tags = Array.from(new Set([...tags, ...topWords]));

  let summary = '';
  if (/^screenshot/i.test(cleanName)) {
    summary = `Visual screen capture (${cleanName}) categorized under ${category}.`;
  } else {
    const firstSentence = cleanText.split(/[.\n]/)[0]?.trim() || cleanName;
    summary = `${cleanName}: ${firstSentence.substring(0, 160)}.`;
  }
  const description = `Document categorized under ${category} with key topics covering ${tags.slice(0, 3).join(', ')}.`;

  return {
    summary,
    description,
    tags,
    category,
    confidence,
    reasoning
  };
};

/**
 * Analyzes document text using OpenRouter LLM or fallback
 * @param {string} text - Extracted document text
 * @param {string} fileName - Original file name
 * @returns {Promise<{ summary, description, tags, category, confidence, reasoning }>}
 */
const analyzeDocumentText = async (text, fileName) => {
  if (!isOpenRouterConfigured()) {
    console.log('ℹ️ OpenRouter API key not configured. Using intelligent heuristic analysis.');
    return generateHeuristicAnalysis(text, fileName);
  }

  const prompt = `You are FILER AI, an expert document intelligence assistant.
Analyze the following document text and provide an intelligent classification and summary.

Allowed categories strictly one of:
${JSON.stringify(DEFAULT_CATEGORIES)}

Document Name: "${fileName}"
Document Content Snippet:
"""
${text.substring(0, 4000)}
"""

Respond ONLY with a valid, raw JSON object (no markdown code fences, no extra text):
{
  "summary": "1 to 2 clear sentences summarizing the core content of the document.",
  "description": "A concise 1-sentence description of the document.",
  "tags": ["3 to 6 relevant lowercase single-word tags"],
  "category": "One exact category from the allowed categories list",
  "confidence": "Estimated confidence percentage (e.g. '92%')",
  "reasoning": "A concise 1 to 2 sentence justification explaining why this category was selected."
}`;

  try {
    const response = await axios.post(
      `${config.openRouter.baseUrl}/chat/completions`,
      {
        model: config.openRouter.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI document analysis engine that only outputs strict, valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${config.openRouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://filer.ai',
          'X-Title': 'FILER AI'
        },
        timeout: 15000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty response from OpenRouter');
    }

    // Clean any markdown formatting if present
    const cleanJson = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Validate category is within allowed categories
    const validatedCategory = DEFAULT_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'Others';

    return {
      summary: parsed.summary || `${fileName} document overview.`,
      description: parsed.description || `Document categorized as ${validatedCategory}.`,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t) => t.toLowerCase()) : ['document'],
      category: validatedCategory,
      confidence: parsed.confidence || '88%',
      reasoning: parsed.reasoning || 'Categorized based on document content analysis.'
    };
  } catch (error) {
    console.warn('OpenRouter API call failed or timed out:', error.message);
    console.log('Falling back to local heuristic analysis.');
    return generateHeuristicAnalysis(text, fileName);
  }
};

module.exports = {
  analyzeDocumentText,
  isOpenRouterConfigured
};
