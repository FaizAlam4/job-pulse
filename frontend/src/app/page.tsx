/**
 * Home Page - Jobs Listing
 * Main page for browsing and filtering jobs
 */

'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/modules/common/hooks/useRedux';
import { fetchJobsRequest, setPage } from '@/modules/jobs/store/jobsSlice';
import {
  selectAllJobs,
  selectHasFetchedJobs,
  selectJobsLoading,
  selectJobsError,
  selectCurrentPage,
  selectTotalPages,
  selectHasMore,
  selectTotalJobCount,
  selectShouldShowJobsSkeleton,
} from '@/modules/jobs/store/jobsSelectors';
import { selectActiveFilters, selectActiveFilterCount, selectSearchQuery } from '@/modules/filters/store/filtersSelectors';
import { JobList } from '@/modules/jobs/components/JobList';
import { FilterBar } from '@/modules/filters/components/FilterBar';
import { SearchBar } from '@/modules/common/components/SearchBar';
import { setSearchQuery } from '@/modules/filters/store/filtersSlice';
import { useStore } from 'react-redux';
import { RootState } from '@/store';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const jobs = useAppSelector(selectAllJobs);
  const loading = useAppSelector(selectJobsLoading);
  const showSkeleton = useAppSelector(selectShouldShowJobsSkeleton);
  const hasFetchedJobs = useAppSelector(selectHasFetchedJobs);
  const error = useAppSelector(selectJobsError);
  const currentPage = useAppSelector(selectCurrentPage);
  const totalPages = useAppSelector(selectTotalPages);
  const totalJobs = useAppSelector(selectTotalJobCount);
  const pageSize = 10;
  const filters = useAppSelector(selectActiveFilters);
  const activeFilterCount = useAppSelector(selectActiveFilterCount);
  const searchQuery = useAppSelector(selectSearchQuery);

  // Fetch jobs on mount/navigation with current filters
  // Always fetch to ensure data matches current filter state
  useEffect(() => {
    const existingFilters = selectActiveFilters(store.getState());
    dispatch(fetchJobsRequest({ ...existingFilters, page: 1, limit: pageSize }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - runs once on mount/navigation

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
      // Always fetch jobs with new search query (debounced)
      const freshFilters = selectActiveFilters(store.getState());
      dispatch(fetchJobsRequest({ ...freshFilters, search: query, page: 1, limit: pageSize }));
    },
    [dispatch, store, pageSize]
  );

  // Handle filter apply - read fresh filters from store to avoid stale closure
  const handleApplyFilters = useCallback(() => {
    const freshFilters = selectActiveFilters(store.getState());
    dispatch(fetchJobsRequest({ ...freshFilters, page: 1, limit: pageSize }));
  }, [dispatch, store, pageSize]);

  const handleRetryJobs = useCallback(() => {
    const freshFilters = selectActiveFilters(store.getState());
    dispatch(fetchJobsRequest({ ...freshFilters, page: currentPage, limit: pageSize }));
  }, [currentPage, dispatch, store, pageSize]);


  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    const freshFilters = selectActiveFilters(store.getState());
    dispatch(setPage(page));
    dispatch(fetchJobsRequest({ ...freshFilters, page, limit: pageSize }));
  }, [dispatch, store, totalPages]);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const heroVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Compact Hero Section with Animation */}
      <motion.div
        className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-[#1e293b] dark:via-[#243056] dark:to-[#312e81] text-white relative overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 20, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -20, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <div className="text-center">
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Find Your Next Career Move{' '}
              <motion.span
                className="inline-block"
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                🚀
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-blue-100 dark:text-slate-300 text-sm md:text-base max-w-2xl mx-auto mb-4 sm:mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Discover opportunities matched to your skills
            </motion.p>
            
            {/* Search Bar */}
            <motion.div
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <SearchBar onSearch={handleSearch} initialValue={searchQuery} />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* AI Feature Banner */}
      <div className="relative bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 dark:from-[#0d0b1a] dark:via-[#120d2e] dark:to-[#0d0b1a] border-b border-orange-400/30 dark:border-violet-900/40 overflow-hidden">
        {/* Diagonal shine sweep — light mode only */}
        <div className="pointer-events-none absolute inset-0 dark:hidden">
          <div className="absolute -left-10 top-0 h-full w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] translate-x-8" />
          <div className="absolute right-1/4 top-0 h-full w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]" />
        </div>
        {/* Dark mode glows */}
        <div className="pointer-events-none absolute inset-0 hidden dark:block">
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 h-16 w-72 rounded-full bg-violet-700/20 blur-2xl" />
          <div className="absolute right-1/3 top-1/2 -translate-y-1/2 h-16 w-48 rounded-full bg-purple-600/15 blur-2xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          {/* Mobile: single row — title + CTA */}
          <div className="flex items-center justify-between gap-3 sm:hidden">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex shrink-0 items-center bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase border border-white/40 backdrop-blur-sm">
                New
              </span>
              <span className="font-semibold text-white text-sm truncate drop-shadow">🤖 AI Resume Analyzer</span>
            </div>
            <a
              href="/resume-analyzer"
              className="shrink-0 inline-flex items-center bg-white/95 text-orange-600 font-bold text-xs px-3 py-1.5 rounded-full hover:bg-white transition-all shadow-lg shadow-black/20 dark:bg-gradient-to-r dark:from-violet-600 dark:to-purple-600 dark:text-white dark:font-semibold dark:hover:from-violet-500 dark:hover:to-purple-500 dark:shadow-violet-500/25 whitespace-nowrap"
            >
              Try free →
            </a>
          </div>

          {/* Tablet+: all features + CTA */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
              <span className="flex items-center gap-2 mr-2">
                <span className="inline-flex items-center bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase border border-white/40 backdrop-blur-sm">
                  New
                </span>
                <span className="font-bold text-white drop-shadow">🤖 AI Resume Analyzer</span>
              </span>
              <span className="flex items-center gap-2 text-white/85 dark:text-slate-400">
                <span className="text-white/40 dark:text-slate-700">·</span> 📊 ATS Score &amp; Skill Gap Analysis
              </span>
              <span className="flex items-center gap-2 text-white/85 dark:text-slate-400">
                <span className="text-white/40 dark:text-slate-700">·</span> 🎯 Matched to Jobs on JobPulse
              </span>
              <span className="hidden md:flex items-center gap-2 text-white/85 dark:text-slate-400">
                <span className="text-white/40 dark:text-slate-700">·</span> 📈 Personalized Insights &amp; Tracker
              </span>
            </div>
            <a
              href="/resume-analyzer"
              className="shrink-0 inline-flex items-center gap-1.5 bg-white/95 text-orange-600 font-bold text-sm px-4 py-1.5 rounded-full hover:bg-white transition-all shadow-lg shadow-black/20 dark:bg-gradient-to-r dark:from-violet-600 dark:to-purple-600 dark:text-white dark:font-semibold dark:hover:from-violet-500 dark:hover:to-purple-500 dark:shadow-violet-500/25 whitespace-nowrap"
            >
              Try it free →
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Filter Section */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 mb-6 -mt-8 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 text-xs sm:text-sm font-medium">
                <span className="font-semibold">{totalJobs}</span>
                jobs
              </span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs sm:text-sm font-medium">
                  <span className="font-semibold">{activeFilterCount}</span>
                  active filters
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          {/* Filters Row */}
          <motion.div
            className="p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <FilterBar onApplyFilters={handleApplyFilters} />
          </motion.div>
        </motion.div>

        {/* Error State with Animation */}
        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.div
                className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={handleRetryJobs}
              className="self-start sm:self-auto px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Results Header with Animation */}
        <motion.div
          className="flex justify-between items-center mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <motion.svg
              className="w-5 h-5 text-blue-500 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </motion.svg>
            Job Listings
          </h2>
          <motion.p
            className="text-sm text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            {showSkeleton ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Loading...
              </motion.span>
            ) : (
              `Sorted by score`
            )}
          </motion.p>
        </motion.div>

        {/* Job List */}
        <JobList
          jobs={jobs}
          isLoading={showSkeleton}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
