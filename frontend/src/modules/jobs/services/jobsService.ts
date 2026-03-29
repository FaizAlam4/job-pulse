/**
 * Jobs Service
 * API calls for job-related operations
 * Uses smartGet for optimal offline experience
 */

import apiClient, { smartGet } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/constants/api';
import {
  JobsResponse,
  JobDetailResponse,
  TopJobsResponse,
  JobStatsResponse,
  JobFilters,
  SearchParams,
} from '../types';

/**
 * Fetch jobs with optional filters
 * Uses smartGet for instant offline response
 */
export const getJobs = async (filters: JobFilters = {}): Promise<JobsResponse> => {
  // Build query params, removing undefined values
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  );

  // Build URL with params for cache key
  const queryString = new URLSearchParams(params as Record<string, string>).toString();
  const url = queryString ? `${API_ENDPOINTS.JOBS}?${queryString}` : API_ENDPOINTS.JOBS;
  
  const response = await smartGet<JobsResponse>(url);
  return response.data;
};

/**
 * Fetch top-ranked jobs
 * Uses smartGet for instant offline response
 */
export const getTopJobs = async (limit: number = 10): Promise<TopJobsResponse> => {
  const url = `${API_ENDPOINTS.JOBS_TOP}?limit=${limit}`;
  const response = await smartGet<TopJobsResponse>(url);
  return response.data;
};

/**
 * Search jobs by keyword
 */
export const searchJobs = async (params: SearchParams): Promise<JobsResponse> => {
  const searchParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  );
  const queryString = new URLSearchParams(searchParams as Record<string, string>).toString();
  const url = `${API_ENDPOINTS.JOBS_SEARCH}?${queryString}`;
  const response = await smartGet<JobsResponse>(url);
  return response.data;
};

/**
 * Get single job by ID with similar jobs
 * Uses smartGet for instant offline response
 */
export const getJobById = async (id: string): Promise<JobDetailResponse> => {
  const url = API_ENDPOINTS.JOB_DETAIL(id);
  const response = await smartGet<JobDetailResponse>(url);
  return response.data;
};

/**
 * Get job statistics
 * Uses smartGet for instant offline response
 */
export const getJobStats = async (): Promise<JobStatsResponse> => {
  const response = await smartGet<JobStatsResponse>(API_ENDPOINTS.JOBS_STATS);
  return response.data;
};

// Export all services
const jobsService = {
  getJobs,
  getTopJobs,
  searchJobs,
  getJobById,
  getJobStats,
};

export default jobsService;
