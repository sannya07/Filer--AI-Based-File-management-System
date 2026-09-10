import api from './api';

const aiService = {
  /**
   * Analyze an in-memory document file using AI
   * @param {File} file - Browser File object
   * @returns {Promise<{ success, fileName, summary, description, tags, category, confidence, reasoning }>}
   */
  async analyzeFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/ai/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }
};

export default aiService;
