/**
 * Global client application configuration
 * Centralizes environment variables and application constants
 */
const getAutoApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:5000/api') {
    return import.meta.env.VITE_API_URL;
  }

  if (
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return 'https://filer-ai-backend.vercel.app/api';
  }

  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const config = {
  apiUrl: getAutoApiUrl(),
  appTitle: 'FILER AI',
  defaultCategories: [
    'Study Material',
    'Projects',
    'Resumes',
    'Certificates',
    'News',
    'Personal',
    'Others'
  ],
  maxUploadSizeBytes: 50 * 1024 * 1024, // 50MB
  supportedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/csv',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'image/png',
    'image/jpeg'
  ]
};

export default config;
