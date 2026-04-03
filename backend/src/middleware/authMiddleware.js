/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Middleware to verify JWT token
 * Extracts token from Authorization header and verifies it
 */
export const authenticateToken = async (request, reply) => {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return reply.code(401).send({
        success: false,
        message: 'No token provided',
      });
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid token format',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    request.user = decoded;
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return reply.code(401).send({
        success: false,
        message: 'Token expired',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return reply.code(401).send({
        success: false,
        message: 'Invalid token',
      });
    }
    
    return reply.code(500).send({
      success: false,
      message: 'Token verification failed',
      error: error.message,
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work for both authenticated and non-authenticated users
 */
export const optionalAuth = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      // No token, but that's okay
      request.user = null;
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      request.user = decoded;
    } else {
      request.user = null;
    }
  } catch (error) {
    // Token is invalid, but don't fail the request
    request.user = null;
  }
};
