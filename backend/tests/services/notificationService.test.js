import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import { createNotification } from '../../src/services/notificationService.js';
import Notification from '../../src/models/Notification.js';

describe('notificationService', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  it('creates a simple notification', async () => {
    await createNotification({ message: 'Test alert', type: 'info' });
    const notifs = await Notification.find();
    expect(notifs).toHaveLength(1);
    expect(notifs[0].message).toBe('Test alert');
    expect(notifs[0].type).toBe('info');
  });

  it('does nothing for empty message', async () => {
    await createNotification({ message: '' });
    const notifs = await Notification.find();
    expect(notifs).toHaveLength(0);
  });

  it('deduplicates by dedupKey', async () => {
    await createNotification({ message: 'First', type: 'info', dedupKey: 'key1' });
    await createNotification({ message: 'Duplicate', type: 'info', dedupKey: 'key1' });
    const notifs = await Notification.find();
    expect(notifs).toHaveLength(1);
    expect(notifs[0].message).toBe('First'); // first one wins
  });

  it('allows different dedupKeys', async () => {
    await createNotification({ message: 'A', dedupKey: 'k1' });
    await createNotification({ message: 'B', dedupKey: 'k2' });
    const notifs = await Notification.find();
    expect(notifs).toHaveLength(2);
  });

  it('stores meta data', async () => {
    await createNotification({ message: 'With meta', meta: { count: 42 } });
    const notif = await Notification.findOne();
    expect(notif.meta.count).toBe(42);
  });
});
