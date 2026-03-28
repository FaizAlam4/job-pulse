/**
 * Filters Slice
 * Redux Toolkit slice for filter state management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterState } from '../types';

// Initial state
const initialState: FilterState = {
  searchQuery: '',
  location: '',
  country: '',
  state: '',
  city: '',
  remote: false,
  skills: [],
  postedWithinHours: null,
  sortBy: 'score',
  order: 'desc',
  isFilterPanelOpen: false,
};

// Create slice
const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Location filters
    setLocation: (state, action: PayloadAction<string>) => {
      state.location = action.payload;
    },
    setCountry: (state, action: PayloadAction<string>) => {
      state.country = action.payload;
    },
    setState: (state, action: PayloadAction<string>) => {
      state.state = action.payload;
    },
    setCity: (state, action: PayloadAction<string>) => {
      state.city = action.payload;
    },
    setRemote: (state, action: PayloadAction<boolean>) => {
      state.remote = action.payload;
    },

    // Skills
    addSkill: (state, action: PayloadAction<string>) => {
      if (!state.skills.includes(action.payload)) {
        state.skills.push(action.payload);
      }
    },
    removeSkill: (state, action: PayloadAction<string>) => {
      state.skills = state.skills.filter(skill => skill !== action.payload);
    },
    setSkills: (state, action: PayloadAction<string[]>) => {
      state.skills = action.payload;
    },
    clearSkills: (state) => {
      state.skills = [];
    },

    // Time filter
    setPostedWithinHours: (state, action: PayloadAction<number | null>) => {
      state.postedWithinHours = action.payload;
    },

    // Sorting
    setSortBy: (state, action: PayloadAction<'score' | 'postedAt' | 'company'>) => {
      state.sortBy = action.payload;
    },
    setOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.order = action.payload;
    },
    setSort: (state, action: PayloadAction<{ sortBy: 'score' | 'postedAt' | 'company'; order: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.sortBy;
      state.order = action.payload.order;
    },

    // UI
    toggleFilterPanel: (state) => {
      state.isFilterPanelOpen = !state.isFilterPanelOpen;
    },
    openFilterPanel: (state) => {
      state.isFilterPanelOpen = true;
    },
    closeFilterPanel: (state) => {
      state.isFilterPanelOpen = false;
    },

    // Reset
    resetFilters: () => initialState,
    resetLocationFilters: (state) => {
      state.location = '';
      state.country = '';
      state.state = '';
      state.city = '';
      state.remote = false;
    },
  },
});

// Export actions
export const {
  setSearchQuery,
  setLocation,
  setCountry,
  setState,
  setCity,
  setRemote,
  addSkill,
  removeSkill,
  setSkills,
  clearSkills,
  setPostedWithinHours,
  setSortBy,
  setOrder,
  setSort,
  toggleFilterPanel,
  openFilterPanel,
  closeFilterPanel,
  resetFilters,
  resetLocationFilters,
} = filtersSlice.actions;

// Export reducer
export default filtersSlice.reducer;
