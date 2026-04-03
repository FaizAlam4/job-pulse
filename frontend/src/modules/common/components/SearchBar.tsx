/**
 * SearchBar Component
 * Debounced search input for jobs
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/modules/common/hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search jobs by title, company, or skills...',
  initialValue = '',
  debounceMs = 300,
}) => {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedValue = useDebounce(value, debounceMs);
  const isFirstRender = React.useRef(true);

  // Sync with initialValue when it changes (e.g., from Redux on navigation)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Trigger search when debounced value changes (but skip first render to avoid duplicate fetch)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setValue('');
  }, []);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Search Icon */}
      <motion.div
        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        animate={{ scale: isFocused ? 1.1 : 1, color: isFocused ? '#3b82f6' : '#9ca3af' }}
        transition={{ duration: 0.2 }}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </motion.div>

      {/* Input */}
      <motion.input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        suppressHydrationWarning
        className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-slate-800 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
        animate={{
          borderColor: isFocused ? '#3b82f6' : '#d1d5db',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(59, 130, 246, 0.1)'
            : 'none',
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Clear Button */}
      <AnimatePresence mode="wait">
        {value && (
          <motion.button
            onClick={handleClear}
            suppressHydrationWarning
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SearchBar;
