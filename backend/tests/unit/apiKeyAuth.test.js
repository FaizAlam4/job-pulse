import { describe, it, expect } from 'vitest';
import { apiKeyAuth } from '../../src/middleware/apiKeyAuth.js';

function createMockReply() {
  const reply = {
    statusCode: null,
    body: null,
    code(c) { reply.statusCode = c; return reply; },
    send(data) { reply.body = data; return reply; },
  };
  return reply;
}

describe('apiKeyAuth', () => {
  it('rejects when no API key provided', async () => {
    const req = { headers: {}, query: {} };
    const reply = createMockReply();
    await apiKeyAuth(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.body.error).toMatch(/unauthorized/i);
  });

  it('rejects wrong API key in header', async () => {
    const req = { headers: { 'x-api-key': 'wrong-key' }, query: {} };
    const reply = createMockReply();
    await apiKeyAuth(req, reply);
    expect(reply.statusCode).toBe(401);
  });

  it('accepts valid API key in header', async () => {
    const req = { headers: { 'x-api-key': process.env.ADMIN_API_KEY }, query: {} };
    const reply = createMockReply();
    await apiKeyAuth(req, reply);
    // Should not set status code (no error)
    expect(reply.statusCode).toBeNull();
  });

  it('accepts valid API key in query param', async () => {
    const req = { headers: {}, query: { api_key: process.env.ADMIN_API_KEY } };
    const reply = createMockReply();
    await apiKeyAuth(req, reply);
    expect(reply.statusCode).toBeNull();
  });

  it('rejects wrong API key in query param', async () => {
    const req = { headers: {}, query: { api_key: 'nope' } };
    const reply = createMockReply();
    await apiKeyAuth(req, reply);
    expect(reply.statusCode).toBe(401);
  });
});
