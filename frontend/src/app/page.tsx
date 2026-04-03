/**
 * Home Page - Jobs Listing
 * Main page for browsing and filtering jobs
 */

'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
  selectShouldShowJobsSkeleton,
} from '@/modules/jobs/store/jobsSelectors';
import { selectActiveFilters, selectActiveFilterCount } from '@/modules/filters/store/filtersSelectors';
import { JobList } from '@/modules/jobs/components/JobList';
import { FilterBar } from '@/modules/filters/components/FilterBar';
import { SearchBar } from '@/modules/common/components/SearchBar';
import { StatCardSkeleton } from '@/modules/common/components/Loader';
import { setSearchQuery } from '@/modules/filters/store/filtersSlice';
import { useStore } from 'react-redux';
import { RootState } from '@/store';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const jobs = useAppSelector(selectAllJobs);
  const loading = useAppSelector(selectJobsLoading);
  const showSkeleton = useAppSelector(selectShouldShowJobsSkeleton);
  const error = useAppSelector(selectJobsError);
  const currentPage = useAppSelector(selectCurrentPage);
  const totalPages = useAppSelector(selectTotalPages);
  const totalJobs = useAppSelector(selectTotalJobCount);
  const pageSize = 10;
  const filters = useAppSelector(selectActiveFilters);
  const activeFilterCount = useAppSelector(selectActiveFilterCount);
  const hasFetched = useRef(false);

  // Fetch jobs only on initial mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchJobsRequest({ page: 1, limit: pageSize, sortBy: 'score', order: 'desc' }));
    }
  }, [dispatch]);

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

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      },
    }),
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

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="text-center">
            <motion.h1
              className="text-3xl md:text-4xl font-bold mb-2"
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
              className="text-blue-100 dark:text-slate-300 text-sm md:text-base max-w-2xl mx-auto mb-6"
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
              <SearchBar onSearch={handleSearch} />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Integrated Stats + Filters Card with Animation */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 mb-6 -mt-8 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-slate-700">
            {showSkeleton ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <motion.div
                  className="text-center py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                  custom={0}
                  initial="hidden"
                  animate="visible"
                  variants={statsVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.p
                    className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  >
                    {totalJobs}
                  </motion.p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Total Jobs</p>
                </motion.div>
                <motion.div
                  className="text-center py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer group"
                  custom={1}
                  initial="hidden"
                  animate="visible"
                  variants={statsVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{jobs.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Showing</p>
                </motion.div>
                <motion.div
                  className="text-center py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors cursor-pointer group"
                  custom={2}
                  initial="hidden"
                  animate="visible"
                  variants={statsVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{currentPage}/{totalPages}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Page</p>
                </motion.div>
                <motion.div
                  className="text-center py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors cursor-pointer group"
                  custom={3}
                  initial="hidden"
                  animate="visible"
                  variants={statsVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.p
                    className="text-2xl font-bold text-amber-600 dark:text-amber-400"
                    animate={activeFilterCount > 0 ? { scale: [1, 1.2, 1] } : {}}
                    transition={activeFilterCount > 0 ? { duration: 0.5 } : {}}
                  >
                    {activeFilterCount}
                  </motion.p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Active Filters</p>
                </motion.div>
              </>
            )}
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
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
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
          </motion.div>
        )}

        {/* Results Header with Animation */}
        <motion.div
          className="flex justify-between items-center mb-6"
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
