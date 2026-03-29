import {
  getAllNotifications,
  createNotification,
  deleteNotification,
} from '../controllers/notificationController.js';

/**
 * Register notification routes
 * @param {FastifyInstance} fastify
 */
export const registerNotificationRoutes = async (fastify) => {
  // Get all notifications
  fastify.get('/notifications', getAllNotifications);

  // Create notification (for system use, not user-facing)
  fastify.post('/notifications', createNotification);

  // Delete notification by ID
  fastify.delete('/notifications/:id', deleteNotification);
};
