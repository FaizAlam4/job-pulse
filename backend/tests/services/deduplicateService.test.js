import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import { deduplicateJobs, archiveOldJobs, deleteOldJobs, findJobByHash } from '../../src/services/deduplicateService.js';
import { generateJobHash } from '../../src/utils/scoring.js';
import Job from '../../src/models/Job.js';

describe('deduplicateService', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  describe('findJobByHash', () => {
    it('returns null when no match', async () => {
      const result = await findJobByHash('nonexistent');
      expect(result).toBeNull();
    });

    it('finds existing job by hash', async () => {
      const hash = generateJobHash('Dev', 'Acme', 'NYC');
      await Job.create({ title: 'Dev', company: 'Acme', location: 'NYC', postedAt: new Date(), hash });
      const result = await findJobByHash(hash);
      expect(result).not.toBeNull();
      expect(result.title).toBe('Dev');
    });
  });

  describe('deduplicateJobs', () => {
    it('identifies all jobs as new when DB is empty', async () => {
      const jobs = [
        { title: 'Dev A', company: 'Co1', location: 'NYC', postedAt: new Date() },
        { title: 'Dev B', company: 'Co2', location: 'LA', postedAt: new Date() },
      ];
      const { newJobs, existingJobs } = await deduplicateJobs(jobs);
      expect(newJobs).toHaveLength(2);
      expect(existingJobs).toHaveLength(0);
    });

    it('identifies existing jobs as updates', async () => {
      const hash = generateJobHash('Dev', 'Acme', 'NYC');
      await Job.create({ title: 'Dev', company: 'Acme', location: 'NYC', postedAt: new Date(), hash });

      const jobs = [
        { title: 'Dev', company: 'Acme', location: 'NYC', postedAt: new Date() },
        { title: 'New', company: 'Other', location: 'LA', postedAt: new Date() },
      ];
      const { newJobs, existingJobs } = await deduplicateJobs(jobs);
      expect(newJobs).toHaveLength(1);
      expect(existingJobs).toHaveLength(1);
      expect(newJobs[0].title).toBe('New');
    });

    it('removes batch duplicates', async () => {
      const jobs = [
        { title: 'Dev', company: 'Acme', location: 'NYC', postedAt: new Date() },
        { title: 'Dev', company: 'Acme', location: 'NYC', postedAt: new Date() }, // duplicate
      ];
      const { newJobs } = await deduplicateJobs(jobs);
      expect(newJobs).toHaveLength(1);
    });
  });

  describe('archiveOldJobs', () => {
    it('archives jobs older than N days', async () => {
      const old = new Date();
      old.setDate(old.getDate() - 40);
      await Job.create([
        { title: 'Old', company: 'Co', location: 'NYC', postedAt: old, hash: 'old1', isActive: true },
        { title: 'Fresh', company: 'Co', location: 'LA', postedAt: new Date(), hash: 'fresh1', isActive: true },
      ]);

      const archived = await archiveOldJobs(30);
      expect(archived).toBe(1);

      const oldJob = await Job.findOne({ hash: 'old1' });
      expect(oldJob.isActive).toBe(false);
      const freshJob = await Job.findOne({ hash: 'fresh1' });
      expect(freshJob.isActive).toBe(true);
    });

    it('returns 0 when nothing to archive', async () => {
      const count = await archiveOldJobs(30);
      expect(count).toBe(0);
    });
  });

  describe('deleteOldJobs', () => {
    it('hard deletes jobs older than N days', async () => {
      const old = new Date();
      old.setDate(old.getDate() - 90);
      await Job.create([
        { title: 'Ancient', company: 'Co', location: 'NYC', postedAt: old, hash: 'ancient1' },
        { title: 'Recent', company: 'Co', location: 'LA', postedAt: new Date(), hash: 'recent1' },
      ]);

      const result = await deleteOldJobs(60);
      expect(result.deletedCount).toBe(1);
      expect(await Job.countDocuments()).toBe(1);
    });
  });
});
