import { describe, it, expect } from 'vitest';
import { config } from '../../src/config/index.js';

describe('config', () => {
  it('has all required keys', () => {
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('nodeEnv');
    expect(config).toHaveProperty('mongodbUri');
    expect(config).toHaveProperty('recencyWeight');
    expect(config).toHaveProperty('relevanceWeight');
    expect(config).toHaveProperty('fetchIntervalHours');
    expect(config).toHaveProperty('includeRemotive');
    expect(config).toHaveProperty('includeGoogleJobs');
    expect(config).toHaveProperty('searchQueries');
    expect(config).toHaveProperty('maxJobsPerQuery');
    expect(config).toHaveProperty('redisUrl');
    expect(config).toHaveProperty('redisEnabled');
  });

  it('parses numeric values correctly', () => {
    // port comes from PORT env var via parseInt — if PORT is unset, fallback is number 3000
    expect(Number.isFinite(Number(config.port))).toBe(true);
    expect(typeof config.recencyWeight).toBe('number');
    expect(typeof config.relevanceWeight).toBe('number');
    expect(typeof config.fetchIntervalHours).toBe('number');
    expect(typeof config.maxJobsPerQuery).toBe('number');
  });

  it('parses searchQueries as array', () => {
    expect(Array.isArray(config.searchQueries)).toBe(true);
    expect(config.searchQueries.length).toBeGreaterThan(0);
  });

  it('parses countriesToFetch as array', () => {
    expect(Array.isArray(config.countriesToFetch)).toBe(true);
    expect(config.countriesToFetch.length).toBeGreaterThan(0);
  });

  it('has redis disabled in test env', () => {
    expect(config.redisEnabled).toBe(false);
  });

  it('weights are between 0 and 1', () => {
    expect(config.recencyWeight).toBeGreaterThanOrEqual(0);
    expect(config.recencyWeight).toBeLessThanOrEqual(1);
    expect(config.relevanceWeight).toBeGreaterThanOrEqual(0);
    expect(config.relevanceWeight).toBeLessThanOrEqual(1);
  });
});
