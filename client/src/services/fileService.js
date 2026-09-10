import api from './api';

const fileService = {
  /**
   * Check if a file's hash already exists in user's library
   * @param {string} hash - SHA-256 hex string
   */
  async checkDuplicate(hash) {
    const response = await api.post('/files/check-duplicate', { hash });
    return response.data;
  },

  /**
   * Upload a file with optional metadata
   * @param {FormData} formData 
   * @param {Function} onUploadProgress 
   */
  async uploadFile(formData, onUploadProgress) {
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
    return response.data;
  },

  /**
   * Get all files for active user
   * @param {Object} params - { category, search, sort }
   */
  async getFiles(params = {}) {
    const response = await api.get('/files', { params });
    return response.data;
  },

  /**
   * Get single file by ID
   * @param {string} id 
   */
  async getFileById(id) {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  /**
   * Delete a file by ID
   * @param {string} id 
   */
  async deleteFile(id) {
    const response = await api.delete(`/files/${id}`);
    return response.data;
  }
};

export default fileService;
