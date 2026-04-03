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
    <div className="space-y-3">
      {/* Compact filter controls in single row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Country</label>
          <select
            value={country}
            onChange={handleCountryChange}
            suppressHydrationWarning
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-white bg-white dark:bg-slate-700 transition-all"
          >
            <option value="">All Countries</option>
            {FILTER_OPTIONS.COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Posted Within</label>
          <select
            value={postedWithinHours ?? ''}
            onChange={handleTimeChange}
            suppressHydrationWarning
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-white bg-white dark:bg-slate-700 transition-all"
          >
            <option value="">Any Time</option>
            {FILTER_OPTIONS.TIME_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sort By</label>
          <select
            value={`${sortBy}-${order}`}
            onChange={handleSortChange}
            suppressHydrationWarning
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-white bg-white dark:bg-slate-700 transition-all"
          >
            {FILTER_OPTIONS.SORT_OPTIONS.map((opt) => (
              <option key={`${opt.value}-${opt.order}`} value={`${opt.value}-${opt.order}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remote}
              onChange={handleRemoteToggle}
              suppressHydrationWarning
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-500 rounded focus:ring-blue-400 transition-all"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
              Remote Only
            </span>
          </label>
          
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              suppressHydrationWarning
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      
      {/* Active filters badge */}
      {filterCount > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
            {filterCount} filter{filterCount > 1 ? 's' : ''} active
          </span>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
