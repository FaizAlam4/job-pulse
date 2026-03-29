/**
 * Top Jobs Page
 * Displays highest scored jobs
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/modules/common/hooks/useRedux';
import { fetchTopJobsRequest } from '@/modules/jobs/store/jobsSlice';
import {
  selectTopJobs,
  selectIsLoading,
  selectJobsError,
  selectShouldShowTopJobsSkeleton,
} from '@/modules/jobs/store/jobsSelectors';
import { JobList } from '@/modules/jobs/components/JobList';
import { StatCardSkeleton } from '@/modules/common/components/Loader';

export default function TopJobsPage() {
  const dispatch = useAppDispatch();
  const topJobs = useAppSelector(selectTopJobs);
  const loading = useAppSelector(selectIsLoading);
  const showSkeleton = useAppSelector(selectShouldShowTopJobsSkeleton);
  const error = useAppSelector(selectJobsError);
  const hasFetched = useRef(false);

  // Fetch top jobs on mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchTopJobsRequest(20));
    }
  }, [dispatch]);

  // Calculate average score
  const avgScore = topJobs.length > 0 
    ? Math.round(topJobs.reduce((sum, job) => sum + job.score, 0) / topJobs.length)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-900 dark:via-teal-900 dark:to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium">Premium Listings</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Top Scoring Jobs
            </h1>
            <p className="text-emerald-100 dark:text-emerald-200 text-lg md:text-xl max-w-2xl mx-auto">
              The highest rated opportunities based on our intelligent scoring algorithm
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8 -mt-16">
          {showSkeleton ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 text-center border border-gray-100 dark:border-slate-700">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{topJobs.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Top Jobs</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 text-center border border-gray-100 dark:border-slate-700">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{avgScore}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Score</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 text-center border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quality</p>
              </div>
            </>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Featured Opportunities
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {showSkeleton ? 'Loading...' : `${topJobs.length} premium jobs`}
          </p>
        </div>

        {/* Job List */}
        <JobList
          jobs={topJobs}
          isLoading={showSkeleton}
          emptyMessage="No top jobs available at the moment"
        />
      </div>
    </div>
  );
}
