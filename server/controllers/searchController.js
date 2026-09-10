const FileModel = require('../models/File');
const { buildUserTrie } = require('../services/trieService');

/**
 * In-memory LRU or Map Cache for user tries with TTL (optional performance boost)
 */
const userTrieCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds TTL for fast repeated keystroke autocompletion

const getOrBuildTrie = async (userId) => {
  const cached = userTrieCache.get(userId.toString());
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.trie;
  }

  const files = await FileModel.find({ ownerId: userId }).select(
    'fileName fileType category subcategory tags summary'
  );

  const trie = buildUserTrie(files);
  userTrieCache.set(userId.toString(), {
    trie,
    timestamp: now
  });

  return trie;
};

/**
 * Invalidate cache when files are added or changed
 */
const invalidateUserTrie = (userId) => {
  userTrieCache.delete(userId.toString());
};

/**
 * @desc    Get Trie-powered prefix autocomplete suggestions in O(L)
 * @route   GET /api/search/suggestions
 * @access  Private
 */
const getAutocompleteSuggestions = async (req, res, next) => {
  try {
    const { q = '', limit = 8 } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        query: '',
        suggestions: []
      });
    }

    const trie = await getOrBuildTrie(req.user._id);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 20);
    const suggestions = trie.getSuggestions(q.trim(), parsedLimit);

    res.status(200).json({
      success: true,
      query: q.trim(),
      count: suggestions.length,
      suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search files across file names, AI summaries, descriptions, and tags
 * @route   GET /api/search
 * @access  Private
 */
const searchFiles = async (req, res, next) => {
  try {
    const { q, category, subcategory, tag, sort = 'uploadedAt' } = req.query;

    const query = { ownerId: req.user._id };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (subcategory && subcategory !== 'All') {
      query.subcategory = subcategory;
    }

    if (tag) {
      query.tags = { $in: [tag.toLowerCase().trim()] };
    }

    if (q && q.trim()) {
      const cleanQ = q.trim();
      query.$or = [
        { fileName: { $regex: cleanQ, $options: 'i' } },
        { summary: { $regex: cleanQ, $options: 'i' } },
        { description: { $regex: cleanQ, $options: 'i' } },
        { tags: { $regex: cleanQ, $options: 'i' } }
      ];
    }

    const files = await FileModel.find(query).sort({ [sort]: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAutocompleteSuggestions,
  searchFiles,
  invalidateUserTrie
};
