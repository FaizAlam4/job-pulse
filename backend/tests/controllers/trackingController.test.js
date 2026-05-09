import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import mongoose from 'mongoose';
import Tracking from '../../src/models/Tracking.js';
import Job from '../../src/models/Job.js';
import {
  trackJob,
  getTrackedJobs,
  getTrackedJob,
  updateTrackedJob,
  addInterview,
  addContact,
  deleteTrackedJob,
  getTrackingAnalytics,
  checkJobTracking,
} from '../../src/controllers/trackingController.js';

const userId = new mongoose.Types.ObjectId().toString();

function mockRequest(opts = {}) {
  return {
    body: opts.body || {},
    query: opts.query || {},
    params: opts.params || {},
    user: opts.user || { userId },
  };
}

function mockReply() {
  const r = { statusCode: 200, body: null };
  r.code = (c) => { r.statusCode = c; return r; };
  r.send = (data) => { r.body = data; return r; };
  r.status = (c) => { r.statusCode = c; return r; };
  return r;
}

describe('trackingController', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  describe('trackJob', () => {
    it('creates a new tracking entry', async () => {
      // trackJob requires a real Job in DB (looks it up by jobId)
      const job = await Job.create({
        title: 'Dev', company: 'Acme', location: 'NYC',
        postedAt: new Date(), hash: 'track-job-1',
      });
      const req = mockRequest({
        body: { jobId: job._id.toString(), status: 'applied', notes: 'Applied via website' },
      });
      const reply = mockReply();
      await trackJob(req, reply);
      expect(reply.statusCode).toBe(201);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.tracking.jobSnapshot.title).toBe('Dev');
    });

    it('rejects missing jobId', async () => {
      const req = mockRequest({ body: {} });
      const reply = mockReply();
      await trackJob(req, reply);
      expect(reply.statusCode).toBe(400);
    });
  });

  describe('getTrackedJobs', () => {
    it('returns paginated results for user', async () => {
      const jobId1 = new mongoose.Types.ObjectId();
      const jobId2 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: jobId1, jobSnapshot: { title: 'A', company: 'Co', location: 'NYC' }, status: 'saved' },
        { userId, jobId: jobId2, jobSnapshot: { title: 'B', company: 'Co', location: 'LA' }, status: 'applied' },
      ]);
      const req = mockRequest({ query: { page: '1', limit: '10' } });
      const reply = mockReply();
      await getTrackedJobs(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.length).toBe(2);
      expect(reply.body.pagination.totalCount).toBe(2);
    });

    it('only returns jobs for the authenticated user', async () => {
      const otherId = new mongoose.Types.ObjectId().toString();
      const jobId1 = new mongoose.Types.ObjectId();
      const jobId2 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: jobId1, jobSnapshot: { title: 'Mine', company: 'Co', location: 'NYC' } },
        { userId: otherId, jobId: jobId2, jobSnapshot: { title: 'Not Mine', company: 'Co', location: 'LA' } },
      ]);
      const req = mockRequest({ query: {} });
      const reply = mockReply();
      await getTrackedJobs(req, reply);
      expect(reply.body.data).toHaveLength(1);
      expect(reply.body.data[0].jobSnapshot.title).toBe('Mine');
    });

    it('filters by status', async () => {
      const jid1 = new mongoose.Types.ObjectId();
      const jid2 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: jid1, jobSnapshot: { title: 'A', company: 'Co', location: 'NYC' }, status: 'saved' },
        { userId, jobId: jid2, jobSnapshot: { title: 'B', company: 'Co', location: 'LA' }, status: 'applied' },
      ]);
      const req = mockRequest({ query: { status: 'applied' } });
      const reply = mockReply();
      await getTrackedJobs(req, reply);
      expect(reply.body.data).toHaveLength(1);
      expect(reply.body.data[0].status).toBe('applied');
    });
  });

  describe('getTrackedJob', () => {
    it('returns a single tracked job', async () => {
      const jid = new mongoose.Types.ObjectId();
      const t = await Tracking.create({
        userId, jobId: jid, jobSnapshot: { title: 'Single', company: 'Co', location: 'NYC' },
      });
      const req = mockRequest({ params: { trackingId: t._id.toString() } });
      const reply = mockReply();
      await getTrackedJob(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.jobSnapshot.title).toBe('Single');
    });

    it('returns 404 for non-existent tracking', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const req = mockRequest({ params: { trackingId: fakeId } });
      const reply = mockReply();
      await getTrackedJob(req, reply);
      expect(reply.statusCode).toBe(404);
    });
  });

  describe('updateTrackedJob', () => {
    it('updates status and appends to statusHistory', async () => {
      const jid = new mongoose.Types.ObjectId();
      const t = await Tracking.create({
        userId, jobId: jid, jobSnapshot: { title: 'Update', company: 'Co', location: 'NYC' }, status: 'saved',
      });
      const req = mockRequest({
        params: { trackingId: t._id.toString() },
        body: { status: 'applied', notes: 'Sent resume' },
      });
      const reply = mockReply();
      await updateTrackedJob(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.status).toBe('applied');
      // statusHistory should have the new status
      const updated = await Tracking.findById(t._id);
      const hasApplied = updated.statusHistory.some((h) => h.status === 'applied');
      expect(hasApplied).toBe(true);
    });
  });

  describe('addInterview', () => {
    it('adds an interview to a tracking', async () => {
      const jid = new mongoose.Types.ObjectId();
      const t = await Tracking.create({
        userId, jobId: jid, jobSnapshot: { title: 'Int', company: 'Co', location: 'NYC' },
      });
      const req = mockRequest({
        params: { trackingId: t._id.toString() },
        body: { date: new Date().toISOString(), type: 'phone', notes: 'HR call' },
      });
      const reply = mockReply();
      await addInterview(req, reply);
      expect(reply.body.success).toBe(true);
      const updated = await Tracking.findById(t._id);
      expect(updated.interviews).toHaveLength(1);
    });
  });

  describe('addContact', () => {
    it('adds a contact to a tracking', async () => {
      const jid = new mongoose.Types.ObjectId();
      const t = await Tracking.create({
        userId, jobId: jid, jobSnapshot: { title: 'Con', company: 'Co', location: 'NYC' },
      });
      const req = mockRequest({
        params: { trackingId: t._id.toString() },
        body: { name: 'Jane', role: 'Recruiter', email: 'jane@co.com' },
      });
      const reply = mockReply();
      await addContact(req, reply);
      expect(reply.body.success).toBe(true);
      const updated = await Tracking.findById(t._id);
      expect(updated.contacts).toHaveLength(1);
    });
  });

  describe('deleteTrackedJob', () => {
    it('deletes a tracking entry', async () => {
      const jid = new mongoose.Types.ObjectId();
      const t = await Tracking.create({
        userId, jobId: jid, jobSnapshot: { title: 'Del', company: 'Co', location: 'NYC' },
      });
      const req = mockRequest({ params: { trackingId: t._id.toString() } });
      const reply = mockReply();
      await deleteTrackedJob(req, reply);
      expect(reply.body.success).toBe(true);
      expect(await Tracking.countDocuments()).toBe(0);
    });
  });

  describe('getTrackingAnalytics', () => {
    it('returns analytics for user trackings', async () => {
      const jid1 = new mongoose.Types.ObjectId();
      const jid2 = new mongoose.Types.ObjectId();
      const jid3 = new mongoose.Types.ObjectId();
      await Tracking.create([
        { userId, jobId: jid1, jobSnapshot: { title: 'A', company: 'Acme', location: 'NYC' }, status: 'applied' },
        { userId, jobId: jid2, jobSnapshot: { title: 'B', company: 'Acme', location: 'NYC' }, status: 'interview' },
        { userId, jobId: jid3, jobSnapshot: { title: 'C', company: 'Beta', location: 'LA' }, status: 'rejected' },
      ]);
      const req = mockRequest();
      const reply = mockReply();
      await getTrackingAnalytics(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.total).toBe(3);
      expect(reply.body.data.byStatus.applied).toBe(1);
      expect(reply.body.data.byStatus.interview).toBe(1);
    });

    it('returns empty analytics when no trackings', async () => {
      const req = mockRequest();
      const reply = mockReply();
      await getTrackingAnalytics(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.data.total).toBe(0);
    });
  });

  describe('checkJobTracking', () => {
    it('returns isTracked true when tracked', async () => {
      const jobId = new mongoose.Types.ObjectId();
      await Tracking.create({
        userId, jobId, jobSnapshot: { title: 'Tracked', company: 'Co', location: 'NYC' },
      });
      const req = mockRequest({ params: { jobId: jobId.toString() } });
      const reply = mockReply();
      await checkJobTracking(req, reply);
      expect(reply.body.isTracked).toBe(true);
      expect(reply.body.tracking || reply.body.trackingId).toBeDefined();
    });

    it('returns isTracked false when not tracked', async () => {
      const fakeJobId = new mongoose.Types.ObjectId().toString();
      const req = mockRequest({ params: { jobId: fakeJobId } });
      const reply = mockReply();
      await checkJobTracking(req, reply);
      expect(reply.body.isTracked).toBe(false);
    });
  });
});
