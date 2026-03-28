/**
 * Jobs Selectors
 * Memoized selectors for accessing jobs state
 */

import type { RootState } from '@/store';

// Base selector
export const selectJobsState = (state: RootState) => state.jobs;

// Jobs list
export const selectJobs = (state: RootState) => state.jobs.jobs;
export const selectAllJobs = (state: RootState) => state.jobs.jobs;
export const selectPagination = (state: RootState) => state.jobs.pagination;

// Single job
export const selectSelectedJob = (state: RootState) => state.jobs.selectedJob;
export const selectCurrentJob = (state: RootState) => state.jobs.selectedJob;
export const selectSimilarJobs = (state: RootState) => state.jobs.similarJobs;

// Top jobs
export const selectTopJobs = (state: RootState) => state.jobs.topJobs;

// Statistics
export const selectStats = (state: RootState) => state.jobs.stats;

// Search
export const selectSearchResults = (state: RootState) => state.jobs.searchResults;
export const selectSearchQuery = (state: RootState) => state.jobs.searchQuery;

// Filters
export const selectFilters = (state: RootState) => state.jobs.filters;

// Loading states
export const selectIsLoading = (state: RootState) => state.jobs.isLoading;
export const selectJobsLoading = (state: RootState) => state.jobs.isLoading;
export const selectIsLoadingDetail = (state: RootState) => state.jobs.isLoadingDetail;
export const selectJobDetailLoading = (state: RootState) => state.jobs.isLoadingDetail;
export const selectIsLoadingStats = (state: RootState) => state.jobs.isLoadingStats;
export const selectIsSearching = (state: RootState) => state.jobs.isSearching;

// Error
export const selectError = (state: RootState) => state.jobs.error;
export const selectJobsError = (state: RootState) => state.jobs.error;

// Computed selectors
export const selectJobCount = (state: RootState) => state.jobs.jobs.length;
export const selectTotalJobCount = (state: RootState) => {
	const pag = state.jobs.pagination;
	if (!pag) return 0;
	// Support both totalJobs and totalCount for backend compatibility
	return pag.totalJobs ?? pag.totalCount ?? 0;
};
export const selectHasNextPage = (state: RootState) => state.jobs.pagination?.hasNextPage ?? false;
export const selectHasPrevPage = (state: RootState) => state.jobs.pagination?.hasPrevPage ?? false;
export const selectCurrentPage = (state: RootState) => state.jobs.pagination?.currentPage ?? 1;
export const selectTotalPages = (state: RootState) => state.jobs.pagination?.totalPages ?? 1;
export const selectHasMore = (state: RootState) => state.jobs.pagination?.hasNextPage ?? false;
