/**
 * Stats Page
 * Displays job statistics and analytics
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/modules/common/hooks/useRedux';
import { fetchStatsRequest } from '@/modules/jobs/store/jobsSlice';
import {
  selectStats,
  selectIsLoadingStats,
  selectJobsError,
  selectShouldShowStatsSkeleton,
} from '@/modules/jobs/store/jobsSelectors';
import { StatsPageSkeleton } from '@/modules/common/components/Loader';
import { formatDistanceToNow } from '@/modules/common/utils/dateUtils';

export default function StatsPage() {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectStats);
  const loading = useAppSelector(selectIsLoadingStats);
  const showSkeleton = useAppSelector(selectShouldShowStatsSkeleton);
  const error = useAppSelector(selectJobsError);
  const hasFetched = useRef(false);

  // Fetch stats on mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchStatsRequest());
    }
  }, [dispatch]);

  // Show skeleton while loading or before first fetch
  if (showSkeleton) {
    return <StatsPageSkeleton />;
  }

  const overall = stats?.overall;
  const bySource = stats?.bySource || [];
  const topLocations = stats?.topLocations || [];
  const topSkills = stats?.topSkills || [];
  const totalJobs = overall?.totalJobs || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Job Statistics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of jobs in the database
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Jobs */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Jobs</p>
                  <p className="text-4xl font-bold">{totalJobs}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Average Score</p>
                  <p className="text-4xl font-bold">
                    {overall?.avgScore ? Math.round(overall.avgScore * 100) : 0}
                    <span className="text-2xl">%</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Sources */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Job Sources</p>
                  <p className="text-4xl font-bold">{bySource.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">Locations</p>
                  <p className="text-4xl font-bold">{topLocations.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Info */}
          {overall?.newestJob && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Data Timeline
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Most Recent Job</p>
                  <p className="text-gray-900 dark:text-white font-medium">{formatDistanceToNow(overall.newestJob)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Oldest Job</p>
                  <p className="text-gray-900 dark:text-white font-medium">{formatDistanceToNow(overall.oldestJob)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Locations */}
            {topLocations.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Top Locations
                </h2>
                <div className="space-y-3">
                  {topLocations.map((loc, index) => {
                    const percentage = totalJobs > 0 ? (loc.count / totalJobs * 100) : 0;
                    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'];
                    return (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{loc._id}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{loc.count} jobs ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${colors[index % colors.length]} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Jobs by Source */}
            {bySource.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Jobs by Source
                </h2>
                <div className="space-y-4">
                  {bySource.map((src, index) => {
                    const percentage = totalJobs > 0 ? (src.count / totalJobs * 100) : 0;
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {src._id.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{src._id.replace('-', ' ')}</span>
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{src.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Top Skills */}
          {topSkills && topSkills.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mt-6 border border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Top Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {topSkills.slice(0, 20).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-100 dark:border-emerald-800"
                  >
                    {skill._id}
                    <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded-full text-xs">
                      {skill.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">No statistics available</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add some jobs to see analytics</p>
        </div>
      )}
    </div>
  );
}
