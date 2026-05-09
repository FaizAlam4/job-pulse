import {
  getAllNotifications,
  getUnreadCount,
  markAllRead,
  createNotification,
  deleteNotification,
} from '../controllers/notificationController.js';
import { addClient, removeClient } from '../services/sseService.js';

/**
 * Register notification routes
 * @param {FastifyInstance} fastify
 */
export const registerNotificationRoutes = async (fastify) => {
  /**
   * SSE endpoint — browsers connect here to receive live push events.
   * No auth required: all DB notifications are global (no userId).
   * Events emitted:
   *   connected  — on open
   *   new-jobs   — after ingestion pipeline saves new jobs
   *   (comment lines starting with `:` are keepalive pings)
   */
  fastify.get('/events', {
    schema: { hide: true }, // exclude from Swagger
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const raw = reply.raw;

    // Must set CORS manually — @fastify/cors injects via onSend hook which
    // never fires because we stream via reply.raw and never call reply.send()
    const origin = request.headers.origin;
    if (origin) {
      raw.setHeader('Access-Control-Allow-Origin', origin);
      raw.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    raw.setHeader('Content-Type', 'text/event-stream');
    raw.setHeader('Cache-Control', 'no-cache');
    raw.setHeader('Connection', 'keep-alive');
    raw.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
    raw.flushHeaders();

    addClient(reply);

    // Confirm connection to the browser
    raw.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to Job Pulse events' })}\n\n`);

    // Keepalive comment every 25s (browsers time out SSE after ~30s of silence)
    const ping = setInterval(() => {
      try { raw.write(': ping\n\n'); } catch (_) { clearInterval(ping); }
    }, 25000);

    // Clean up when browser closes the tab / navigates away
    request.raw.on('close', () => {
      clearInterval(ping);
      removeClient(reply);
    });

    // Keep the handler alive — Fastify must not send a response
    await new Promise(() => {});
  });


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
          properties: { success: { type: 'boolean' } },
        },
      },
    },
  }, deleteNotification);

  // Get unread notification count
  fastify.get('/notifications/unread-count', {
    schema: {
      tags: ['Notifications'],
      summary: 'Get count of unread notifications',
      response: {
        200: {
          type: 'object',
          properties: { count: { type: 'integer' } },
        },
      },
    },
  }, getUnreadCount);

  // Mark all notifications as read
  fastify.patch('/notifications/mark-all-read', {
    schema: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      response: {
        200: {
          type: 'object',
          properties: { success: { type: 'boolean' } },
        },
      },
    },
  }, markAllRead);
};
