import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import User from '../../src/models/User.js';

describe('User model', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  it('creates a user with required fields', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(user._id).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.isActive).toBe(true);
  });

  it('hashes password on save', async () => {
    const user = await User.create({
      name: 'Hash Test',
      email: 'hash@test.com',
      password: 'mypassword',
    });
    // Fetch with password selected
    const found = await User.findById(user._id).select('+password');
    expect(found.password).not.toBe('mypassword');
    expect(found.password.startsWith('$2')).toBe(true); // bcrypt prefix
  });

  it('comparePassword returns true for correct password', async () => {
    const user = await User.create({
      name: 'Compare Test',
      email: 'compare@test.com',
      password: 'secret123',
    });
    const found = await User.findById(user._id).select('+password');
    const isValid = await found.comparePassword('secret123');
    expect(isValid).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const user = await User.create({
      name: 'Wrong Pass',
      email: 'wrong@test.com',
      password: 'correctpass',
    });
    const found = await User.findById(user._id).select('+password');
    const isValid = await found.comparePassword('wrongpass');
    expect(isValid).toBe(false);
  });

  it('toPublicJSON excludes password', async () => {
    const user = await User.create({
      name: 'Public Test',
      email: 'public@test.com',
      password: 'secret',
    });
    const json = user.toPublicJSON();
    expect(json.password).toBeUndefined();
    expect(json.name).toBe('Public Test');
    expect(json.email).toBe('public@test.com');
  });

  it('rejects duplicate emails', async () => {
    await User.create({ name: 'A', email: 'dup@test.com', password: 'pass123' });
    await expect(
      User.create({ name: 'B', email: 'dup@test.com', password: 'pass456' })
    ).rejects.toThrow();
  });

  it('validates email format', async () => {
    const user = new User({ name: 'Bad', email: 'notanemail', password: 'pass123' });
    await expect(user.save()).rejects.toThrow();
  });

  it('requires minimum password length', async () => {
    const user = new User({ name: 'Short', email: 'short@test.com', password: '12345' });
    await expect(user.save()).rejects.toThrow();
  });

  it('lowercases email', async () => {
    const user = await User.create({ name: 'Case', email: 'UPPER@TEST.COM', password: 'pass123' });
    expect(user.email).toBe('upper@test.com');
  });

  it('defaults profileType to job-seeker', async () => {
    const user = await User.create({ name: 'Default', email: 'default@test.com', password: 'pass123' });
    expect(user.profileType).toBe('job-seeker');
  });
});
