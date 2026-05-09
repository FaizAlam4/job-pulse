import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import Notification from '../../src/models/Notification.js';
import { deleteOldNotifications, startNotificationCleanupScheduler, stopNotificationCleanupScheduler } from '../../src/schedulers/notificationScheduler.js';

describe('notificationScheduler', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterEach(async () => { await clearTestDB(); });
  afterAll(async () => {
    stopNotificationCleanupScheduler();
    await closeTestDB();
  });
  beforeEach(async () => { await clearTestDB(); });

  describe('deleteOldNotifications', () => {
    it('deletes notifications older than N days', async () => {
      const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
      await Notification.create([
        { message: 'Old', createdAt: old },
        { message: 'Recent', createdAt: new Date() },
      ]);
      const result = await deleteOldNotifications(30);
      expect(result.deletedCount).toBe(1);
      const remaining = await Notification.find();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].message).toBe('Recent');
    });

    it('returns 0 when nothing to delete', async () => {
      const result = await deleteOldNotifications(30);
      expect(result.deletedCount).toBe(0);
    });
  });

  describe('scheduler lifecycle', () => {
    it('starts and stops without error', () => {
      startNotificationCleanupScheduler();
      // Starting again should be a no-op (guard against double-start)
      startNotificationCleanupScheduler();
      stopNotificationCleanupScheduler();
      // Stopping again should be safe
      stopNotificationCleanupScheduler();
    });
  });
});
