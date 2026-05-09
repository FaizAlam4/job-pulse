import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectTestDB, closeTestDB, clearTestDB } from '../helpers.js';
import Job from '../../src/models/Job.js';

describe('Job model', () => {
  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });
  beforeEach(async () => { await clearTestDB(); });
  afterEach(async () => { await clearTestDB(); });

  it('creates a job with required fields', async () => {
    const job = await Job.create({
      title: 'Backend Developer',
      company: 'Acme Corp',
      location: 'New York, NY',
      postedAt: new Date('2024-01-15'),
      hash: 'unique-hash-1',
    });
    expect(job._id).toBeDefined();
    expect(job.title).toBe('Backend Developer');
    expect(job.isActive).toBe(true);
    expect(job.score).toBe(0);
  });

  it('auto-generates hash from title+company+location on save', async () => {
    const job = new Job({
      title: 'Frontend Dev',
      company: 'Startup Inc',
      location: 'Remote',
      postedAt: new Date(),
    });
    await job.save();
    expect(job.hash).toBeDefined();
    expect(job.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects duplicate hashes', async () => {
    await Job.create({
      title: 'Dev', company: 'Co', location: 'LA', postedAt: new Date(), hash: 'dup-hash',
    });
    // Ensure unique index is synced in memory server
    await Job.syncIndexes();
    await expect(
      Job.create({ title: 'Dev2', company: 'Co2', location: 'SF', postedAt: new Date(), hash: 'dup-hash' })
    ).rejects.toThrow();
  });

  it('validates source enum', async () => {
    const job = new Job({
      title: 'Dev', company: 'Co', location: 'LA', postedAt: new Date(), hash: 'enum-test',
      source: 'invalid-source',
    });
    await expect(job.save()).rejects.toThrow();
  });

  it('accepts valid source values', async () => {
    for (const source of ['google-jobs', 'remotive', 'manual']) {
      await clearTestDB();
      const job = await Job.create({
        title: 'Dev', company: 'Co', location: 'LA', postedAt: new Date(), hash: `src-${source}`, source,
      });
      expect(job.source).toBe(source);
    }
  });

  it('stores keywords array', async () => {
    const job = await Job.create({
      title: 'Dev', company: 'Co', location: 'LA', postedAt: new Date(), hash: 'kw-test',
      keywords: ['node', 'react', 'docker'],
    });
    expect(job.keywords).toHaveLength(3);
    expect(job.keywords).toContain('node');
  });

  it('defaults description to empty string', async () => {
    const job = await Job.create({
      title: 'Dev', company: 'Co', location: 'LA', postedAt: new Date(), hash: 'desc-test',
    });
    expect(job.description).toBe('');
  });
});
