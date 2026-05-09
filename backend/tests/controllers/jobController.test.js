import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import Job from '../../src/models/Job.js';
import {
  getAllJobs,
  getTopRankedJobs,
  getJobById,
  searchJobs,
  getJobStats,
  resendAllJobs,
  cleanupOldJobs,
  debugDeleteAllJobs,
} from '../../src/controllers/jobController.js';
import mongoose from 'mongoose';

function mockRequest(opts = {}) {
  return {
    query: opts.query || {},
    params: opts.params || {},
    user: opts.user || null,
  };
}

function mockReply() {
  const r = { statusCode: 200, body: null };
  r.code = (c) => { r.statusCode = c; return r; };
  r.send = (data) => { r.body = data; return r; };
  r.status = (c) => { r.statusCode = c; return r; };
  return r;
}

async function seedJobs() {
  return Job.create([
    { title: 'Node Developer', company: 'Acme', location: 'New York, NY, United States', description: 'Node.js backend dev', postedAt: new Date(), hash: 's1', isActive: true, score: 0.9, keywords: ['node'] },
    { title: 'React Developer', company: 'Beta Inc', location: 'San Francisco, CA, United States', description: 'React frontend', postedAt: new Date(), hash: 's2', isActive: true, score: 0.7, keywords: ['react'] },
    { title: 'Python Engineer', company: 'Gamma', location: 'Remote', description: 'Python data pipeline', postedAt: new Date(), hash: 's3', isActive: true, score: 0.5, keywords: ['python'] },
    { title: 'Java Dev', company: 'Delta', location: 'Bangalore, India', description: 'Java spring boot', postedAt: new Date(), hash: 's4', isActive: true, score: 0.3 },
    { title: 'Inactive', company: 'Old Co', location: 'NYC', description: 'Old role', postedAt: new Date(Date.now() - 90 * 24 * 3600000), hash: 's5', isActive: false, score: 0.1 },
  ]);
}

describe('jobController', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  describe('getAllJobs', () => {
    it('returns paginated active jobs', async () => {
      await seedJobs();
      const req = mockRequest({ query: { limit: '2', page: '1' } });
      const reply = mockReply();
      await getAllJobs(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data).toHaveLength(2);
      expect(reply.body.pagination.totalCount).toBe(4); // excludes inactive
      expect(reply.body.pagination.totalPages).toBe(2);
    });

    it('filters by search keyword', async () => {
      await seedJobs();
      const req = mockRequest({ query: { search: 'Node' } });
      const reply = mockReply();
      await getAllJobs(req, reply);
      expect(reply.body.data.length).toBeGreaterThanOrEqual(1);
      expect(reply.body.data[0].title).toContain('Node');
    });

    it('filters by country', async () => {
      await seedJobs();
      const req = mockRequest({ query: { country: 'India' } });
      const reply = mockReply();
      await getAllJobs(req, reply);
      expect(reply.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('filters by remote', async () => {
      await seedJobs();
      const req = mockRequest({ query: { remote: 'true' } });
      const reply = mockReply();
      await getAllJobs(req, reply);
      expect(reply.body.data.length).toBeGreaterThanOrEqual(1);
      expect(reply.body.data.some(j => j.location.toLowerCase().includes('remote'))).toBe(true);
    });

    it('sorts by postedAt', async () => {
      await seedJobs();
      const req = mockRequest({ query: { sortBy: 'postedAt', order: 'desc' } });
      const reply = mockReply();
      await getAllJobs(req, reply);
      expect(reply.body.success).toBe(true);
    });

    it('caps limit at 100', async () => {
      await seedJobs();
      const req = mockRequest({ query: { limit: '500' } });
      const reply = mockReply();
      await getAllJobs(req, reply);
      expect(reply.body.pagination.limit).toBe(100);
    });

    it('filters by skills', async () => {
      await seedJobs();
      const req = mockRequest({ query: { skills: 'node' } });
      const reply = mockReply();
      await getAllJobs(req, reply);
      expect(reply.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getTopRankedJobs', () => {
    it('returns top-scored active jobs', async () => {
      await seedJobs();
      const req = mockRequest({ query: { limit: '3' } });
      const reply = mockReply();
      await getTopRankedJobs(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.length).toBeLessThanOrEqual(3);
      // First should have highest score
      if (reply.body.data.length >= 2) {
        expect(reply.body.data[0].score).toBeGreaterThanOrEqual(reply.body.data[1].score);
      }
    });
  });

  describe('getJobById', () => {
    it('returns job with similar jobs', async () => {
      const jobs = await seedJobs();
      const req = mockRequest({ params: { id: jobs[0]._id.toString() } });
      const reply = mockReply();
      await getJobById(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.job.title).toBe('Node Developer');
      expect(Array.isArray(reply.body.data.similarJobs)).toBe(true);
    });

    it('returns 404 for non-existent job', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const req = mockRequest({ params: { id: fakeId } });
      const reply = mockReply();
      await getJobById(req, reply);
      expect(reply.statusCode).toBe(404);
    });
  });

  describe('searchJobs', () => {
    it('searches across title, company, description, location', async () => {
      await seedJobs();
      const req = mockRequest({ query: { q: 'Python' } });
      const reply = mockReply();
      await searchJobs(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('rejects query shorter than 2 chars', async () => {
      const req = mockRequest({ query: { q: 'a' } });
      const reply = mockReply();
      await searchJobs(req, reply);
      expect(reply.statusCode).toBe(400);
    });

    it('returns empty for no matches', async () => {
      await seedJobs();
      const req = mockRequest({ query: { q: 'zzzznoexist' } });
      const reply = mockReply();
      await searchJobs(req, reply);
      expect(reply.body.data).toHaveLength(0);
    });
  });

  describe('getJobStats', () => {
    it('returns job statistics', async () => {
      await seedJobs();
      const req = mockRequest();
      const reply = mockReply();
      await getJobStats(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.overall).toBeDefined();
      expect(reply.body.data.bySource).toBeDefined();
    });

    it('returns zeros when no jobs', async () => {
      const req = mockRequest();
      const reply = mockReply();
      await getJobStats(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.overall.totalJobs).toBe(0);
    });
  });

  describe('resendAllJobs', () => {
    it('re-scores all active jobs', async () => {
      await seedJobs();
      const req = mockRequest();
      const reply = mockReply();
      await resendAllJobs(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.count).toBeGreaterThan(0);
    });
  });

  describe('cleanupOldJobs', () => {
    it('deletes jobs older than N days', async () => {
      const old = new Date();
      old.setDate(old.getDate() - 90);
      await Job.create({ title: 'Ancient', company: 'Co', location: 'NYC', postedAt: old, hash: 'cleanup1' });
      await Job.create({ title: 'Fresh', company: 'Co', location: 'LA', postedAt: new Date(), hash: 'cleanup2' });
      const req = mockRequest({ query: { days: '60' } });
      const reply = mockReply();
      await cleanupOldJobs(req, reply);
      expect(reply.body.success).toBe(true);
      expect(await Job.countDocuments()).toBe(1);
    });

    it('rejects days < 7', async () => {
      const req = mockRequest({ query: { days: '3' } });
      const reply = mockReply();
      await cleanupOldJobs(req, reply);
      expect(reply.statusCode).toBe(400);
    });
  });

  describe('debugDeleteAllJobs', () => {
    it('deletes all jobs', async () => {
      await seedJobs();
      const req = mockRequest();
      const reply = mockReply();
      await debugDeleteAllJobs(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.deletedCount).toBeGreaterThan(0);
      expect(await Job.countDocuments()).toBe(0);
    });
  });
});
