/**
 * Filters Selectors
 * Selectors for accessing filter state
 */

import type { RootState } from '@/store';
import { JobFilters } from '@/modules/jobs/types';

// Base selector
export const selectFiltersState = (state: RootState) => state.filters;

// Individual filters
export const selectLocation = (state: RootState) => state.filters.location;
export const selectCountry = (state: RootState) => state.filters.country;
export const selectState = (state: RootState) => state.filters.state;
export const selectCity = (state: RootState) => state.filters.city;
export const selectRemote = (state: RootState) => state.filters.remote;
export const selectSkills = (state: RootState) => state.filters.skills;
export const selectPostedWithinHours = (state: RootState) => state.filters.postedWithinHours;
export const selectSortBy = (state: RootState) => state.filters.sortBy;
export const selectOrder = (state: RootState) => state.filters.order;
export const selectIsFilterPanelOpen = (state: RootState) => state.filters.isFilterPanelOpen;

// Computed selectors
export const selectHasActiveFilters = (state: RootState): boolean => {
  const { location, country, state: stateName, city, remote, postedWithinHours, sortBy, order } = state.filters;
  // Check if any filter differs from default
  const hasLocationFilters = !!(location || country || stateName || city);
  const hasOtherFilters = remote || postedWithinHours !== null;
  const hasSortChanged = sortBy !== 'score' || order !== 'desc';
  return hasLocationFilters || hasOtherFilters || hasSortChanged;
};

export const selectActiveFilterCount = (state: RootState): number => {
  const { location, country, state: stateName, city, remote, postedWithinHours, sortBy, order } = state.filters;
  let count = 0;
  if (location) count++;
  if (country) count++;
  if (stateName) count++;
  if (city) count++;
  if (remote) count++;
  if (postedWithinHours !== null) count++;
  if (sortBy !== 'score' || order !== 'desc') count++;
  return count;
};

// Convert filter state to API params
export const selectApiFilters = (state: RootState): JobFilters => {
  const { location, country, state: stateName, city, remote, postedWithinHours, sortBy, order } = state.filters;
  
  const filters: JobFilters = {
    sortBy,
    order,
  };

  // Always include these fields (even if empty) so they can override cached values
  if (location) filters.location = location;
  if (country) {
    filters.country = country;
  }
  // For state/city, only include if set
  if (stateName) filters.state = stateName;
  if (city) filters.city = city;
  if (remote) filters.remote = true;
  if (postedWithinHours) filters.postedWithinHours = postedWithinHours;

  return filters;
};

// Alias for selectApiFilters
export const selectActiveFilters = selectApiFilters;
