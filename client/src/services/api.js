import axios from 'axios';
import config from '../config/app.config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token if present
api.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem('filer_token');
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on invalid/expired authentication
      localStorage.removeItem('filer_token');
      localStorage.removeItem('filer_user');
      // Dispatch custom event to notify auth context
      window.dispatchEvent(new Event('filer:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
