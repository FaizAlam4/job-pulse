/**
 * Jobs Service
 * API calls for job-related operations
 */

import apiClient from '@/services/apiClient';
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
 */
export const getJobs = async (filters: JobFilters = {}): Promise<JobsResponse> => {
  // Build query params, removing undefined values
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  );

  const response = await apiClient.get<JobsResponse>(API_ENDPOINTS.JOBS, { params });
  return response.data;
};

/**
 * Fetch top-ranked jobs
 */
export const getTopJobs = async (limit: number = 10): Promise<TopJobsResponse> => {
  const response = await apiClient.get<TopJobsResponse>(API_ENDPOINTS.JOBS_TOP, {
    params: { limit },
  });
  return response.data;
};

/**
 * Search jobs by keyword
 */
export const searchJobs = async (params: SearchParams): Promise<JobsResponse> => {
  const response = await apiClient.get<JobsResponse>(API_ENDPOINTS.JOBS_SEARCH, {
    params,
  });
  return response.data;
};

/**
 * Get single job by ID with similar jobs
 */
export const getJobById = async (id: string): Promise<JobDetailResponse> => {
  const response = await apiClient.get<JobDetailResponse>(API_ENDPOINTS.JOB_DETAIL(id));
  return response.data;
};

/**
 * Get job statistics
 */
export const getJobStats = async (): Promise<JobStatsResponse> => {
  const response = await apiClient.get<JobStatsResponse>(API_ENDPOINTS.JOBS_STATS);
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
