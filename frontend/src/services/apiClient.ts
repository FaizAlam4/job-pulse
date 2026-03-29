/**
 * API Client
 * Centralized Axios instance with interceptors
 * Implements Cache-First-When-Offline + Network-First-When-Online strategy
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/constants/api';
import { cacheResponse, getCachedResponse, clearExpiredCache, enforceMaxCacheSize } from './indexedDBService';

// Shorter timeout when we suspect slow/unreliable network
const ONLINE_TIMEOUT = 10000; // 10 seconds when online
const OFFLINE_FALLBACK_TIMEOUT = 4000; // 4 seconds before falling back to cache
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Check if browser is online
const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Track last cleanup time
let lastCleanupTime = 0;

/**
 * Run cache cleanup if needed (expired entries + max size limit)
 */
const runCacheCleanupIfNeeded = async () => {
  const now = Date.now();
  if (now - lastCleanupTime > CACHE_CLEANUP_INTERVAL) {
    lastCleanupTime = now;
    try {
      const expiredCount = await clearExpiredCache();
      const sizeCount = await enforceMaxCacheSize();
      if (expiredCount > 0 || sizeCount > 0) {
        console.log(`🧹 [Cache] Cleanup: ${expiredCount} expired, ${sizeCount} over limit`);
      }
    } catch (e) {
      console.warn('⚠️ [Cache] Cleanup failed:', e);
    }
  }
};

// Create axios instance with defaults
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: ONLINE_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Wrapper for GET requests that implements smart caching strategy:
 * - If offline: Return cached data immediately
 * - If online: Race network vs cache fallback timer
 */
export const smartGet = async <T>(url: string, config?: any): Promise<AxiosResponse<T>> => {
  // Run cleanup periodically
  runCacheCleanupIfNeeded();
  
  const cacheKey = url;
  
  // If offline, go straight to cache
  if (!isOnline()) {
    console.log('📴 [API] Offline - using cache');
    const cachedData = await getCachedResponse(cacheKey);
    if (cachedData) {
      console.log(`📖 [Cache] Returning cached data: ${cacheKey}`);
      return {
        data: cachedData as T,
        status: 200,
        statusText: 'OK (from cache - offline)',
        headers: {},
        config: config || {},
      } as AxiosResponse<T>;
    }
    throw new Error('No cached data available and device is offline');
  }

  // If online, race network request against cache fallback
  try {
    // Create a promise that resolves with cached data after short timeout
    const cachePromise = new Promise<AxiosResponse<T> | null>(async (resolve) => {
      // Wait a bit before falling back to cache
      await new Promise(r => setTimeout(r, OFFLINE_FALLBACK_TIMEOUT));
      const cached = await getCachedResponse(cacheKey);
      if (cached) {
        console.log(`⏱️ [Cache] Network slow, using cache: ${cacheKey}`);
        resolve({
          data: cached as T,
          status: 200,
          statusText: 'OK (from cache - slow network)',
          headers: {},
          config: config || {},
        } as AxiosResponse<T>);
      } else {
        resolve(null);
      }
    });

    // Race: network vs cache fallback
    const networkPromise = apiClient.get<T>(url, config);
    
    const result = await Promise.race([
      networkPromise.then(res => ({ type: 'network' as const, response: res })),
      cachePromise.then(res => res ? { type: 'cache' as const, response: res } : null),
    ].filter(Boolean));

    if (result && result.type === 'cache') {
      // Cache won the race, but still let network complete to update cache
      networkPromise.then(async (networkRes) => {
        if (networkRes.status === 200) {
          await cacheResponse(cacheKey, networkRes.data);
          console.log(`🔄 [Cache] Background update complete: ${cacheKey}`);
        }
      }).catch(() => {
        // Network failed, but we already returned cache - that's fine
      });
      return result.response;
    }

    // Network won or cache returned null (no cached data)
    const networkResponse = await networkPromise;
    return networkResponse;
  } catch (error) {
    // Network completely failed, try cache as last resort
    const cachedData = await getCachedResponse(cacheKey);
    if (cachedData) {
      console.log(`📖 [Cache] Network failed, using cache: ${cacheKey}`);
      return {
        data: cachedData as T,
        status: 200,
        statusText: 'OK (from cache - network error)',
        headers: {},
        config: config || {},
      } as AxiosResponse<T>;
    }
    throw error;
  }
};

// Request interceptor - log requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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

// Response interceptor - cache responses
apiClient.interceptors.response.use(
  async (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API] Response:`, response.status);
    }

    // Cache GET requests for offline support
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = `${response.config.url}`;
      try {
        await cacheResponse(cacheKey, response.data);
      } catch (cacheError) {
        console.warn('⚠️ [Cache] Failed to cache response:', cacheError);
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      console.error(`❌ [API] Error: ${status}`);
      return Promise.reject(error);
    } else if (error.request) {
      console.error('❌ [API] Network Error - No response received');
      // Cache fallback is handled by smartGet wrapper
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
