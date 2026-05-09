import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import Notification from '../../src/models/Notification.js';

describe('Notification model', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  it('creates with required message', async () => {
    const n = await Notification.create({ message: 'Hello' });
    expect(n.message).toBe('Hello');
    expect(n.type).toBe('info');
  });

  it('validates type enum', async () => {
    const n = new Notification({ message: 'Test', type: 'invalid' });
    await expect(n.save()).rejects.toThrow();
  });

  it('accepts all valid types', async () => {
    for (const type of ['info', 'success', 'warning', 'error']) {
      await clearTestDB();
      const n = await Notification.create({ message: 'Test', type });
      expect(n.type).toBe(type);
    }
  });

  it('enforces unique dedupKey', async () => {
    await Notification.create({ message: 'A', dedupKey: 'unique1' });
    await expect(
      Notification.create({ message: 'B', dedupKey: 'unique1' })
    ).rejects.toThrow();
  });

  it('allows multiple nullish dedupKeys', async () => {
    await Notification.create({ message: 'A' });
    await Notification.create({ message: 'B' });
    const count = await Notification.countDocuments();
    expect(count).toBe(2);
  });
});
