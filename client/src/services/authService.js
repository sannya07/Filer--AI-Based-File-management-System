import api from './api';

const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { name, email, password }
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Log in an existing user
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Get current authenticated user details
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export default authService;
