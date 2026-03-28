/**
 * JobList Component
 * Renders a list of job cards with loading and empty states
 */

'use client';

import React from 'react';
import { Job } from '@/modules/jobs/types';
import { JobCard } from './JobCard';
import { JobCardSkeleton } from '@/modules/common/components/Loader';
import { EmptyState } from '@/modules/common/components/ErrorState';

interface JobListProps {
  jobs: Job[];
  isLoading?: boolean;
  variant?: 'default' | 'compact';
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  skeletonCount?: number;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  isLoading = false,
  variant = 'default',
  emptyMessage = 'No jobs found matching your criteria',
  onLoadMore,
  hasMore = false,
  skeletonCount = 6,
}) => {
  // Loading state - show skeletons
  if (isLoading && jobs.length === 0) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <JobCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-4">
      {/* Job Cards */}
      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job._id} job={job} variant={variant} />
        ))}
      </div>

      {/* Loading more indicator */}
      {isLoading && jobs.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      )}

      {/* Load More Button */}
      {onLoadMore && hasMore && !isLoading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Load More Jobs
          </button>
        </div>
      )}
    </div>
  );
};

export default JobList;
