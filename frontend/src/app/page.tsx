/**
 * Home Page - Jobs Listing
 * Main page for browsing and filtering jobs
 */

'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/modules/common/hooks/useRedux';
import { fetchJobsRequest, setPage } from '@/modules/jobs/store/jobsSlice';
import {
  selectAllJobs,
  selectJobsLoading,
  selectJobsError,
  selectCurrentPage,
  selectTotalPages,
  selectHasMore,
  selectTotalJobCount,
} from '@/modules/jobs/store/jobsSelectors';
import { selectActiveFilters } from '@/modules/filters/store/filtersSelectors';
import { JobList } from '@/modules/jobs/components/JobList';
import { FilterBar } from '@/modules/filters/components/FilterBar';
import { SearchBar } from '@/modules/common/components/SearchBar';
import { setSearchQuery } from '@/modules/filters/store/filtersSlice';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(selectAllJobs);
  const loading = useAppSelector(selectJobsLoading);
  const error = useAppSelector(selectJobsError);
  const currentPage = useAppSelector(selectCurrentPage);
  const totalPages = useAppSelector(selectTotalPages);
  const hasMore = useAppSelector(selectHasMore);
  const totalJobs = useAppSelector(selectTotalJobCount);
  const filters = useAppSelector(selectActiveFilters);
  const hasFetched = useRef(false);

  // Fetch jobs only on initial mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchJobsRequest({ page: 1, limit: 20, sortBy: 'score', order: 'desc' }));
    }
  }, [dispatch]);

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  // Handle filter apply - explicitly fetch with current filters
  const handleApplyFilters = useCallback(() => {
    dispatch(fetchJobsRequest({ ...filters, page: 1, limit: 20 }));
  }, [dispatch, filters]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    dispatch(setPage(nextPage));
    dispatch(fetchJobsRequest({ ...filters, page: nextPage, limit: 20 }));
  }, [dispatch, currentPage, filters]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Next Career Move
            </h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Discover opportunities matched to your skills with our intelligent job scoring algorithm
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 -mt-16">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center border border-gray-100">
            <p className="text-3xl font-bold text-blue-600">{totalJobs || jobs.length}</p>
            <p className="text-sm text-gray-500">Total Jobs</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center border border-gray-100">
            <p className="text-3xl font-bold text-emerald-600">{jobs.length}</p>
            <p className="text-sm text-gray-500">Showing</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center border border-gray-100">
            <p className="text-3xl font-bold text-purple-600">{currentPage}</p>
            <p className="text-sm text-gray-500">Current Page</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center border border-gray-100">
            <p className="text-3xl font-bold text-amber-600">{totalPages}</p>
            <p className="text-sm text-gray-500">Total Pages</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <FilterBar onApplyFilters={handleApplyFilters} />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Job Listings
          </h2>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `Sorted by score`}
          </p>
        </div>

        {/* Job List */}
        <JobList
          jobs={jobs}
          isLoading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}
