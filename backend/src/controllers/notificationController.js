import Notification from '../models/Notification.js';
import { cacheGet, cacheSet, cacheDelKeys } from '../utils/cache.js';

const UNREAD_COUNT_KEY = 'notifications:unread-count';
const UNREAD_COUNT_TTL = 30; // 30 seconds — short TTL so badge stays fresh

// Get all notifications (most recent first)
export const getAllNotifications = async (request, reply) => {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments();
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    reply.send({
      items: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    reply.code(500).send({ error: 'Failed to fetch notifications' });
  }
};

// Count unread notifications (Redis-cached for 30 s)
export const getUnreadCount = async (request, reply) => {
  try {
    const cached = await cacheGet(UNREAD_COUNT_KEY);
    if (cached !== null) return reply.send(cached);

    const count = await Notification.countDocuments({ isRead: false });
    const payload = { count };
    await cacheSet(UNREAD_COUNT_KEY, payload, UNREAD_COUNT_TTL);
    reply.send(payload);
  } catch (err) {
    reply.code(500).send({ error: 'Failed to count unread notifications' });
  }
};

// Mark all notifications as read
export const markAllRead = async (request, reply) => {
  try {
    await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
    await cacheDelKeys(UNREAD_COUNT_KEY); // invalidate cached count
    reply.send({ success: true });
  } catch (err) {
    reply.code(500).send({ error: 'Failed to mark notifications as read' });
  }
};

// Create a new notification (deduplicated by dedupKey)
export const createNotification = async (request, reply) => {
  try {
    const { message, type = 'info', meta, dedupKey } = request.body;
    if (!message) return reply.code(400).send({ error: 'Message is required' });
    let notification;
    if (dedupKey) {
      notification = await Notification.findOneAndUpdate(
        { dedupKey },
        { $setOnInsert: { message, type, meta, dedupKey } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      notification = await Notification.create({ message, type, meta });
    }
    reply.code(201).send(notification);
  } catch (err) {
    reply.code(500).send({ error: 'Failed to create notification' });
  }
};

// Delete a notification by ID
export const deleteNotification = async (request, reply) => {
  try {
    const { id } = request.params;
    await Notification.findByIdAndDelete(id);
    reply.send({ success: true });
  } catch (err) {
    reply.code(500).send({ error: 'Failed to delete notification' });
  }
};
