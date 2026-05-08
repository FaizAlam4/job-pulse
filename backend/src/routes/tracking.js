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
  fastify.post('/', {
    schema: {
      tags: ['Tracking'],
      summary: 'Track a new job application',
      security: [{ bearerAuth: [] }],
      body: { $ref: 'TrackJobBody#' },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                trackingId: { type: 'string' },
                tracking: { $ref: 'Tracking#' },
              },
            },
          },
        },
        400: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, trackJob);

  // Get all tracked jobs
  fastify.get('/', {
    schema: {
      tags: ['Tracking'],
      summary: 'List tracked job applications',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['saved', 'applied', 'phone-screen', 'interview', 'offer', 'rejected'] },
          sortBy: { type: 'string', default: 'updatedAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          page: { type: 'integer', default: 1, minimum: 1 },
          limit: { type: 'integer', default: 1000, minimum: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            count: { type: 'integer' },
            data: { type: 'array', items: { $ref: 'Tracking#' } },
            pagination: { $ref: 'Pagination#' },
          },
        },
      },
    },
  }, getTrackedJobs);

  // Get analytics
  fastify.get('/analytics', {
    schema: {
      tags: ['Tracking'],
      summary: 'Get application tracking analytics',
      description: 'Returns status breakdown, response rates, conversion rates, and stage timing.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                byStatus: { type: 'object' },
                responseRate: { type: 'number' },
                interviewRate: { type: 'number' },
                offerRate: { type: 'number' },
                byCompany: { type: 'object' },
                byLocation: { type: 'object' },
                recentApplications: { type: 'integer' },
                avgStageTimes: { type: 'object' },
              },
            },
          },
        },
      },
    },
  }, getTrackingAnalytics);

  // Check if job is tracked
  fastify.get('/check/:jobId', {
    schema: {
      tags: ['Tracking'],
      summary: 'Check if a job is being tracked',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['jobId'],
        properties: {
          jobId: { type: 'string', description: 'MongoDB ObjectId of the job' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            isTracked: { type: 'boolean' },
            tracking: { oneOf: [{ $ref: 'Tracking#' }, { type: 'null' }] },
          },
        },
      },
    },
  }, checkJobTracking);

  // Get single tracked job
  fastify.get('/:trackingId', {
    schema: {
      tags: ['Tracking'],
      summary: 'Get a single tracked job',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['trackingId'],
        properties: {
          trackingId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { $ref: 'Tracking#' },
          },
        },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, getTrackedJob);

  // Update tracked job
  fastify.patch('/:trackingId', {
    schema: {
      tags: ['Tracking'],
      summary: 'Update a tracked job application',
      description: 'Update status, notes, priority, or other tracking fields. Status changes are recorded in history.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['trackingId'],
        properties: {
          trackingId: { type: 'string' },
        },
      },
      body: { $ref: 'UpdateTrackingBody#' },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { $ref: 'Tracking#' },
          },
        },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, updateTrackedJob);

  // Add interview
  fastify.post('/:trackingId/interviews', {
    schema: {
      tags: ['Tracking'],
      summary: 'Add an interview to a tracked job',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['trackingId'],
        properties: {
          trackingId: { type: 'string' },
        },
      },
      body: { $ref: 'AddInterviewBody#' },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { $ref: 'Tracking#' },
          },
        },
        400: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, addInterview);

  // Add contact
  fastify.post('/:trackingId/contacts', {
    schema: {
      tags: ['Tracking'],
      summary: 'Add a recruiter/contact to a tracked job',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['trackingId'],
        properties: {
          trackingId: { type: 'string' },
        },
      },
      body: { $ref: 'AddContactBody#' },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { $ref: 'Tracking#' },
          },
        },
        400: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, addContact);

  // Delete tracked job
  fastify.delete('/:trackingId', {
    schema: {
      tags: ['Tracking'],
      summary: 'Remove a job from tracking',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['trackingId'],
        properties: {
          trackingId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, deleteTrackedJob);
}
