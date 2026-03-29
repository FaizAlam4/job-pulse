import Notification from '../models/Notification.js';

/**
 * Create a notification (deduplicated by dedupKey)
 * @param {Object} param0
 * @param {string} param0.message
 * @param {string} [param0.type]
 * @param {Object} [param0.meta]
 * @param {string} [param0.dedupKey]
 */
export async function createNotification({ message, type = 'info', meta, dedupKey }) {
  if (!message) return;
  try {
    if (dedupKey) {
      await Notification.findOneAndUpdate(
        { dedupKey },
        { $setOnInsert: { message, type, meta, dedupKey } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      await Notification.create({ message, type, meta });
    }
  } catch (err) {
    // Silent fail for notification
    console.warn('Notification error:', err.message);
  }
}
