import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import mongoose from 'mongoose';
import Tracking from '../../src/models/Tracking.js';
import {
  getOverviewStats,
  getApplicationTrends,
  getSourcesBreakdown,
  getSkillsAnalysis,
  getGoalsProgress,
} from '../../src/controllers/insightsController.js';

const userId = new mongoose.Types.ObjectId().toString();

function mockRequest(opts = {}) {
  return {
    query: opts.query || {},
    user: { userId },
  };
}

function mockReply() {
  const r = { statusCode: 200, body: null };
  r.code = (c) => { r.statusCode = c; return r; };
  r.send = (data) => { r.body = data; return r; };
  r.status = (c) => { r.statusCode = c; return r; };
  return r;
}

describe('insightsController', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  describe('getOverviewStats', () => {
    it('returns zeros when no trackings', async () => {
      const req = mockRequest();
      const reply = mockReply();
      await getOverviewStats(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.totalApplications).toBe(0);
      expect(reply.body.data.statusBreakdown).toEqual({});
    });

    it('returns correct status breakdown', async () => {
      const j1 = new mongoose.Types.ObjectId();
      const j2 = new mongoose.Types.ObjectId();
      const j3 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: j1, jobSnapshot: { title: 'A', company: 'Co', location: 'NYC' }, status: 'applied' },
        { userId, jobId: j2, jobSnapshot: { title: 'B', company: 'Co', location: 'LA' }, status: 'applied' },
        { userId, jobId: j3, jobSnapshot: { title: 'C', company: 'Co', location: 'SF' }, status: 'interview' },
      ]);
      const req = mockRequest();
      const reply = mockReply();
      await getOverviewStats(req, reply);
      expect(reply.body.data.totalApplications).toBe(3);
      expect(reply.body.data.statusBreakdown.applied).toBe(2);
      expect(reply.body.data.statusBreakdown.interview).toBe(1);
    });

    it('calculates response rate', async () => {
      const j1 = new mongoose.Types.ObjectId();
      const j2 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: j1, jobSnapshot: { title: 'A', company: 'Co', location: 'NYC' }, status: 'applied' },
        { userId, jobId: j2, jobSnapshot: { title: 'B', company: 'Co', location: 'LA' }, status: 'interview' },
      ]);
      const req = mockRequest();
      const reply = mockReply();
      await getOverviewStats(req, reply);
      // 1 out of 2 non-saved got response
      expect(reply.body.data.responseRate).toBe(50);
    });

    it('returns top companies', async () => {
      const j1 = new mongoose.Types.ObjectId();
      const j2 = new mongoose.Types.ObjectId();
      const j3 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: j1, jobSnapshot: { title: 'A', company: 'Google', location: 'NYC' }, status: 'applied' },
        { userId, jobId: j2, jobSnapshot: { title: 'B', company: 'Google', location: 'LA' }, status: 'applied' },
        { userId, jobId: j3, jobSnapshot: { title: 'C', company: 'Meta', location: 'SF' }, status: 'applied' },
      ]);
      const req = mockRequest();
      const reply = mockReply();
      await getOverviewStats(req, reply);
      expect(reply.body.data.topCompanies[0].name).toBe('Google');
      expect(reply.body.data.topCompanies[0].count).toBe(2);
    });
  });

  describe('getApplicationTrends', () => {
    it('returns trends for a period', async () => {
      const now = new Date();
      const j1 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: j1, jobSnapshot: { title: 'A', company: 'Co', location: 'NYC' }, status: 'applied', createdAt: now },
      ]);
      const req = mockRequest({ query: { period: '7' } });
      const reply = mockReply();
      await getApplicationTrends(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.daily).toBeDefined();
      expect(Array.isArray(reply.body.data.daily)).toBe(true);
    });

    it('returns empty trends when no data', async () => {
      const req = mockRequest({ query: { period: '30' } });
      const reply = mockReply();
      await getApplicationTrends(req, reply);
      expect(reply.body.success).toBe(true);
    });
  });

  describe('getSourcesBreakdown', () => {
    it('returns breakdown by source', async () => {
      const jid1 = new mongoose.Types.ObjectId();
      const jid2 = new mongoose.Types.ObjectId();
      const jid3 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: jid1, jobSnapshot: { title: 'A', company: 'Co', location: 'NYC', source: 'google-jobs' }, status: 'applied' },
        { userId, jobId: jid2, jobSnapshot: { title: 'B', company: 'Co', location: 'LA', source: 'remotive' }, status: 'applied' },
        { userId, jobId: jid3, jobSnapshot: { title: 'C', company: 'Co', location: 'SF', source: 'google-jobs' }, status: 'interview' },
      ]);
      const req = mockRequest();
      const reply = mockReply();
      await getSourcesBreakdown(req, reply);
      expect(reply.body.success).toBe(true);
      expect(Array.isArray(reply.body.data)).toBe(true);
      expect(reply.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('getSkillsAnalysis', () => {
    it('returns skills data', async () => {
      const j1 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: j1, jobSnapshot: { title: 'Dev', company: 'Co', location: 'NYC', keywords: ['node', 'react'] }, status: 'applied' },
      ]);
      const req = mockRequest();
      const reply = mockReply();
      await getSkillsAnalysis(req, reply);
      expect(reply.body.success).toBe(true);
    });
  });

  describe('getGoalsProgress', () => {
    it('returns goals data', async () => {
      const now = new Date();
      const j1 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: j1, jobSnapshot: { title: 'A', company: 'Co', location: 'NYC' }, status: 'applied', createdAt: now },
      ]);
      const req = mockRequest();
      const reply = mockReply();
      await getGoalsProgress(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data).toBeDefined();
    });
  });
});
