import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateToken, optionalAuth } from '../../src/middleware/authMiddleware.js';

function createMockRequest(authHeader) {
  return { headers: { authorization: authHeader } };
}

function createMockReply() {
  const reply = {
    statusCode: null,
    body: null,
    code(c) { reply.statusCode = c; return reply; },
    send(data) { reply.body = data; return reply; },
  };
  return reply;
}

describe('authenticateToken', () => {
  it('rejects when no Authorization header', async () => {
    const req = createMockRequest(undefined);
    const reply = createMockReply();
    await authenticateToken(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.body.message).toMatch(/no token/i);
  });

  it('rejects empty Bearer token', async () => {
    const req = createMockRequest('Bearer ');
    const reply = createMockReply();
    await authenticateToken(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.body.message).toMatch(/invalid token/i);
  });

  it('rejects invalid token', async () => {
    const req = createMockRequest('Bearer invalid.jwt.token');
    const reply = createMockReply();
    await authenticateToken(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.body.message).toMatch(/invalid token/i);
  });

  it('rejects expired token', async () => {
    const expired = jwt.sign(
      { userId: '123', email: 'a@b.com' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    // Wait a tick so it actually expires
    await new Promise((r) => setTimeout(r, 10));
    const req = createMockRequest(`Bearer ${expired}`);
    const reply = createMockReply();
    await authenticateToken(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.body.message).toMatch(/expired/i);
  });

  it('sets request.user for valid token', async () => {
    const token = jwt.sign(
      { userId: 'abc123', email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const req = createMockRequest(`Bearer ${token}`);
    const reply = createMockReply();
    await authenticateToken(req, reply);
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('abc123');
    expect(req.user.email).toBe('test@example.com');
    // reply should NOT have been sent
    expect(reply.statusCode).toBeNull();
  });

  it('accepts token without Bearer prefix', async () => {
    const token = jwt.sign(
      { userId: 'abc123', email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const req = createMockRequest(token);
    const reply = createMockReply();
    await authenticateToken(req, reply);
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('abc123');
  });
});

describe('optionalAuth', () => {
  it('sets user to null when no header', async () => {
    const req = createMockRequest(undefined);
    const reply = createMockReply();
    await optionalAuth(req, reply);
    expect(req.user).toBeNull();
  });

  it('sets user for valid token', async () => {
    const token = jwt.sign(
      { userId: 'user1', email: 'u@e.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const req = createMockRequest(`Bearer ${token}`);
    const reply = createMockReply();
    await optionalAuth(req, reply);
    expect(req.user.userId).toBe('user1');
  });

  it('sets user to null for invalid token (no error)', async () => {
    const req = createMockRequest('Bearer garbage');
    const reply = createMockReply();
    await optionalAuth(req, reply);
    expect(req.user).toBeNull();
    // Should NOT return an error
    expect(reply.statusCode).toBeNull();
  });
});
