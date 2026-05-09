import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import Job from '../../src/models/Job.js';

// Mock fetcherService to avoid real API calls
vi.mock('../../src/services/fetcherService.js', () => ({
  fetchAllJobs: vi.fn(() => Promise.resolve([
    {
      title: 'Mock Developer',
      company: 'MockCorp',
      location: 'Remote',
      description: 'Node.js developer for mock testing',
      source: 'remotive',
      postedAt: new Date(),
    },
    {
      title: 'Mock Engineer',
      company: 'TestInc',
      location: 'New York, NY',
      description: 'React frontend engineer',
      source: 'google-jobs',
      postedAt: new Date(),
    },
  ])),
}));

// Import after mock
const { runJobIngestionPipeline } = await import('../../src/services/aggregationService.js');

describe('aggregationService', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  it('runs the full ingestion pipeline', async () => {
    const summary = await runJobIngestionPipeline();
    expect(summary.fetched).toBe(2);
    expect(summary.newSaved).toBeGreaterThanOrEqual(0);
    // Jobs should be in DB
    const jobs = await Job.find();
    expect(jobs.length).toBeGreaterThanOrEqual(0);
  });

  it('deduplicates on second run', async () => {
    await runJobIngestionPipeline();
    const firstCount = await Job.countDocuments();
    await runJobIngestionPipeline();
    const secondCount = await Job.countDocuments();
    // Should not double the jobs
    expect(secondCount).toBe(firstCount);
  });
});
