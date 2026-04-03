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

  // Jobs are already paginated from API, no need to slice
  if (jobs.length === 0) {
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
          {jobs.map((job, idx) => (
            <div key={job._id}>
              <JobCard job={job} variant={variant} index={idx} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Enhanced Pagination Controls */}
      {totalPages > 1 && (
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 pb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {/* Page Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
          </div>
          
          {/* Pagination Buttons */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <motion.button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              className="px-3 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              disabled={currentPage === 1}
              variants={paginationButtonVariants}
              whileHover={currentPage !== 1 ? "hover" : undefined}
              whileTap={currentPage !== 1 ? "tap" : undefined}
              title="Previous page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            
            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {(() => {
                const pages = [];
                const maxButtons = 7;
                
                if (totalPages <= maxButtons) {
                  // Show all pages
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Smart pagination
                  if (currentPage <= 4) {
                    // Near start
                    for (let i = 1; i <= 5; i++) pages.push(i);
                    pages.push('...');
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 3) {
                    // Near end
                    pages.push(1);
                    pages.push('...');
                    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                  } else {
                    // Middle
                    pages.push(1);
                    pages.push('...');
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                    pages.push('...');
                    pages.push(totalPages);
                  }
                }
                
                return pages.map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-400 dark:text-gray-500">
                        •••
                      </span>
                    );
                  }
                  
                  const pageNum = page as number;
                  const isActive = pageNum === currentPage;
                  
                  return (
                    <motion.button
                      key={pageNum}
                      onClick={() => onPageChange && onPageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                      }`}
                      variants={paginationButtonVariants}
                      whileHover={!isActive ? "hover" : undefined}
                      whileTap={!isActive ? "tap" : undefined}
                    >
                      {pageNum}
                    </motion.button>
                  );
                });
              })()}
            </div>
            
            {/* Next Button */}
            <motion.button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              className="px-3 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              disabled={currentPage === totalPages}
              variants={paginationButtonVariants}
              whileHover={currentPage !== totalPages ? "hover" : undefined}
              whileTap={currentPage !== totalPages ? "tap" : undefined}
              title="Next page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default JobList;
