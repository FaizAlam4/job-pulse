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
  fastify.get('/notifications', {
    schema: {
      tags: ['Notifications'],
      summary: 'List notifications with pagination',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1, minimum: 1 },
          limit: { type: 'integer', default: 20, minimum: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: 'Notification#' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
  }, getAllNotifications);

  // Create notification (for system use, not user-facing)
  fastify.post('/notifications', {
    schema: {
      tags: ['Notifications'],
      summary: 'Create a notification',
      description: 'System endpoint for creating notifications. Supports deduplication via dedupKey.',
      body: { $ref: 'CreateNotificationBody#' },
      response: {
        201: { $ref: 'Notification#' },
        400: { $ref: 'ErrorResponse#' },
      },
    },
  }, createNotification);

  // Delete notification by ID
  fastify.delete('/notifications/:id', {
    schema: {
      tags: ['Notifications'],
      summary: 'Delete a notification',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Notification ID' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
      },
    },
  }, deleteNotification);
};
