/**
 * Authentication Routes
 * /api/auth endpoints
 */

import {
  register,
  login,
  getProfile,
  updateProfile,
  verifyToken,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

export const registerAuthRoutes = (fastify) => {
  // Public routes (no authentication required)
  fastify.post('/api/auth/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      body: { $ref: 'RegisterBody#' },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string' },
            user: { $ref: 'UserPublic#' },
          },
        },
        400: { $ref: 'ErrorResponse#' },
        409: { $ref: 'ErrorResponse#' },
      },
    },
  }, register);

  fastify.post('/api/auth/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login with email and password',
      body: { $ref: 'LoginBody#' },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            token: { type: 'string' },
            user: { $ref: 'UserPublic#' },
          },
        },
        400: { $ref: 'ErrorResponse#' },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, login);

  // Protected routes (authentication required)
  fastify.get('/api/auth/profile', {
    preHandler: [authenticateToken],
    schema: {
      tags: ['Auth'],
      summary: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { $ref: 'UserPublic#' },
          },
        },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, getProfile);

  fastify.put('/api/auth/profile', {
    preHandler: [authenticateToken],
    schema: {
      tags: ['Auth'],
      summary: 'Update user profile',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          profileType: { type: 'string', enum: ['job-seeker', 'recruiter'] },
          skills: { type: 'array', items: { type: 'string' } },
          experience: { type: 'number' },
          location: { type: 'string' },
          bio: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            user: { $ref: 'UserPublic#' },
          },
        },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, updateProfile);

  fastify.get('/api/auth/verify', {
    preHandler: [authenticateToken],
    schema: {
      tags: ['Auth'],
      summary: 'Verify JWT token validity',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            valid: { type: 'boolean' },
            user: { $ref: 'UserPublic#' },
          },
        },
      },
    },
  }, verifyToken);

  console.log('✓ Auth routes registered');
};
