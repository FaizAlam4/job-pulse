/**
 * Jobs Slice
 * Redux Toolkit slice for jobs state management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Job, JobFilters, PaginationMeta, JobStats, SimilarJob } from '../types';

// State interface
interface JobsState {
  // Jobs list
  jobs: Job[];
  pagination: PaginationMeta | null;
  
  // Single job detail
  selectedJob: Job | null;
  similarJobs: SimilarJob[];
  
  // Top jobs
  topJobs: Job[];
  
  // Statistics
  stats: JobStats | null;
  
  // Search
  searchResults: Job[];
  searchQuery: string;
  
  // Active filters
  filters: JobFilters;
  
  // Loading states
  isLoading: boolean;
  isLoadingDetail: boolean;
  isLoadingStats: boolean;
  isSearching: boolean;
  
  // Error states
  error: string | null;
}

// Initial state
const initialState: JobsState = {
  jobs: [],
  pagination: null,
  selectedJob: null,
  similarJobs: [],
  topJobs: [],
  stats: null,
  searchResults: [],
  searchQuery: '',
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'score',
    order: 'desc',
  },
  isLoading: false,
  isLoadingDetail: false,
  isLoadingStats: false,
  isSearching: false,
  error: null,
};

// Create slice
const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    // Fetch jobs
    fetchJobsRequest: (state, action: PayloadAction<JobFilters | undefined>) => {
      state.isLoading = true;
      state.error = null;
      if (action.payload) {
        state.filters = { ...state.filters, ...action.payload };
      }
    },
    fetchJobsSuccess: (state, action: PayloadAction<{ jobs: Job[]; pagination: PaginationMeta }>) => {
      state.isLoading = false;
      state.jobs = action.payload.jobs;
      state.pagination = action.payload.pagination;
    },
    fetchJobsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Fetch job detail
    fetchJobDetailRequest: (state, _action: PayloadAction<string>) => {
      state.isLoadingDetail = true;
      state.error = null;
    },
    fetchJobDetailSuccess: (state, action: PayloadAction<{ job: Job; similarJobs: SimilarJob[] }>) => {
      state.isLoadingDetail = false;
      state.selectedJob = action.payload.job;
      state.similarJobs = action.payload.similarJobs;
    },
    fetchJobDetailFailure: (state, action: PayloadAction<string>) => {
      state.isLoadingDetail = false;
      state.error = action.payload;
    },

    // Fetch top jobs
    fetchTopJobsRequest: (state, _action: PayloadAction<number | undefined>) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchTopJobsSuccess: (state, action: PayloadAction<Job[]>) => {
      state.isLoading = false;
      state.topJobs = action.payload;
    },
    fetchTopJobsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Fetch stats
    fetchStatsRequest: (state) => {
      state.isLoadingStats = true;
    },
    fetchStatsSuccess: (state, action: PayloadAction<JobStats>) => {
      state.isLoadingStats = false;
      state.stats = action.payload;
    },
    fetchStatsFailure: (state, action: PayloadAction<string>) => {
      state.isLoadingStats = false;
      state.error = action.payload;
    },

    // Search jobs
    searchJobsRequest: (state, action: PayloadAction<{ q: string; page?: number; limit?: number }>) => {
      state.isSearching = true;
      state.searchQuery = action.payload.q;
      state.error = null;
    },
    searchJobsSuccess: (state, action: PayloadAction<{ jobs: Job[]; pagination: PaginationMeta }>) => {
      state.isSearching = false;
      state.searchResults = action.payload.jobs;
      state.pagination = action.payload.pagination;
    },
    searchJobsFailure: (state, action: PayloadAction<string>) => {
      state.isSearching = false;
      state.error = action.payload;
    },

    // Update filters
    setFilters: (state, action: PayloadAction<Partial<JobFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Set page
    setPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
    },

    // Clear states
    clearSelectedJob: (state) => {
      state.selectedJob = null;
      state.similarJobs = [];
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Export actions
export const {
  fetchJobsRequest,
  fetchJobsSuccess,
  fetchJobsFailure,
  fetchJobDetailRequest,
  fetchJobDetailSuccess,
  fetchJobDetailFailure,
  fetchTopJobsRequest,
  fetchTopJobsSuccess,
  fetchTopJobsFailure,
  fetchStatsRequest,
  fetchStatsSuccess,
  fetchStatsFailure,
  searchJobsRequest,
  searchJobsSuccess,
  searchJobsFailure,
  setFilters,
  resetFilters,
  setPage,
  clearSelectedJob,
  clearSearchResults,
  clearError,
} = jobsSlice.actions;

// Export reducer
export default jobsSlice.reducer;
