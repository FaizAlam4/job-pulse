/**
 * FilterBar Component
 * Job filters and search interface
 */

'use client';

import React, { useCallback } from 'react';
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

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
      <div className="flex flex-wrap items-center gap-6 mb-6">
        {/* Country Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-blue-700 mb-2">Country</label>
          <select
            value={country}
            onChange={handleCountryChange}
            suppressHydrationWarning
            className="w-full px-4 py-2 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 bg-white shadow-sm transition-all"
          >
            <option value="">All Countries</option>
            {FILTER_OPTIONS.COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Time Period Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-blue-700 mb-2">Posted Within</label>
          <select
            value={postedWithinHours ?? ''}
            onChange={handleTimeChange}
            suppressHydrationWarning
            className="w-full px-4 py-2 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 bg-white shadow-sm transition-all"
          >
            <option value="">Any Time</option>
            {FILTER_OPTIONS.TIME_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-blue-700 mb-2">Sort By</label>
          <select
            value={`${sortBy}-${order}`}
            onChange={handleSortChange}
            suppressHydrationWarning
            className="w-full px-4 py-2 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 bg-white shadow-sm transition-all"
          >
            {FILTER_OPTIONS.SORT_OPTIONS.map((opt) => (
              <option key={`${opt.value}-${opt.order}`} value={`${opt.value}-${opt.order}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Remote Toggle */}
        <div className="flex items-center pt-8">
          <label className="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remote}
              onChange={handleRemoteToggle}
              suppressHydrationWarning
              className="w-5 h-5 text-blue-600 border-blue-300 rounded-lg focus:ring-blue-400 transition-all shadow-sm"
            />
            <span className="ml-3 text-base text-blue-700 font-medium">Remote Only</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-blue-700 font-semibold">
          {filterCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full shadow-sm animate-fade-in">
              {filterCount} filter{filterCount > 1 ? 's' : ''} active
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              suppressHydrationWarning
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-md hover:from-blue-600 hover:to-indigo-600 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
