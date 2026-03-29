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
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
}


export const JobList: React.FC<JobListProps> = ({
  jobs,
  isLoading = false,
  variant = 'default',
  emptyMessage = 'No jobs found matching your criteria',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
}) => {
  // Calculate jobs to show for current page
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const jobsToShow = jobs.slice(startIdx, endIdx);

  if (jobsToShow.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-4">
      {/* Job Cards */}
      <div className="grid gap-4">
        {jobsToShow.map((job) => (
          <JobCard key={job._id} job={job} variant={variant} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4 gap-2">
          <button
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="px-4 py-2 font-semibold text-gray-900 dark:text-white">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default JobList;
