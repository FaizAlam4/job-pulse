import { describe, it, expect, afterAll } from 'vitest';
import { startScheduler, stopScheduler, getSchedulerStatus } from '../../src/schedulers/jobScheduler.js';

describe('jobScheduler', () => {
  afterAll(() => {
    stopScheduler();
  });

  it('starts scheduler and returns true', () => {
    const result = startScheduler();
    expect(result).toBe(true);
  });

  it('stops scheduler without error', () => {
    startScheduler();
    stopScheduler();
    // Stopping again should be safe
    stopScheduler();
  });

  it('getSchedulerStatus returns status object', () => {
    startScheduler();
    const status = getSchedulerStatus();
    expect(status).toBeDefined();
    stopScheduler();
  });
});
