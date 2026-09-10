import api from './api';

const categoryService = {
  /**
   * Fetch hierarchical category tree with live file counts
   */
  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  },

  /**
   * Create a new category or subcategory
   * @param {Object} data - { name, parentId }
   */
  async createCategory(data) {
    const response = await api.post('/categories', data);
    return response.data;
  },

  /**
   * Update or rename a category
   * @param {string} id 
   * @param {Object} data - { name }
   */
  async updateCategory(id, data) {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete a category (relocates files to 'Others')
   * @param {string} id 
   */
  async deleteCategory(id) {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  /**
   * Move a file to a new category/subcategory
   * @param {Object} data - { fileId, category, subcategory }
   */
  async moveFile(data) {
    const response = await api.patch('/categories/move-file', data);
    return response.data;
  }
};

export default categoryService;
