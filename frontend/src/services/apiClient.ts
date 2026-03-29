/**
 * API Client
 * Centralized Axios instance with interceptors
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants/api';

// Create axios instance with defaults
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token if needed, log requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ [API] Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API] Response:`, response.status);
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle common error scenarios
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 400:
          console.error('❌ [API] Bad Request');
          break;
        case 401:
          console.error('❌ [API] Unauthorized');
          break;
        case 404:
          console.error('❌ [API] Not Found');
          break;
        case 429:
          console.error('❌ [API] Rate Limited');
          break;
        case 500:
          console.error('❌ [API] Server Error');
          break;
        default:
          console.error(`❌ [API] Error: ${status}`);
      }
    } else if (error.request) {
      console.error('❌ [API] Network Error - No response received');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
