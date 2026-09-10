import api from './api';

const searchService = {
  /**
   * Fetch Trie-powered prefix autocomplete suggestions in O(L)
   * @param {string} prefix - The typed prefix (e.g., 're')
   * @param {number} limit - Max suggestions to return
   */
  async getSuggestions(prefix, limit = 8) {
    if (!prefix || !prefix.trim()) return { suggestions: [] };
    const response = await api.get('/search/suggestions', {
      params: { q: prefix.trim(), limit }
    });
    return response.data;
  },

  /**
   * Search files by keyword across name, tags, and AI summary
   * @param {Object} params - { q, category, subcategory, tag, sort }
   */
  async searchFiles(params = {}) {
    const response = await api.get('/search', { params });
    return response.data;
  }
};

export default searchService;
