/**
 * Test helpers — shared utilities for integration tests.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let mongoServer;

/**
 * Connect to an in-memory MongoDB instance.
 */
export async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

/**
 * Drop all collections and close the connection.
 */
export async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

/**
 * Clear all collections between tests.
 */
export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Generate a valid JWT for testing authenticated routes.
 */
export function generateTestToken(userId = '507f1f77bcf86cd799439011', email = 'test@example.com') {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}
