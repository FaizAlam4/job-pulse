// Usage: node scripts/testNotification.js
import mongoose from 'mongoose';
import { config } from '../src/config/index.js';
import Notification from '../src/models/Notification.js';
import { createNotification } from '../src/services/notificationService.js';

async function main() {
  await mongoose.connect(config.mongodbUri);

  // Simulate deduplication/ingest result
  const ingestResult = {
    saved: 10,
    filters: { country: 'India', remote: true },
  };
  const now = new Date();
  const dedupKey = `ingest-${now.toISOString().slice(0, 13)}`;

  await createNotification({
    message: `${ingestResult.saved} new jobs posted`,
    type: 'success',
    meta: { count: ingestResult.saved, filters: ingestResult.filters },
    dedupKey,
  });
  console.log('Ingest notification created.');

  // Simulate cleanup result
  const cleanupResult = {
    deletedCount: 5,
    freedMB: 0.04,
    cutoffDate: now.toISOString(),
  };
  const cleanupDedupKey = `cleanup-${now.toISOString().slice(0, 10)}`;

  await createNotification({
    message: `${cleanupResult.deletedCount} old jobs deleted`,
    type: 'warning',
    meta: { ...cleanupResult },
    dedupKey: cleanupDedupKey,
  });
  console.log('Cleanup notification created.');

  // Show all notifications
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(5);
  console.log('Recent notifications:', notifications.map(n => ({ message: n.message, createdAt: n.createdAt })));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
