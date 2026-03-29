/**
 * Job Types & Interfaces
 * Defines the shape of job-related data structures
 */

// Core Job interface matching backend model
export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  source: string;
  externalId: string;
  sourceUrl?: string;
  applyLink?: string;
  score: number;
  freshnessScore: number;
  relevanceScore: number;
  postedAt: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  isActive: boolean;
  hash: string;
  keywords?: string[];
  fetchedAt?: string;
  // Remote work indicator
  remote?: boolean;
  jobType?: string;
  // Optional metadata from Google Jobs
  salary?: string | null;
  scheduleType?: string | null;
  workFromHome?: boolean;
  healthInsurance?: boolean;
  dentalCoverage?: boolean;
  paidTimeOff?: boolean;
}

// Pagination metadata
export interface PaginationMeta {
  totalJobs: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// API response for job list
export interface JobsResponse {
  success: boolean;
  data: Job[];
  pagination: PaginationMeta;
  filters?: Record<string, string>;
}

// Similar job (partial job data)
export interface SimilarJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  postedAt: string;
  score: number;
}

// API response for single job with similar jobs
export interface JobDetailResponse {
  success: boolean;
  data: {
    job: Job;
    similarJobs: SimilarJob[];
  };
}

// API response for top jobs
export interface TopJobsResponse {
  success: boolean;
  count: number;
  data: Job[];
}

// Job statistics - matches actual API response
export interface JobStats {
  overall: {
    _id: null;
    totalJobs: number;
    avgScore: number;
    newestJob: string;
    oldestJob: string;
  };
  bySource: { _id: string; count: number }[];
  topLocations: { _id: string; count: number }[];
  topSkills?: { _id: string; count: number }[];
}

// API response for stats
export interface JobStatsResponse {
  success: boolean;
  data: JobStats;
}

// Filter parameters for API calls
export interface JobFilters {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  remote?: boolean;
  skills?: string;
  postedWithinHours?: number;
  sortBy?: 'score' | 'postedAt' | 'company';
  order?: 'asc' | 'desc';
}

// Search parameters
export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
}
