const axios = require('axios');
const config = require('../config/config');
const { extractTextFromBuffer } = require('./textExtractionService');
const { chunkText, rankAndSelectChunks, extractKeywords } = require('./chunkingService');

/**
 * Intelligent grounded fallback when OpenRouter is rate-limited or offline
 * Strictly checks if the document excerpts contain answers to the query
 */
/**
 * Intelligent grounded fallback when OpenRouter is rate-limited or offline
 * Strictly checks if the document excerpts contain answers to the query
 */
const generateGroundedFallbackAnswer = (question, selectedChunks, fileName) => {
  const normalizedQuestion = question.toLowerCase().trim();

  // Combine selected chunks text
  const combinedContext = selectedChunks.map((c) => c.text).join('\n');
  const sentences = combinedContext
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  // 1. FIRST: Handle general summary, overview, or explanation requests
  if (/summar|what is this|overview|about|explain|key points|takeaways|tell me about/i.test(normalizedQuestion)) {
    const preview = sentences.slice(0, 3).join(' ');
    return `Based on "${fileName}", the document covers: ${preview}`;
  }

  const queryKeywords = extractKeywords(question);
  if (queryKeywords.length === 0) {
    return `I cannot find the answer to this question in the provided document ("${fileName}").`;
  }

  // 2. Score sentences by how many query keywords they contain
  const scoredSentences = sentences.map((sentence) => {
    const sLower = sentence.toLowerCase();
    const matched = queryKeywords.filter((kw) => {
      const stem = kw.replace(/(?:s|es|ed|ing)$/, '');
      const pattern = stem.length >= 3 ? `\\b${stem}[a-z]*\\b` : `\\b${kw}\\b`;
      const regex = new RegExp(pattern, 'i');
      return regex.test(sLower);
    });
    return {
      sentence,
      matchedCount: matched.length,
      matchedKeywords: matched
    };
  });

  // Find sentences with keyword matches
  const relevantSentences = scoredSentences.filter((s) => s.matchedCount > 0);

  // Calculate overall query keyword coverage across all matching sentences
  const allMatchedKeywords = new Set();
  relevantSentences.forEach((s) => s.matchedKeywords.forEach((kw) => allMatchedKeywords.add(kw)));
  const coverageRatio = queryKeywords.length > 0 ? allMatchedKeywords.size / queryKeywords.length : 0;

  // Strict Grounding Rule:
  // If no sentences match, or if on multi-keyword questions coverage is insufficient (e.g., only 1 generic word matched out of 5)
  const isMultiWordQuery = queryKeywords.length >= 3;
  const insufficientCoverage = isMultiWordQuery && (allMatchedKeywords.size < 2 || coverageRatio < 0.35);

  if (relevantSentences.length === 0 || insufficientCoverage || selectedChunks.every((c) => c.score < 15)) {
    return `I cannot find the answer to this question in the provided document ("${fileName}"). The document does not contain information regarding "${question}".`;
  }

  // Greedy coverage selection: prioritize sentences that cover new query keywords
  const selectedSentences = [];
  const coveredKeywords = new Set();
  const remaining = [...relevantSentences];

  while (selectedSentences.length < 3 && remaining.length > 0) {
    remaining.sort((a, b) => {
      const newA = a.matchedKeywords.filter((k) => !coveredKeywords.has(k)).length;
      const newB = b.matchedKeywords.filter((k) => !coveredKeywords.has(k)).length;
      if (newB !== newA) return newB - newA;
      return b.matchedCount - a.matchedCount;
    });

    const best = remaining.shift();
    if (!best) break;
    selectedSentences.push(best.sentence);
    best.matchedKeywords.forEach((k) => coveredKeywords.add(k));
  }

  const bestSentences = selectedSentences.join(' ');
  return `According to the document ("${fileName}"): ${bestSentences}`;
};

/**
 * Answers a question on a single document with strict grounding
 * @param {Object} file - File metadata document
 * @param {Buffer} buffer - File raw buffer
 * @param {string} question - User inquiry
 * @param {Array} history - Previous conversation messages
 * @returns {Promise<{ answer: string, sources: Array<{ chunkIndex: number, text: string, score: number }> }>}
 */
const answerFileQuestion = async (file, buffer, question, history = []) => {
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new Error('A valid question is required');
  }

  // 1. Extract text in-memory from buffer (Lazy Processing)
  const extractedText = await extractTextFromBuffer(buffer, file.fileName);

  // 2. Chunk text in-memory
  const chunks = chunkText(extractedText, { chunkSize: 700, overlap: 140 });

  // 3. Rank and select top relevant chunks
  const selectedChunks = rankAndSelectChunks(chunks, question, 3);

  // Format context for LLM prompt
  const contextSnippets = selectedChunks
    .map((c, idx) => `[Excerpt ${idx + 1} | Chunk #${c.index}]:\n${c.text}`)
    .join('\n\n');

  const systemPrompt = `You are FILER AI, a document intelligence and question-answering assistant.
Your task is to answer the user's question STRICTLY and ONLY using the provided document excerpts.

CRITICAL GROUNDING RULES (NO HALLUCINATIONS):
1. Rely ONLY on facts stated in the provided Excerpts below.
2. Do NOT use outside knowledge or assumptions not found in the text.
3. If the answer cannot be found in the provided Excerpts, you MUST explicitly respond:
   "I cannot find the answer to this question in the provided document."
4. Keep answers concise, clear, factual, and directly cite specific details from the document.`;

  const userPrompt = `Document: "${file.fileName}"
Category: ${file.category || 'General'}

Document Excerpts:
"""
${contextSnippets}
"""

Question: ${question}

Answer:`;

  // Check if OpenRouter is configured
  const { apiKey, baseUrl, model } = config.openRouter;
  const isOpenRouterReady = Boolean(apiKey && apiKey !== 'your_openrouter_api_key');

  if (!isOpenRouterReady) {
    const fallbackAnswer = generateGroundedFallbackAnswer(question, selectedChunks, file.fileName);
    return {
      answer: fallbackAnswer,
      sources: selectedChunks.map((c) => ({
        chunkIndex: c.index,
        text: c.text,
        score: c.score
      }))
    };
  }

  try {
    // Build message thread with optional previous history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: userPrompt }
    ];

    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        messages,
        temperature: 0.2,
        max_tokens: 600
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://filer.ai',
          'X-Title': 'FILER AI Ask Your File'
        },
        timeout: 18000
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new Error('Empty response from OpenRouter');
    }

    return {
      answer,
      sources: selectedChunks.map((c) => ({
        chunkIndex: c.index,
        text: c.text,
        score: c.score
      }))
    };
  } catch (error) {
    console.warn('OpenRouter Q&A call failed or rate-limited:', error.message);
    console.log('Falling back to local grounded heuristic answer.');
    const fallbackAnswer = generateGroundedFallbackAnswer(question, selectedChunks, file.fileName);
    return {
      answer: fallbackAnswer,
      sources: selectedChunks.map((c) => ({
        chunkIndex: c.index,
        text: c.text,
        score: c.score
      }))
    };
  }
};

module.exports = {
  answerFileQuestion,
  generateGroundedFallbackAnswer
};
