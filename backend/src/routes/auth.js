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
  fastify.post('/api/auth/register', register);
  fastify.post('/api/auth/login', login);

  // Protected routes (authentication required)
  fastify.get('/api/auth/profile', { preHandler: [authenticateToken] }, getProfile);
  fastify.put('/api/auth/profile', { preHandler: [authenticateToken] }, updateProfile);
  fastify.get('/api/auth/verify', { preHandler: [authenticateToken] }, verifyToken);

  console.log('✓ Auth routes registered');
};
