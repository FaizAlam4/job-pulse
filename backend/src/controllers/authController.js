/**
 * Authentication Controller
 * Handles user registration, login, and token verification
 */

import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// JWT secret (should be in env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

/**
 * Register a new user
 */
export const register = async (request, reply) => {
  try {
    const { email, password, name } = request.body;

    // Validation
    if (!email || !password || !name) {
      return reply.code(400).send({
        success: false,
        message: 'All fields are required. Please provide name, email, and password.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.code(409).send({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.',
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return success with token and user data
    return reply.code(201).send({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return reply.code(500).send({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

/**
 * Login user
 */
export const login = async (request, reply) => {
  try {
    const { email, password } = request.body;

    // Validation
    if (!email || !password) {
      return reply.code(400).send({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user (include password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid email or password. Please check your credentials and try again.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return reply.code(403).send({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return reply.code(401).send({
        success: false,
        message: 'Invalid email or password. Please check your credentials and try again.',
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return success with token and user data
    return reply.send({
      success: true,
      message: 'Login successful',
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return reply.code(500).send({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (request, reply) => {
  try {
    const userId = request.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return reply.code(404).send({
        success: false,
        message: 'User not found',
      });
    }

    return reply.send({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (request, reply) => {
  try {
    const userId = request.user.userId;
    const updates = request.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.email;
    delete updates.password;
    delete updates._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return reply.code(404).send({
        success: false,
        message: 'User not found',
      });
    }

    return reply.send({
      success: true,
      message: 'Profile updated successfully',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = async (request, reply) => {
  try {
    // Token is already verified by middleware
    // Just return user data
    const userId = request.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return reply.code(404).send({
        success: false,
        message: 'User not found',
      });
    }

    return reply.send({
      success: true,
      valid: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Verify token error:', error);
    return reply.code(500).send({
      success: false,
      message: 'Token verification failed',
      error: error.message,
    });
  }
};
