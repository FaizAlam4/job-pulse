import Notification from '../models/Notification.js';

// Get all notifications (most recent first)
export const getAllNotifications = async (request, reply) => {
  try {
    // Pagination params
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination
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
