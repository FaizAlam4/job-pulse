/**
 * API Constants
 * Centralized configuration for API endpoints
 */

// Base URL - uses environment variable or defaults to localhost
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
  JOBS: '/jobs',
  JOBS_TOP: '/jobs/top',
  JOBS_SEARCH: '/jobs/search',
  JOBS_STATS: '/jobs/stats',
  JOB_DETAIL: (id: string) => `/jobs/${id}`,
  INFO: '/info',
  HEALTH: '/health',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Filter options
export const FILTER_OPTIONS = {
  COUNTRIES: ['USA', 'UK', 'India', 'Germany', 'Canada', 'Australia'],
  TIME_PERIODS: [
    { label: 'Last 24 hours', value: 24 },
    { label: 'Last 3 days', value: 72 },
    { label: 'Last week', value: 168 },
    { label: 'Last month', value: 720 },
  ],
  SORT_OPTIONS: [
    { label: 'Score (High to Low)', value: 'score', order: 'desc' },
    { label: 'Posted Date (Newest)', value: 'postedAt', order: 'desc' },
    { label: 'Company (A-Z)', value: 'company', order: 'asc' },
  ],
} as const;
