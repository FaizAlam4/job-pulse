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
      className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg p-6 mb-8 border border-blue-100 dark:border-slate-700 transition-colors"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-wrap items-center gap-6 mb-6">
        <motion.div className="flex-1 min-w-[200px]" variants={itemVariants}>
          <label className="block text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Country</label>
          <motion.select
            value={country}
            onChange={handleCountryChange}
            suppressHydrationWarning
            className="w-full px-4 py-2 border-2 border-blue-100 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 shadow-sm transition-all"
            variants={selectVariants}
            whileHover="hover"
          >
            <option value="">All Countries</option>
            {FILTER_OPTIONS.COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </motion.select>
        </motion.div>

        {/* Time Period Filter */}
        <motion.div className="flex-1 min-w-[200px]" variants={itemVariants}>
          <label className="block text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Posted Within</label>
          <motion.select
            value={postedWithinHours ?? ''}
            onChange={handleTimeChange}
            suppressHydrationWarning
            className="w-full px-4 py-2 border-2 border-blue-100 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 shadow-sm transition-all"
            variants={selectVariants}
            whileHover="hover"
          >
            <option value="">Any Time</option>
            {FILTER_OPTIONS.TIME_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </motion.select>
        </motion.div>

        {/* Sort */}
        <motion.div className="flex-1 min-w-[200px]" variants={itemVariants}>
          <label className="block text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Sort By</label>
          <motion.select
            value={`${sortBy}-${order}`}
            onChange={handleSortChange}
            suppressHydrationWarning
            className="w-full px-4 py-2 border-2 border-blue-100 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 shadow-sm transition-all"
            variants={selectVariants}
            whileHover="hover"
          >
            {FILTER_OPTIONS.SORT_OPTIONS.map((opt) => (
              <option key={`${opt.value}-${opt.order}`} value={`${opt.value}-${opt.order}`}>
                {opt.label}
              </option>
            ))}
          </motion.select>
        </motion.div>

        {/* Remote Toggle */}
        <motion.div className="flex items-center pt-8" variants={itemVariants}>
          <label className="flex items-center cursor-pointer select-none">
            <motion.input
              type="checkbox"
              checked={remote}
              onChange={handleRemoteToggle}
              suppressHydrationWarning
              className="w-5 h-5 text-blue-600 border-blue-300 dark:border-slate-500 rounded-lg focus:ring-blue-400 transition-all shadow-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            />
            <motion.span
              className="ml-3 text-base text-blue-700 dark:text-blue-400 font-medium"
              animate={{ color: remote ? '#2563eb' : '#666' }}
            >
              Remote Only
            </motion.span>
          </label>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-blue-700 dark:text-blue-400 font-semibold">
          <AnimatePresence mode="wait">
            {filterCount > 0 && (
              <motion.span
                className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full shadow-sm"
                variants={badgeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {filterCount} filter{filterCount > 1 ? 's' : ''} active
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <motion.button
              onClick={handleReset}
              suppressHydrationWarning
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-md hover:from-blue-600 hover:to-indigo-600 transition-all"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              layout
            >
              Reset
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FilterBar;
