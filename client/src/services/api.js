import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('proxispeak_auth_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Ignore localStorage access failures
  }
  return config;
});

// Handle global response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('proxispeak_auth_token');
        localStorage.removeItem('proxispeak_auth_user');
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;
