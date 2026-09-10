/**
 * Chunking and Relevance Scoring Service for Lazy Document Q&A (RAG)
 * Complies with Architecture Section 15 & TRD Section 16
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any',
  'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll',
  'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d',
  'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve',
  'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s',
  'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours'
]);

/**
 * Tokenizes text into lowercase alphanumeric keywords excluding stop words
 * @param {string} text 
 * @returns {string[]}
 */
const extractKeywords = (text) => {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return words;
};

/**
 * Splits document text into overlapping sliding window chunks
 * @param {string} text - Raw document text
 * @param {Object} options - { chunkSize: number, overlap: number }
 * @returns {Array<{ index: number, text: string, startChar: number, endChar: number, wordCount: number }>}
 */
const chunkText = (text, options = {}) => {
  const chunkSize = options.chunkSize || 600;
  const overlap = options.overlap || 120;

  if (!text || typeof text !== 'string') {
    return [];
  }

  const cleanText = text.trim();
  if (cleanText.length <= chunkSize) {
    return [
      {
        index: 0,
        text: cleanText,
        startChar: 0,
        endChar: cleanText.length,
        wordCount: cleanText.split(/\s+/).length
      }
    ];
  }

  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize;

    // Try not to split in the middle of a sentence or word if possible
    if (endIndex < cleanText.length) {
      const boundaryOffset = cleanText.substring(endIndex - 40, endIndex + 40).search(/[.!?\n]\s+/);
      if (boundaryOffset !== -1) {
        endIndex = endIndex - 40 + boundaryOffset + 1;
      } else {
        const spaceOffset = cleanText.lastIndexOf(' ', endIndex);
        if (spaceOffset > startIndex + chunkSize / 2) {
          endIndex = spaceOffset;
        }
      }
    } else {
      endIndex = cleanText.length;
    }

    const chunkContent = cleanText.substring(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        index: chunkIndex++,
        text: chunkContent,
        startChar: startIndex,
        endChar: endIndex,
        wordCount: chunkContent.split(/\s+/).length
      });
    }

    if (endIndex >= cleanText.length) {
      break;
    }

    // Step forward by (chunkSize - overlap)
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
};

/**
 * Ranks chunks by relevance to the query using term frequency and density scoring
 * @param {Array<{ index: number, text: string }>} chunks 
 * @param {string} query 
 * @param {number} topK 
 * @returns {Array<{ index: number, text: string, score: number, matchedTerms: string[] }>}
 */
const rankAndSelectChunks = (chunks, query, topK = 3) => {
  if (!chunks || chunks.length === 0) return [];
  if (!query || typeof query !== 'string') {
    return chunks.slice(0, topK).map((c) => ({ ...c, score: 50, matchedTerms: [] }));
  }

  const queryKeywords = extractKeywords(query);
  const normalizedQuery = query.toLowerCase().trim();

  // Score each chunk
  const scoredChunks = chunks.map((chunk) => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    const matchedTerms = [];

    // 1. Exact phrase match boost
    if (normalizedQuery.length > 4 && chunkLower.includes(normalizedQuery)) {
      score += 50;
      matchedTerms.push(normalizedQuery);
    }

    // 2. Keyword matches
    queryKeywords.forEach((kw) => {
      // Regex word match
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      const matches = chunkLower.match(regex);
      if (matches) {
        score += matches.length * 10;
        if (!matchedTerms.includes(kw)) matchedTerms.push(kw);
      } else if (chunkLower.includes(kw)) {
        score += 4;
        if (!matchedTerms.includes(kw)) matchedTerms.push(kw);
      }
    });

    // 3. Normalized score out of 100
    const coverageRatio = queryKeywords.length > 0 ? matchedTerms.length / queryKeywords.length : 0;
    const finalScore = Math.min(100, Math.round(score + coverageRatio * 30));

    return {
      index: chunk.index,
      text: chunk.text,
      score: finalScore,
      matchedTerms
    };
  });

  // Sort descending by relevance score
  scoredChunks.sort((a, b) => b.score - a.score);

  // If top score is 0 (no keyword match), provide first chunks with low relevance indication
  return scoredChunks.slice(0, topK);
};

module.exports = {
  extractKeywords,
  chunkText,
  rankAndSelectChunks
};
