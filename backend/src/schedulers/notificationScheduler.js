import cron from 'node-cron';
import Notification from '../models/Notification.js';

/**
 * Delete notifications older than N days
 * @param {number} days - Number of days to keep
 * @returns {Promise<{deletedCount: number}>}
 */
export async function deleteOldNotifications(days = 30) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await Notification.deleteMany({ createdAt: { $lt: cutoff } });
  return { deletedCount: result.deletedCount };
}

let notificationCleanupJob = null;

/**
 * Start notification cleanup scheduler (runs daily at 3:00 AM)
 */
export function startNotificationCleanupScheduler() {
  if (notificationCleanupJob) return;
  notificationCleanupJob = cron.schedule('0 3 * * *', async () => {
    console.log(`[${new Date().toISOString()}] 🧹 Notification cleanup triggered`);
    try {
      const result = await deleteOldNotifications(30);
      console.log(`✓ Notification cleanup: Deleted ${result.deletedCount} notifications older than 30 days`);
    } catch (error) {
      console.error(`✗ Notification cleanup error: ${error.message}`);
    }
  });
  console.log('✓ Notification cleanup scheduler initialized (daily at 3:00 AM UTC)');
}

/**
 * Stop notification cleanup scheduler
 */
export function stopNotificationCleanupScheduler() {
  if (notificationCleanupJob) {
    notificationCleanupJob.stop();
    notificationCleanupJob = null;
    console.log('⏹ Notification cleanup scheduler stopped');
  }
}
