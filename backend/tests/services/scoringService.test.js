import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import { scoreJob, scoreAllJobs, getTopJobs, filterJobs } from '../../src/services/scoringService.js';
import Job from '../../src/models/Job.js';

describe('scoringService', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  describe('scoreJob', () => {
    it('scores a fresh job with matching keywords', () => {
      const job = { postedAt: new Date(), description: 'Node.js backend developer with React and Docker' };
      const result = scoreJob(job);
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.freshnessScore).toBe(1.0);
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('scores a job with no matching keywords', () => {
      const job = { postedAt: new Date(), description: 'Marketing coordinator' };
      const result = scoreJob(job);
      expect(result.relevanceScore).toBe(0);
      expect(result.matchedKeywords).toHaveLength(0);
    });

    it('accepts custom keywords', () => {
      const job = { postedAt: new Date(), description: 'Flutter developer needed' };
      const result = scoreJob(job, ['flutter']);
      expect(result.matchedKeywords).toContain('flutter');
      expect(result.relevanceScore).toBe(1);
    });
  });

  describe('scoreAllJobs', () => {
    it('scores all active jobs in the database', async () => {
      await Job.create([
        { title: 'Dev 1', company: 'Co', location: 'NYC', description: 'Node developer', postedAt: new Date(), hash: 'h1', isActive: true },
        { title: 'Dev 2', company: 'Co', location: 'LA', description: 'React engineer', postedAt: new Date(), hash: 'h2', isActive: true },
        { title: 'Old', company: 'Co', location: 'SF', description: 'Nurse', postedAt: new Date(), hash: 'h3', isActive: false },
      ]);
      const count = await scoreAllJobs();
      expect(count).toBe(2); // only active

      const scored = await Job.findOne({ hash: 'h1' });
      expect(scored.score).toBeGreaterThan(0);
      expect(scored.keywords.length).toBeGreaterThan(0);
    });

    it('returns 0 when no active jobs exist', async () => {
      const count = await scoreAllJobs();
      expect(count).toBe(0);
    });
  });

  describe('getTopJobs', () => {
    it('returns jobs sorted by score descending', async () => {
      await Job.create([
        { title: 'A', company: 'Co', location: 'NYC', postedAt: new Date(), hash: 'ta', isActive: true, score: 0.9 },
        { title: 'B', company: 'Co', location: 'LA', postedAt: new Date(), hash: 'tb', isActive: true, score: 0.5 },
        { title: 'C', company: 'Co', location: 'SF', postedAt: new Date(), hash: 'tc', isActive: true, score: 0.7 },
      ]);
      const top = await getTopJobs(2);
      expect(top).toHaveLength(2);
      expect(top[0].score).toBeGreaterThanOrEqual(top[1].score);
    });

    it('excludes inactive jobs', async () => {
      await Job.create([
        { title: 'Active', company: 'Co', location: 'NYC', postedAt: new Date(), hash: 'active1', isActive: true, score: 0.8 },
        { title: 'Inactive', company: 'Co', location: 'LA', postedAt: new Date(), hash: 'inactive1', isActive: false, score: 0.9 },
      ]);
      const top = await getTopJobs(10);
      expect(top).toHaveLength(1);
      expect(top[0].title).toBe('Active');
    });
  });

  describe('filterJobs', () => {
    it('filters by location', async () => {
      await Job.create([
        { title: 'A', company: 'Co', location: 'New York, NY', postedAt: new Date(), hash: 'f1', isActive: true, score: 0.5 },
        { title: 'B', company: 'Co', location: 'San Francisco, CA', postedAt: new Date(), hash: 'f2', isActive: true, score: 0.5 },
      ]);
      const jobs = await filterJobs({ location: 'New York' });
      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('A');
    });

    it('filters by postedWithinHours', async () => {
      const now = new Date();
      const old = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      await Job.create([
        { title: 'Fresh', company: 'Co', location: 'NYC', postedAt: now, hash: 'fw1', isActive: true },
        { title: 'Old', company: 'Co', location: 'NYC', postedAt: old, hash: 'fw2', isActive: true },
      ]);
      const jobs = await filterJobs({ postedWithinHours: 24 });
      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Fresh');
    });
  });
});
