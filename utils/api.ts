import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('taskit_token');
  }
  return null;
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('taskit_token', token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('taskit_token');
    localStorage.removeItem('taskit_user');
  }
};

export const getLoggedInUser = (): { id: string; username: string } | null => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('taskit_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const setLoggedInUser = (user: { id: string; username: string }): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('taskit_user', JSON.stringify(user));
  }
};

// Centralized Axios Instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to automatically attach Auth tokens
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor to automatically handle 401 session expirations
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }
  return Promise.reject(error);
});
