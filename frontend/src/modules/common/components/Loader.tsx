/**
 * Loader Component
 * Reusable loading spinner and skeleton components
 */

import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
      />
    </div>
  );
};

// Full page loader
export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
};

// Skeleton loader for job cards
export const JobCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 animate-pulse border border-gray-100 dark:border-slate-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
        <div className="h-10 w-16 bg-gray-200 dark:bg-slate-700 rounded-lg" />
      </div>
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6 mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-200 dark:bg-slate-700 rounded-full" />
        <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-full" />
        <div className="h-6 w-14 bg-gray-200 dark:bg-slate-700 rounded-full" />
      </div>
    </div>
  );
};

// Skeleton for stat cards (gradient style)
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 text-center border border-gray-100 dark:border-slate-700 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-16 mx-auto mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 mx-auto" />
    </div>
  );
};

// Skeleton for large stat cards with icons
export const LargeStatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-200 dark:bg-slate-700 rounded-xl p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-20 mb-2" />
          <div className="h-10 bg-gray-300 dark:bg-slate-600 rounded w-24" />
        </div>
        <div className="w-12 h-12 bg-gray-300 dark:bg-slate-600 rounded-lg" />
      </div>
    </div>
  );
};

// Skeleton for job detail page
export const JobDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header skeleton */}
      <div className="bg-gray-300 dark:bg-slate-700 animate-pulse">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-4 w-24 bg-gray-400 dark:bg-slate-600 rounded mb-6" />
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="h-10 bg-gray-400 dark:bg-slate-600 rounded w-3/4 mb-3" />
              <div className="h-6 bg-gray-400 dark:bg-slate-600 rounded w-1/2 mb-4" />
              <div className="flex gap-3">
                <div className="h-8 w-24 bg-gray-400 dark:bg-slate-600 rounded-full" />
                <div className="h-8 w-20 bg-gray-400 dark:bg-slate-600 rounded-full" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 min-w-[160px]">
              <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded w-20 mx-auto mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-40 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {/* Sidebar skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-32 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for stats page content
export const StatsPageSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-64" />
      </div>

      {/* Stats Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <LargeStatCardSkeleton key={i} />
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-gray-100 dark:border-slate-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-32 mb-2" />
            <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-24" />
          </div>
          <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-32 mb-2" />
            <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-24" />
          </div>
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-40 mb-4" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-slate-700 rounded-full w-20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
