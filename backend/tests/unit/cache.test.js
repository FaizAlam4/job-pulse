import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheGet, cacheSet, cacheDel, cacheDelKeys, buildCacheKey, TTL } from '../../src/utils/cache.js';

// Redis is disabled in test env, so all cache ops are safe no-ops.

describe('buildCacheKey', () => {
  it('returns prefix alone when no params', () => {
    expect(buildCacheKey('jobs:list')).toBe('jobs:list');
  });

  it('appends sorted params', () => {
    const key = buildCacheKey('jobs:list', { page: 1, limit: 20, country: 'India' });
    expect(key).toBe('jobs:list:country=India&limit=20&page=1');
  });

  it('filters out undefined/null/empty params', () => {
    const key = buildCacheKey('jobs:list', { page: 1, country: undefined, foo: null, bar: '' });
    expect(key).toBe('jobs:list:page=1');
  });

  it('sorts params alphabetically', () => {
    const key = buildCacheKey('x', { z: 1, a: 2, m: 3 });
    expect(key).toBe('x:a=2&m=3&z=1');
  });

  it('returns prefix when all params are empty', () => {
    const key = buildCacheKey('prefix', { a: undefined, b: null, c: '' });
    expect(key).toBe('prefix');
  });
});

describe('TTL constants', () => {
  it('has expected keys', () => {
    expect(TTL.JOBS_LIST).toBe(300);
    expect(TTL.JOBS_TOP).toBe(600);
    expect(TTL.JOBS_STATS).toBe(600);
    expect(TTL.JOB_DETAIL).toBe(1800);
    expect(TTL.SEARCH).toBe(300);
    expect(TTL.INSIGHTS).toBe(300);
    expect(TTL.TRACKING).toBe(120);
  });
});

describe('cache functions with Redis disabled', () => {
  it('cacheGet returns null', async () => {
    expect(await cacheGet('any-key')).toBeNull();
  });

  it('cacheSet completes without error', async () => {
    await expect(cacheSet('key', { data: 1 }, 60)).resolves.toBeUndefined();
  });

  it('cacheDel completes without error', async () => {
    await expect(cacheDel('jobs:*')).resolves.toBeUndefined();
  });

  it('cacheDelKeys completes without error', async () => {
    await expect(cacheDelKeys('key1', 'key2')).resolves.toBeUndefined();
  });
});
