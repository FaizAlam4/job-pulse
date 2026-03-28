/**
 * Loader Component
 * Reusable loading spinner
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
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

// Skeleton loader for job cards
export const JobCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-200 rounded" />
        <div className="h-6 w-20 bg-gray-200 rounded" />
        <div className="h-6 w-14 bg-gray-200 rounded" />
      </div>
    </div>
  );
};

export default Loader;
