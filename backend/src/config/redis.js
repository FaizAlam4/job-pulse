/**
 * Redis Client (Singleton)
 *
 * Design: Cache-Aside pattern with graceful degradation.
 * - If REDIS_URL is not set or REDIS_ENABLED=false, exports null.
 * - All consumers must check `if (redis)` before use.
 * - On connection failure, logs a warning and continues — the app never
 *   crashes because of Redis being unavailable.
 *
 * Why ioredis?
 * - Auto-reconnect with exponential backoff
 * - Supports Redis Cluster, Sentinel, and standalone
 * - Pipelining support for batched commands
 * - Used in production at Alibaba, Discord, etc.
 */
import Redis from 'ioredis';
import config from './index.js';

let redis = null;

if (config.redisEnabled) {
  redis = new Redis(config.redisUrl, {
    // Reconnect with exponential backoff: 50ms, 100ms, 200ms... max 2s
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    // Don't buffer commands when disconnected — fail fast
    enableOfflineQueue: false,
    // Connection timeout
    connectTimeout: 5000,
    // Max reconnect attempts (0 = infinite)
    maxRetriesPerRequest: 1,
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.warn('⚠️  Redis error (cache disabled, app continues):', err.message);
  });
} else {
  console.log('ℹ️  Redis not configured — caching disabled');
}

export default redis;
