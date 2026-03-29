/**
 * IndexedDB Service
 * Handles offline caching of job data and API responses
 * Using idb library for easier IndexedDB management
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  source: string;
  score?: number;
  [key: string]: any;
}

export interface CacheEntry {
  id?: number;
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface JobPulseDB extends DBSchema {
  jobs: {
    key: string;
    value: Job;
    indexes: { 'by-source': string };
  };
  cache: {
    key: string;
    value: CacheEntry;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'job-pulse-db';
const DB_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB max cache size

/**
 * Estimate the size of a cache entry in bytes
 * Uses JSON.stringify length as a rough approximation
 */
const estimateSize = (data: any): number => {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    // Fallback for non-serializable data
    return JSON.stringify(data)?.length || 0;
  }
};

let db: IDBPDatabase<JobPulseDB> | null = null;

/**
 * Initialize IndexedDB
 */
export const initDB = async (): Promise<IDBPDatabase<JobPulseDB>> => {
  if (db) return db;

  db = await openDB<JobPulseDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Jobs store
      if (!db.objectStoreNames.contains('jobs')) {
        const jobStore = db.createObjectStore('jobs', { keyPath: '_id' });
        jobStore.createIndex('by-source', 'source');
      }

      // Cache store
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return db;
};

/**
 * Save jobs to IndexedDB
 */
export const saveJobs = async (jobs: Job[]): Promise<void> => {
  const indexedDB = await initDB();
  const tx = indexedDB.transaction('jobs', 'readwrite');

  for (const job of jobs) {
    await tx.store.put(job);
  }

  await tx.done;
  console.log(`💾 Saved ${jobs.length} jobs to IndexedDB`);
};

/**
 * Get all jobs from IndexedDB
 */
export const getAllJobs = async (): Promise<Job[]> => {
  const indexedDB = await initDB();
  const jobs = await indexedDB.getAll('jobs');
  console.log(`📖 Retrieved ${jobs.length} jobs from IndexedDB`);
  return jobs;
};

/**
 * Get jobs by source from IndexedDB
 */
export const getJobsBySource = async (source: string): Promise<Job[]> => {
  const indexedDB = await initDB();
  const jobs = await indexedDB.getAllFromIndex('jobs', 'by-source', source);
  return jobs;
};

/**
 * Delete all jobs from IndexedDB
 */
export const deleteAllJobs = async (): Promise<void> => {
  const indexedDB = await initDB();
  await indexedDB.clear('jobs');
  console.log('🗑️  Cleared all jobs from IndexedDB');
};

/**
 * Cache API response with TTL
 */
export const cacheResponse = async (key: string, data: any): Promise<void> => {
  const indexedDB = await initDB();
  const now = Date.now();

  await indexedDB.put('cache', {
    key,
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL,
  });

  console.log(`💾 Cached response for key: ${key}`);
};

/**
 * Get cached response if not expired
 */
export const getCachedResponse = async (key: string): Promise<any | null> => {
  const indexedDB = await initDB();
  const entry = await indexedDB.get('cache', key);

  if (!entry) {
    return null;
  }

  // Check if cache expired
  if (Date.now() > entry.expiresAt) {
    await indexedDB.delete('cache', key);
    console.log(`⏳ Cache expired for key: ${key}`);
    return null;
  }

  console.log(`✓ Using cached response for key: ${key}`);
  return entry.data;
};

/**
 * Clear all expired cache entries
 */
export const clearExpiredCache = async (): Promise<number> => {
  const indexedDB = await initDB();
  const allCache = await indexedDB.getAll('cache');
  const now = Date.now();
  let clearedCount = 0;

  for (const entry of allCache) {
    if (now > entry.expiresAt) {
      await indexedDB.delete('cache', entry.key);
      clearedCount++;
    }
  }

  if (clearedCount > 0) {
    console.log(`🧹 Cleared ${clearedCount} expired cache entries`);
  }

  return clearedCount;
};

/**
 * Enforce max cache size by removing oldest entries (LRU)
 * This prevents IndexedDB from growing indefinitely
 * Now uses size-based limit (1GB) instead of entry count
 */
export const enforceMaxCacheSize = async (): Promise<number> => {
  const indexedDB = await initDB();
  const allCache = await indexedDB.getAll('cache');
  
  // Calculate total cache size
  let totalSize = 0;
  const entriesWithSize = allCache.map(entry => ({
    ...entry,
    size: estimateSize(entry.data),
  }));
  
  for (const entry of entriesWithSize) {
    totalSize += entry.size;
  }

  if (totalSize <= MAX_CACHE_SIZE_BYTES) {
    console.log(`📊 Cache size: ${(totalSize / (1024 * 1024)).toFixed(2)}MB / 1GB`);
    return 0;
  }

  // Sort by timestamp (oldest first)
  entriesWithSize.sort((a, b) => a.timestamp - b.timestamp);
  
  // Delete oldest entries until under limit
  let deleteCount = 0;
  let freedSize = 0;

  for (const entry of entriesWithSize) {
    if (totalSize - freedSize <= MAX_CACHE_SIZE_BYTES) {
      break;
    }
    await indexedDB.delete('cache', entry.key);
    freedSize += entry.size;
    deleteCount++;
  }

  console.log(`🗑️ Removed ${deleteCount} entries, freed ${(freedSize / (1024 * 1024)).toFixed(2)}MB (LRU cleanup)`);
  return deleteCount;
};

/**
 * Clear all cache entries (manual reset)
 */
export const clearAllCache = async (): Promise<void> => {
  const indexedDB = await initDB();
  await indexedDB.clear('cache');
  console.log('🗑️ Cleared all cache entries');
};

/**
 * Get database stats
 */
export const getDBStats = async (): Promise<{
  jobsCount: number;
  cacheCount: number;
  cacheSize: string;
  maxSize: string;
  usagePercent: number;
}> => {
  const indexedDB = await initDB();
  const jobsCount = await indexedDB.count('jobs');
  const cacheCount = await indexedDB.count('cache');

  // Calculate cache size using estimateSize
  const cache = await indexedDB.getAll('cache');
  let cacheSizeBytes = 0;
  for (const entry of cache) {
    cacheSizeBytes += estimateSize(entry.data);
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return {
    jobsCount,
    cacheCount,
    cacheSize: formatSize(cacheSizeBytes),
    maxSize: '1 GB',
    usagePercent: Math.round((cacheSizeBytes / MAX_CACHE_SIZE_BYTES) * 100),
  };
};
