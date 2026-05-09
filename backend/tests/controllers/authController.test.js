import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB, generateTestToken } from '../helpers.js';
import User from '../../src/models/User.js';
import { register, login, getProfile, updateProfile, verifyToken } from '../../src/controllers/authController.js';

function mockRequest(body = {}, headers = {}, user = null) {
  return { body, headers, user };
}

function mockReply() {
  const r = { statusCode: 200, body: null };
  r.code = (c) => { r.statusCode = c; return r; };
  r.send = (data) => { r.body = data; return r; };
  return r;
}

describe('authController', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  describe('register', () => {
    it('registers a new user', async () => {
      const req = mockRequest({ name: 'Test', email: 'new@test.com', password: 'pass123' });
      const reply = mockReply();
      await register(req, reply);
      expect(reply.statusCode).toBe(201);
      expect(reply.body.success).toBe(true);
      expect(reply.body.token).toBeDefined();
      expect(reply.body.user.email).toBe('new@test.com');
      expect(reply.body.user.password).toBeUndefined();
    });

    it('rejects missing fields', async () => {
      const req = mockRequest({ email: 'no@name.com' });
      const reply = mockReply();
      await register(req, reply);
      expect(reply.statusCode).toBe(400);
    });

    it('rejects duplicate email', async () => {
      await User.create({ name: 'Existing', email: 'dup@test.com', password: 'pass123' });
      const req = mockRequest({ name: 'New', email: 'dup@test.com', password: 'pass456' });
      const reply = mockReply();
      await register(req, reply);
      expect(reply.statusCode).toBe(409);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await User.create({ name: 'Login User', email: 'login@test.com', password: 'correct123' });
    });

    it('logs in with correct credentials', async () => {
      const req = mockRequest({ email: 'login@test.com', password: 'correct123' });
      const reply = mockReply();
      await login(req, reply);
      expect(reply.statusCode).toBe(200);
      expect(reply.body.success).toBe(true);
      expect(reply.body.token).toBeDefined();
    });

    it('rejects wrong password', async () => {
      const req = mockRequest({ email: 'login@test.com', password: 'wrong' });
      const reply = mockReply();
      await login(req, reply);
      expect(reply.statusCode).toBe(401);
    });

    it('rejects non-existent email', async () => {
      const req = mockRequest({ email: 'noone@test.com', password: 'pass' });
      const reply = mockReply();
      await login(req, reply);
      expect(reply.statusCode).toBe(404);
    });

    it('rejects missing fields', async () => {
      const req = mockRequest({ email: 'login@test.com' });
      const reply = mockReply();
      await login(req, reply);
      expect(reply.statusCode).toBe(400);
    });

    it('rejects deactivated user', async () => {
      await User.updateOne({ email: 'login@test.com' }, { isActive: false });
      const req = mockRequest({ email: 'login@test.com', password: 'correct123' });
      const reply = mockReply();
      await login(req, reply);
      expect(reply.statusCode).toBe(403);
    });
  });

  describe('getProfile', () => {
    it('returns user profile', async () => {
      const user = await User.create({ name: 'Profile', email: 'profile@test.com', password: 'pass123' });
      const req = mockRequest({}, {}, { userId: user._id.toString() });
      req.user = { userId: user._id.toString() };
      const reply = mockReply();
      await getProfile(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.user.name).toBe('Profile');
    });

    it('returns 404 for missing user', async () => {
      const req = mockRequest({}, {}, { userId: '507f1f77bcf86cd799439099' });
      req.user = { userId: '507f1f77bcf86cd799439099' };
      const reply = mockReply();
      await getProfile(req, reply);
      expect(reply.statusCode).toBe(404);
    });
  });

  describe('updateProfile', () => {
    it('updates allowed fields', async () => {
      const user = await User.create({ name: 'Old Name', email: 'update@test.com', password: 'pass123' });
      const req = mockRequest({ name: 'New Name', bio: 'Hello' });
      req.user = { userId: user._id.toString() };
      const reply = mockReply();
      await updateProfile(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.user.name).toBe('New Name');
    });

    it('strips email/password/_id from updates', async () => {
      const user = await User.create({ name: 'Secure', email: 'secure@test.com', password: 'pass123' });
      const req = mockRequest({ email: 'hacked@evil.com', password: 'hacked', _id: 'fake', name: 'Still Me' });
      req.user = { userId: user._id.toString() };
      const reply = mockReply();
      await updateProfile(req, reply);
      expect(reply.body.user.email).toBe('secure@test.com'); // unchanged
    });
  });

  describe('verifyToken', () => {
    it('returns valid true for existing user', async () => {
      const user = await User.create({ name: 'Verify', email: 'verify@test.com', password: 'pass123' });
      const req = mockRequest();
      req.user = { userId: user._id.toString() };
      const reply = mockReply();
      await verifyToken(req, reply);
      expect(reply.body.success).toBe(true);
      expect(reply.body.valid).toBe(true);
    });
  });
});
