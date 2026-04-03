/**
 * Tracking Routes
 * Routes for job application tracking
 */

import {
  trackJob,
  getTrackedJobs,
  getTrackedJob,
  updateTrackedJob,
  addInterview,
  addContact,
  deleteTrackedJob,
  getTrackingAnalytics,
  checkJobTracking,
} from '../controllers/trackingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

export default async function trackingRoutes(fastify, options) {
  // Add authentication to all routes in this plugin
  fastify.addHook('preHandler', authenticateToken);

  // Track a new job
  fastify.post('/', trackJob);

  // Get all tracked jobs
  fastify.get('/', getTrackedJobs);

  // Get analytics
  fastify.get('/analytics', getTrackingAnalytics);

  // Check if job is tracked
  fastify.get('/check/:jobId', checkJobTracking);

  // Get single tracked job
  fastify.get('/:trackingId', getTrackedJob);

  // Update tracked job
  fastify.patch('/:trackingId', updateTrackedJob);

  // Add interview
  fastify.post('/:trackingId/interviews', addInterview);

  // Add contact
  fastify.post('/:trackingId/contacts', addContact);

  // Delete tracked job
  fastify.delete('/:trackingId', deleteTrackedJob);
}
