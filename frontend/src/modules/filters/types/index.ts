/**
 * Filter Types
 * Types for filter state management
 */

export interface FilterState {
  // Search query
  searchQuery: string;
  
  // Location filters
  location: string;
  country: string;
  state: string;
  city: string;
  remote: boolean;
  
  // Skill filter
  skills: string[];
  
  // Time filter
  postedWithinHours: number | null;
  
  // Sort options
  sortBy: 'score' | 'postedAt' | 'company';
  order: 'asc' | 'desc';
  
  // UI state
  isFilterPanelOpen: boolean;
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
}
