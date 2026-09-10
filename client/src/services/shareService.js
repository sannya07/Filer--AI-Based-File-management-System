import api from './api';

const shareService = {
  /**
   * Create a new secure shareable link for a file
   * @param {Object} data - { fileId, expiryDays, viewOnly }
   */
  async createShareLink(data) {
    const response = await api.post('/share/create', data);
    return response.data;
  },

  /**
   * Fetch public shared document by token
   * @param {string} token
   */
  async getSharedFile(token) {
    const response = await api.get(`/share/${token}`);
    return response.data;
  },

  /**
   * Get active share links for a file (owner view)
   * @param {string} fileId
   */
  async getFileShareLinks(fileId) {
    const response = await api.get(`/share/file/${fileId}`);
    return response.data;
  },

  /**
   * Revoke an active share link
   * @param {string} token
   */
  async revokeShareLink(token) {
    const response = await api.delete(`/share/${token}`);
    return response.data;
  }
};

export default shareService;
