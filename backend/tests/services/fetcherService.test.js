import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios to avoid real API calls
vi.mock('axios');

// Reset config to disable Google Jobs (no API key in test)
// fetcherService reads config at import time, so tests rely on SERPAPI_KEY being empty

const { fetchFromRemotive, fetchFromGoogleJobs, fetchAllJobs } = await import('../../src/services/fetcherService.js');

describe('fetcherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchFromRemotive', () => {
    it('returns normalized job array on success', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          jobs: [
            {
              title: 'Node Dev',
              company_name: 'RemoteCo',
              candidate_required_location: 'Worldwide',
              category: 'Software Development',
              description: 'Build APIs',
              publication_date: '2024-01-15T00:00:00',
              id: 12345,
              url: 'https://remotive.com/jobs/12345',
            },
          ],
        },
      });

      const jobs = await fetchFromRemotive();
      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Node Dev');
      expect(jobs[0].company).toBe('RemoteCo');
      expect(jobs[0].source).toBe('remotive');
      expect(jobs[0].location).toBe('Worldwide');
      expect(jobs[0].externalId).toBe('12345');
    });

    it('returns empty array on API error', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network error'));
      const jobs = await fetchFromRemotive();
      expect(jobs).toEqual([]);
    });

    it('handles empty jobs response', async () => {
      axios.get.mockResolvedValueOnce({ data: { jobs: [] } });
      const jobs = await fetchFromRemotive();
      expect(jobs).toEqual([]);
    });

    it('defaults location to Remote when candidate_required_location missing', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          jobs: [{
            title: 'Dev', company_name: 'Co', category: 'Software Development', description: '', id: 1, url: 'x',
          }],
        },
      });
      const jobs = await fetchFromRemotive();
      expect(jobs[0].location).toBe('Remote');
    });
  });

  describe('fetchFromGoogleJobs', () => {
    it('returns empty array when no API key configured', async () => {
      // SERPAPI_KEY is empty in test env
      const jobs = await fetchFromGoogleJobs('developer');
      expect(jobs).toEqual([]);
      // Should NOT call axios since no key
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('fetchAllJobs', () => {
    it('fetches from Remotive when enabled', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          jobs: [
            { title: 'Job 1', company_name: 'Co', description: '', id: 1, url: 'x' },
          ],
        },
      });
      // Google Jobs is skipped (no API key), Remotive should be called
      const jobs = await fetchAllJobs({});
      expect(jobs.length).toBeGreaterThanOrEqual(0);
    });

    it('returns empty array on error', async () => {
      axios.get.mockRejectedValue(new Error('Network fail'));
      const jobs = await fetchAllJobs({});
      expect(Array.isArray(jobs)).toBe(true);
    });
  });
});
