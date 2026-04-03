/**
 * FilterBar Component
 * Job filters and search interface
 */

'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/modules/common/hooks/useRedux';
import {
  setCountry,
  setRemote,
  setPostedWithinHours,
  setSort,
  resetFilters,
} from '@/modules/filters/store';
import {
  selectCountry,
  selectRemote,
  selectPostedWithinHours,
  selectSortBy,
  selectOrder,
  selectHasActiveFilters,
  selectActiveFilterCount,
} from '@/modules/filters/store/filtersSelectors';
import { FILTER_OPTIONS } from '@/constants/api';

interface FilterBarProps {
  onApplyFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onApplyFilters }) => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const country = useAppSelector(selectCountry);
  const remote = useAppSelector(selectRemote);
  const postedWithinHours = useAppSelector(selectPostedWithinHours);
  const sortBy = useAppSelector(selectSortBy);
  const order = useAppSelector(selectOrder);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const filterCount = useAppSelector(selectActiveFilterCount);

  // Handlers
  const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCountry(e.target.value));
    setTimeout(() => onApplyFilters(), 0);
  }, [dispatch, onApplyFilters]);

  const handleRemoteToggle = useCallback(() => {
    dispatch(setRemote(!remote));
    setTimeout(() => onApplyFilters(), 0);
  }, [dispatch, remote, onApplyFilters]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    dispatch(setPostedWithinHours(value));
    setTimeout(() => onApplyFilters(), 0);
  }, [dispatch, onApplyFilters]);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const sortOption = FILTER_OPTIONS.SORT_OPTIONS.find(opt => `${opt.value}-${opt.order}` === value);
    if (sortOption) {
      dispatch(setSort({ 
        sortBy: sortOption.value as 'score' | 'postedAt' | 'company', 
        order: sortOption.order as 'asc' | 'desc' 
      }));
      setTimeout(() => onApplyFilters(), 0);
    }
  }, [dispatch, onApplyFilters]);

  const handleReset = useCallback(() => {
    dispatch(resetFilters());
    // Apply filters after reset to refresh the list - use slightly longer timeout to ensure state updates
    setTimeout(() => onApplyFilters(), 10);
  }, [dispatch, onApplyFilters]);

  const handleApply = useCallback(() => {
    onApplyFilters();
  }, [onApplyFilters]);

  const selectVariants = {
    hover: { borderColor: '#2563eb', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)' },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const badgeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } },
    exit: { scale: 0, opacity: 0, transition: { duration: 0.15 } },
  };

  const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4"
    >
      {/* Header with active filter count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
          <AnimatePresence mode="wait">
            {filterCount > 0 && (
              <motion.span
                key="filter-count"
                variants={badgeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-xs font-bold rounded-full"
              >
                {filterCount}
              </motion.span>
            )}
          </AnimatePresence>
          {/* Score Legend */}
          <div className="group relative ml-2">
            <div className="p-1 bg-gray-100 dark:bg-slate-700 rounded-full cursor-help">
              <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="absolute left-0 top-8 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div className="bg-gray-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl p-3 w-64">
                <div className="font-semibold mb-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Job Score Explained
                </div>
                <p className="mb-2">Scores are calculated based on:</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-start gap-1.5">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span><span className="font-medium">Recency</span> - How recently posted</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span><span className="font-medium">Relevance</span> - Match quality</span>
                  </li>
                </ul>
                <div className="mt-2 pt-2 border-t border-gray-700 dark:border-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded text-[10px] font-semibold">70-100%</span>
                    <span>Excellent match</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-yellow-900/40 text-yellow-400 rounded text-[10px] font-semibold">40-69%</span>
                    <span>Good match</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-red-900/40 text-red-400 rounded text-[10px] font-semibold">0-39%</span>
                    <span>Fair match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleReset}
              suppressHydrationWarning
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset All
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Country Filter */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Country
          </label>
          <select
            value={country}
            onChange={handleCountryChange}
            suppressHydrationWarning
            className="w-full h-[38px] px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-slate-700 transition-all hover:border-blue-400 dark:hover:border-blue-500"
          >
            <option value="">All Countries</option>
            {FILTER_OPTIONS.COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </motion.div>

        {/* Time Filter */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Posted
          </label>
          <select
            value={postedWithinHours ?? ''}
            onChange={handleTimeChange}
            suppressHydrationWarning
            className="w-full h-[38px] px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-slate-700 transition-all hover:border-blue-400 dark:hover:border-blue-500"
          >
            <option value="">Any Time</option>
            {FILTER_OPTIONS.TIME_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
        </motion.div>

        {/* Sort Filter */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Sort By
          </label>
          <select
            value={`${sortBy}-${order}`}
            onChange={handleSortChange}
            suppressHydrationWarning
            className="w-full h-[38px] px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-slate-700 transition-all hover:border-blue-400 dark:hover:border-blue-500"
          >
            {FILTER_OPTIONS.SORT_OPTIONS.map((opt) => (
              <option key={`${opt.value}-${opt.order}`} value={`${opt.value}-${opt.order}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Remote Toggle */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Work Type
          </label>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleRemoteToggle}
            suppressHydrationWarning
            className={`w-full h-[38px] px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              remote
                ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
          >
            {remote ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Remote Only
              </span>
            ) : (
              'All Locations'
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FilterBar;
