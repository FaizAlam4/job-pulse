/**
 * Stats Page
 * Displays job statistics and analytics
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  const statCardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        type: 'spring' as const,
        stiffness: 100,
      },
    }),
  };

  const barVariants = {
    hidden: { width: 0 },
    visible: (percentage: number) => ({
      width: `${percentage}%`,
      transition: {
        duration: 0.8,
        ease: 'easeOut' as const,
      },
    }),
  };

  const skillVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.03,
        duration: 0.3,
        type: 'spring' as const,
        stiffness: 200,
      },
    }),
  };

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
    <motion.div
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Job Statistics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of jobs in the database
        </p>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
          variants={itemVariants}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </motion.div>
      )}

      {stats ? (
        <>
          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            variants={itemVariants}
          >
            {/* Total Jobs */}
            <motion.div
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              variants={statCardVariants}
              custom={0}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Jobs</p>
                  <motion.p
                    className="text-4xl font-bold"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, type: 'spring' as const, stiffness: 100 }}
                  >
                    {totalJobs}
                  </motion.p>
                </div>
                <motion.div
                  className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>

            {/* Average Score */}
            <motion.div
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              variants={statCardVariants}
              custom={1}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Average Score</p>
                  <motion.p
                    className="text-4xl font-bold"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5, type: 'spring' as const, stiffness: 100 }}
                  >
                    {overall?.avgScore ? Math.round(overall.avgScore * 100) : 0}
                    <span className="text-2xl">%</span>
                  </motion.p>
                </div>
                <motion.div
                  className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>

            {/* Sources */}
            <motion.div
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              variants={statCardVariants}
              custom={2}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Job Sources</p>
                  <motion.p
                    className="text-4xl font-bold"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5, type: 'spring' as const, stiffness: 100 }}
                  >
                    {bySource.length}
                  </motion.p>
                </div>
                <motion.div
                  className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>

            {/* Locations */}
            <motion.div
              className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              variants={statCardVariants}
              custom={3}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">Locations</p>
                  <motion.p
                    className="text-4xl font-bold"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5, type: 'spring' as const, stiffness: 100 }}
                  >
                    {topLocations.length}
                  </motion.p>
                </div>
                <motion.div
                  className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Timeline Info */}
          {overall?.newestJob && (
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-gray-100 dark:border-slate-700"
              variants={cardVariants}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Data Timeline
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Most Recent Job</p>
                  <p className="text-gray-900 dark:text-white font-medium">{formatDistanceToNow(overall.newestJob)}</p>
                </motion.div>
                <motion.div
                  className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Oldest Job</p>
                  <p className="text-gray-900 dark:text-white font-medium">{formatDistanceToNow(overall.oldestJob)}</p>
                </motion.div>
              </div>
            </motion.div>
          )}

          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={itemVariants}>
            {/* Top Locations */}
            {topLocations.length > 0 && (
              <motion.div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700"
                variants={cardVariants}
                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              >
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
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{loc._id}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{loc.count} jobs ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            className={`h-2.5 rounded-full ${colors[index % colors.length]}`}
                            variants={barVariants}
                            initial="hidden"
                            animate="visible"
                            custom={percentage}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Jobs by Source */}
            {bySource.length > 0 && (
              <motion.div
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-700"
                variants={cardVariants}
                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              >
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
                      <motion.div
                        key={index}
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + index * 0.15, duration: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <motion.div
                          className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
                          whileHover={{ rotate: 5 }}
                        >
                          {src._id.charAt(0).toUpperCase()}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{src._id.replace('-', ' ')}</span>
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{src.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                              variants={barVariants}
                              initial="hidden"
                              animate="visible"
                              custom={percentage}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Top Skills */}
          {topSkills && topSkills.length > 0 && (
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mt-6 border border-gray-100 dark:border-slate-700"
              variants={cardVariants}
              whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Top Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {topSkills.slice(0, 20).map((skill, index) => (
                  <motion.span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-100 dark:border-emerald-800 cursor-default"
                    variants={skillVariants}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {skill._id}
                    <motion.span
                      className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded-full text-xs font-semibold"
                      whileHover={{ scale: 1.2 }}
                    >
                      {skill.count}
                    </motion.span>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </motion.div>
          <motion.p
            className="text-gray-500 dark:text-gray-400 text-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            No statistics available
          </motion.p>
          <motion.p
            className="text-gray-400 dark:text-gray-500 text-sm mt-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            Add some jobs to see analytics
          </motion.p>
        </motion.div>
      )}
    </motion.div>
  );
}
