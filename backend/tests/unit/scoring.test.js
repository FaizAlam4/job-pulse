import { describe, it, expect } from 'vitest';
import {
  generateJobHash,
  parseDate,
  calculateFreshnessScore,
  calculateRelevanceScore,
  calculateJobScore,
} from '../../src/utils/scoring.js';

describe('generateJobHash', () => {
  it('returns a SHA256 hex string', () => {
    const hash = generateJobHash('Engineer', 'Acme', 'NYC');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is case-insensitive', () => {
    const a = generateJobHash('Engineer', 'Acme', 'NYC');
    const b = generateJobHash('engineer', 'acme', 'nyc');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', () => {
    const a = generateJobHash('Engineer', 'Acme', 'NYC');
    const b = generateJobHash('Designer', 'Acme', 'NYC');
    expect(a).not.toBe(b);
  });

  it('is deterministic', () => {
    const a = generateJobHash('Dev', 'Co', 'LA');
    const b = generateJobHash('Dev', 'Co', 'LA');
    expect(a).toBe(b);
  });
});

describe('parseDate', () => {
  it('parses valid ISO strings', () => {
    const d = parseDate('2024-01-15T00:00:00Z');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(0); // January
  });

  it('returns current date for null/undefined', () => {
    const before = Date.now();
    const d = parseDate(null);
    expect(d.getTime()).toBeGreaterThanOrEqual(before);
    expect(d.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('returns current date for invalid strings', () => {
    const before = Date.now();
    const d = parseDate('not-a-date');
    expect(d.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('accepts Date objects', () => {
    const original = new Date('2023-06-01');
    const d = parseDate(original);
    expect(d.getTime()).toBe(original.getTime());
  });
});

describe('calculateFreshnessScore', () => {
  it('returns 1.0 for jobs posted now', () => {
    expect(calculateFreshnessScore(new Date())).toBe(1.0);
  });

  it('returns 1.0 for jobs posted 12 hours ago', () => {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    expect(calculateFreshnessScore(twelveHoursAgo)).toBe(1.0);
  });

  it('returns between 0.5 and 0.8 for jobs posted 3 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const score = calculateFreshnessScore(threeDaysAgo);
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThan(0.8);
  });

  it('returns low score for very old jobs', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const score = calculateFreshnessScore(sixtyDaysAgo);
    expect(score).toBeGreaterThanOrEqual(0.1);
    expect(score).toBeLessThan(0.5);
  });

  it('never goes below 0.1', () => {
    const veryOld = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    expect(calculateFreshnessScore(veryOld)).toBeGreaterThanOrEqual(0.1);
  });
});

describe('calculateRelevanceScore', () => {
  it('returns 0 for empty description', () => {
    const result = calculateRelevanceScore('', ['node', 'react']);
    expect(result.score).toBe(0);
    expect(result.matchedKeywords).toHaveLength(0);
  });

  it('returns 0 for empty keywords', () => {
    const result = calculateRelevanceScore('Some job description', []);
    expect(result.score).toBe(0);
  });

  it('matches keywords in description', () => {
    const result = calculateRelevanceScore(
      'We need a Node.js and React developer',
      ['node', 'react', 'python']
    );
    expect(result.matchedKeywords).toContain('node');
    expect(result.matchedKeywords).toContain('react');
    expect(result.matchedKeywords).not.toContain('python');
    expect(result.score).toBeCloseTo(2 / 3);
  });

  it('is case-insensitive', () => {
    const result = calculateRelevanceScore('DOCKER and KUBERNETES', ['docker', 'kubernetes']);
    expect(result.score).toBe(1);
  });

  it('matches whole words only', () => {
    const result = calculateRelevanceScore('javanese temple', ['java']);
    // 'java' should NOT match 'javanese' since it uses \\b word boundary
    expect(result.matchedKeywords).not.toContain('java');
  });

  it('caps score at 1', () => {
    const result = calculateRelevanceScore('node react python', ['node']);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});

describe('calculateJobScore', () => {
  it('combines freshness and relevance', () => {
    const job = {
      postedAt: new Date(), // fresh
      description: 'Node.js developer with React',
    };
    const result = calculateJobScore(job, ['node', 'react'], 0.6, 0.4);
    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.totalScore).toBeLessThanOrEqual(1);
    expect(result.freshnessScore).toBe(1.0);
    expect(result.relevanceScore).toBe(1.0);
    expect(result.matchedKeywords).toContain('node');
    expect(result.matchedKeywords).toContain('react');
  });

  it('returns only freshness when no keywords match', () => {
    const job = {
      postedAt: new Date(),
      description: 'Marketing manager position',
    };
    const result = calculateJobScore(job, ['node', 'react'], 0.6, 0.4);
    expect(result.totalScore).toBeCloseTo(0.6); // only recency contribution
    expect(result.relevanceScore).toBe(0);
  });

  it('clamps score between 0 and 1', () => {
    const job = { postedAt: new Date(), description: 'node react' };
    const result = calculateJobScore(job, ['node', 'react'], 1.0, 1.0);
    expect(result.totalScore).toBeLessThanOrEqual(1);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
  });

  it('uses default weights when not provided', () => {
    const job = { postedAt: new Date(), description: 'node developer' };
    const result = calculateJobScore(job, ['node']);
    expect(result.totalScore).toBeGreaterThan(0);
  });
});
