import { describe, it, expect } from 'vitest';
import { connectDB, disconnectDB } from '../../src/config/database.js';
import mongoose from 'mongoose';

describe('database config', () => {
  it('exports connectDB and disconnectDB functions', () => {
    expect(typeof connectDB).toBe('function');
    expect(typeof disconnectDB).toBe('function');
  });

  it('mongoose is importable and has connection', () => {
    expect(mongoose.connection).toBeDefined();
    expect(typeof mongoose.connect).toBe('function');
    expect(typeof mongoose.disconnect).toBe('function');
  });
});
