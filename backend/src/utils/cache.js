/**
 * Cache Utility — Cache-Aside (Lazy-Loading) Pattern
 *
 * How it works:
 * 1. cacheGet(key)    → Check Redis. Hit? Return parsed data. Miss? Return null.
 * 2. cacheSet(key, data, ttl) → Store JSON-serialized data with expiry.
 * 3. cacheDel(pattern) → Invalidate keys matching a pattern (e.g., "jobs:*").
 *
 * Usage in a controller:
 *   const cached = await cacheGet('jobs:stats');
 *   if (cached) return reply.send(cached);    // ← Cache hit, skip DB
 *   const data = await db.query();            // ← Cache miss, query DB
 *   await cacheSet('jobs:stats', data, 600);  // ← Store for 10 min
 *   return reply.send(data);
 *
 * If Redis is disabled (redis === null), all functions are safe no-ops.
 * The app works identically — just without caching.
 */
import redis from '../config/redis.js';

// Default TTLs (seconds)
export const TTL = {
  JOBS_LIST: 300,      // 5 min — job listings change every 3h (ingestion cron)
  JOBS_TOP: 600,       // 10 min — top jobs are very stable
  JOBS_STATS: 600,     // 10 min — aggregate stats rarely change
  JOB_DETAIL: 1800,    // 30 min — individual job data almost never changes
  SEARCH: 300,         // 5 min — same search returns same results
  INSIGHTS: 300,       // 5 min — user insights change on tracking updates
  TRACKING: 120,       // 2 min — users expect near-real-time tracking data
};

/**
 * Get cached data by key.
 * Returns parsed JSON on hit, null on miss or if Redis is disabled.
 */
export async function cacheGet(key) {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('Cache GET error:', err.message);
    return null; // Fail open — treat as cache miss
  }
}

/**
 * Store data in cache with a TTL (time-to-live in seconds).
 * Data is JSON-serialized before storage.
 */
export async function cacheSet(key, data, ttlSeconds) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('Cache SET error:', err.message);
    // Fail silently — caching is best-effort
  }
}

/**
 * Delete cache keys matching a pattern.
 * Uses SCAN (non-blocking) instead of KEYS (blocks Redis).
 *
 * Why SCAN over KEYS?
 * - KEYS blocks the Redis event loop while scanning ALL keys
 * - SCAN iterates incrementally in batches (cursor-based)
 * - In production with millions of keys, KEYS can freeze Redis for seconds
 *
 * @param {string} pattern - Glob pattern (e.g., "jobs:*", "insights:*:user123")
 */
export async function cacheDel(pattern) {
  if (!redis) return;
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    console.warn('Cache DEL error:', err.message);
  }
}

/**
 * Delete one or more exact keys (faster than pattern-based deletion).
 * Use when you know the exact keys to invalidate.
 */
export async function cacheDelKeys(...keys) {
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.warn('Cache DEL error:', err.message);
  }
}

/**
 * Build a deterministic cache key from route + query params.
 * Sorts params alphabetically so ?page=1&limit=20 === ?limit=20&page=1.
 *
 * @param {string} prefix - Key namespace (e.g., "jobs:list", "insights:overview")
 * @param {object} params - Query parameters to include in the key
 * @returns {string} Cache key like "jobs:list:country=usa&limit=20&page=1"
 */
export function buildCacheKey(prefix, params = {}) {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return filtered ? `${prefix}:${filtered}` : prefix;
}
