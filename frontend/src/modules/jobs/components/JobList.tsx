/**
 * JobList Component
 * Renders a list of job cards with loading and empty states
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  // Show skeletons while loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          <AnimatePresence>
            {Array.from({ length: pageSize }).map((_, index) => (
              <motion.div
                key={`skeleton-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <JobCardSkeleton />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Calculate jobs to show for current page
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const jobsToShow = jobs.slice(startIdx, endIdx);

  if (jobsToShow.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const paginationButtonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Job Cards */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {jobsToShow.map((job, idx) => (
            <div key={job._id}>
              <JobCard job={job} variant={variant} index={idx} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <motion.div
          className="flex justify-center pt-4 gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <motion.button
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            disabled={currentPage === 1}
            variants={paginationButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Previous
          </motion.button>
          <motion.span
            className="px-4 py-2 font-semibold text-gray-900 dark:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Page {currentPage} of {totalPages}
          </motion.span>
          <motion.button
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            disabled={currentPage === totalPages}
            variants={paginationButtonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Next
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default JobList;
