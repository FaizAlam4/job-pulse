import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import Notification from '../../src/models/Notification.js';
import {
  getAllNotifications,
  createNotification,
  deleteNotification,
} from '../../src/controllers/notificationController.js';

function mockRequest(opts = {}) {
  return {
    query: opts.query || {},
    body: opts.body || {},
    params: opts.params || {},
  };
}

function mockReply() {
  const r = { statusCode: 200, body: null };
  r.code = (c) => { r.statusCode = c; return r; };
  r.send = (data) => { r.body = data; return r; };
  return r;
}

describe('notificationController', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  describe('getAllNotifications', () => {
    it('returns paginated notifications', async () => {
      await Notification.create([
        { message: 'A' }, { message: 'B' }, { message: 'C' },
      ]);
      const req = mockRequest({ query: { page: '1', limit: '2' } });
      const reply = mockReply();
      await getAllNotifications(req, reply);
      expect(reply.body.total).toBe(3);
      expect(reply.body.items).toHaveLength(2);
      expect(reply.body.totalPages).toBe(2);
    });

    it('returns empty list when none', async () => {
      const req = mockRequest();
      const reply = mockReply();
      await getAllNotifications(req, reply);
      expect(reply.body.total).toBe(0);
      expect(reply.body.items).toHaveLength(0);
    });
  });

  describe('createNotification', () => {
    it('creates a new notification', async () => {
      const req = mockRequest({ body: { message: 'New job alert', type: 'success' } });
      const reply = mockReply();
      await createNotification(req, reply);
      expect(reply.statusCode).toBe(201);
      expect(reply.body.message).toBe('New job alert');
    });

    it('rejects empty message', async () => {
      const req = mockRequest({ body: {} });
      const reply = mockReply();
      await createNotification(req, reply);
      expect(reply.statusCode).toBe(400);
    });

    it('deduplicates by dedupKey', async () => {
      const req1 = mockRequest({ body: { message: 'First', dedupKey: 'dk1' } });
      const req2 = mockRequest({ body: { message: 'Second', dedupKey: 'dk1' } });
      const reply1 = mockReply();
      const reply2 = mockReply();
      await createNotification(req1, reply1);
      await createNotification(req2, reply2);
      const count = await Notification.countDocuments();
      expect(count).toBe(1);
    });
  });

  describe('deleteNotification', () => {
    it('deletes a notification by id', async () => {
      const n = await Notification.create({ message: 'To delete' });
      const req = mockRequest({ params: { id: n._id.toString() } });
      const reply = mockReply();
      await deleteNotification(req, reply);
      expect(reply.body.success).toBe(true);
      expect(await Notification.countDocuments()).toBe(0);
    });
  });
});
