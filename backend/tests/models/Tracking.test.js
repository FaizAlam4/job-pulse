import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import Tracking from '../../src/models/Tracking.js';
import mongoose from 'mongoose';

const userId = new mongoose.Types.ObjectId();

describe('Tracking model', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  it('creates a tracking entry with required fields', async () => {
    const tracking = await Tracking.create({
      userId,
      jobSnapshot: { title: 'Dev', company: 'Acme', location: 'NYC' },
      status: 'saved',
    });
    expect(tracking._id).toBeDefined();
    expect(tracking.status).toBe('saved');
    expect(tracking.jobSnapshot.title).toBe('Dev');
  });

  it('defaults status to saved', async () => {
    const tracking = await Tracking.create({
      userId,
      jobSnapshot: { title: 'Dev', company: 'Acme', location: 'NYC' },
    });
    expect(tracking.status).toBe('saved');
  });

  it('defaults priority to 3', async () => {
    const tracking = await Tracking.create({
      userId,
      jobSnapshot: { title: 'Dev', company: 'Acme', location: 'NYC' },
    });
    expect(tracking.priority).toBe(3);
  });

  it('validates status enum', async () => {
    const tracking = new Tracking({
      userId,
      jobSnapshot: { title: 'Dev', company: 'Acme', location: 'NYC' },
      status: 'invalid-status',
    });
    await expect(tracking.save()).rejects.toThrow();
  });

  it('stores statusHistory', async () => {
    const tracking = await Tracking.create({
      userId,
      jobSnapshot: { title: 'Dev', company: 'Acme', location: 'NYC' },
      statusHistory: [
        { status: 'saved', date: new Date() },
        { status: 'applied', date: new Date() },
      ],
    });
    expect(tracking.statusHistory).toHaveLength(2);
  });

  it('stores interviews', async () => {
    const tracking = await Tracking.create({
      userId,
      jobSnapshot: { title: 'Dev', company: 'Acme', location: 'NYC' },
      interviews: [
        { date: new Date(), type: 'phone', notes: 'Initial screen' },
      ],
    });
    expect(tracking.interviews).toHaveLength(1);
    expect(tracking.interviews[0].type).toBe('phone');
  });

  it('stores contacts', async () => {
    const tracking = await Tracking.create({
      userId,
      jobSnapshot: { title: 'Dev', company: 'Acme', location: 'NYC' },
      contacts: [
        { name: 'Jane', role: 'Recruiter', email: 'jane@co.com' },
      ],
    });
    expect(tracking.contacts).toHaveLength(1);
    expect(tracking.contacts[0].name).toBe('Jane');
  });
});
