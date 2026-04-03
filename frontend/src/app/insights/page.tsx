/**
 * Insights Page
 * Personal analytics and job search statistics (requires authentication)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/auth/LoginModal';
import SignupModal from '@/components/auth/SignupModal';
import { insightsService } from '@/modules/insights/services/insightsService';
import {
  OverviewStats,
  ApplicationTrends,
  SourceData,
  SkillsAnalysis,
  GoalsProgress,
} from '@/modules/insights/types';
import { BarChart } from '@/modules/insights/components/BarChart';
import { RingChart } from '@/modules/insights/components/RingChart';
import { LineChart } from '@/modules/insights/components/LineChart';
import { GoalProgress } from '@/modules/insights/components/GoalProgress';
import {
  TRACKING_STATUS_LABELS,
  TRACKING_STATUS_COLORS,
  TrackingStatus,
} from '@/modules/tracking/types';

export default function InsightsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [prefillDemo, setPrefillDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trends, setTrends] = useState<ApplicationTrends | null>(null);
  const [sources, setSources] = useState<SourceData[] | null>(null);
  const [skills, setSkills] = useState<SkillsAnalysis | null>(null);
  const [goals, setGoals] = useState<GoalsProgress | null>(null);
  
  const [trendPeriod, setTrendPeriod] = useState<number>(30);

  // Fetch all insights data
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllInsights();
    }
  }, [isAuthenticated, trendPeriod]);

  const fetchAllInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [overviewRes, trendsRes, sourcesRes, skillsRes, goalsRes] = await Promise.all([
        insightsService.getOverviewStats(),
        insightsService.getApplicationTrends(trendPeriod),
        insightsService.getSourcesBreakdown(),
        insightsService.getSkillsAnalysis(),
        insightsService.getGoalsProgress(),
      ]);
      
      if (overviewRes.success) setOverview(overviewRes.data || null);
      if (trendsRes.success) setTrends(trendsRes.data || null);
      if (sourcesRes.success) setSources(sourcesRes.data || null);
      if (skillsRes.success) setSkills(skillsRes.data || null);
      if (goalsRes.success) setGoals(goalsRes.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  };

  // If authenticated, show insights content
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Personal Insights
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track your job search progress and discover patterns
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!isLoading && overview && (
            <>
              {/* Stats Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Tracked</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.totalApplications}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Response Rate</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.responseRate}%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.thisWeekApplications}</p>
                        {overview.weeklyGrowth !== 0 && (
                          <span className={`text-sm font-medium ${overview.weeklyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {overview.weeklyGrowth > 0 ? '+' : ''}{overview.weeklyGrowth}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Avg Response</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {overview.avgTimeToResponse ? `${overview.avgTimeToResponse}d` : '-'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Status Breakdown */}
                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    Status Breakdown
                  </h3>
                  <div className="space-y-4">
                    {(Object.keys(TRACKING_STATUS_LABELS) as TrackingStatus[]).map((status) => {
                      const count = overview.statusBreakdown[status] || 0;
                      const percentage = overview.totalApplications > 0 
                        ? Math.round((count / overview.totalApplications) * 100) 
                        : 0;
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${TRACKING_STATUS_COLORS[status].bg}`} />
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                            {TRACKING_STATUS_LABELS[status]}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {count}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Response Rate Ring */}
                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    Response Rate
                  </h3>
                  <RingChart
                    percentage={overview.responseRate}
                    size={140}
                    strokeWidth={12}
                    color="stroke-green-500"
                    label="of applications"
                    sublabel="got a response"
                  />
                </motion.div>

                {/* Top Companies */}
                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🏢</span>
                    Top Companies
                  </h3>
                  {overview.topCompanies.length > 0 ? (
                    <BarChart
                      data={overview.topCompanies.map((c) => ({
                        label: c.name,
                        value: c.count,
                      }))}
                    />
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      No applications tracked yet
                    </p>
                  )}
                </motion.div>
              </div>

              {/* Trends Section */}
              {trends && trends.daily.length > 0 && (
                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-xl">📈</span>
                      Application Trends
                    </h3>
                    <div className="flex gap-2">
                      {[7, 14, 30].map((days) => (
                        <button
                          key={days}
                          onClick={() => setTrendPeriod(days)}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            trendPeriod === days
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {days}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <LineChart
                    data={trends.cumulative.map((d) => d.cumulative || 0)}
                    height={150}
                    color="#3B82F6"
                  />
                  <div className="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{trends.daily[0]?.date}</span>
                    <span>{trends.daily[trends.daily.length - 1]?.date}</span>
                  </div>
                </motion.div>
              )}

              {/* Goals & Streaks + Sources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Goals */}
                {goals && (
                  <motion.div
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span className="text-xl">🎯</span>
                      Weekly Goals
                    </h3>
                    <div className="space-y-4">
                      <GoalProgress
                        label={goals.goals.weeklyApplications.label}
                        current={goals.goals.weeklyApplications.current}
                        target={goals.goals.weeklyApplications.target}
                        color="blue"
                      />
                      <GoalProgress
                        label={goals.goals.weeklyApplied.label}
                        current={goals.goals.weeklyApplied.current}
                        target={goals.goals.weeklyApplied.target}
                        color="green"
                      />
                    </div>
                    
                    {/* Streaks */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🔥</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Current Streak
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Days in a row
                            </p>
                          </div>
                        </div>
                        <span className="text-3xl font-bold text-orange-500">
                          {goals.streaks.current}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Best streak: {goals.streaks.longest} days
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Sources */}
                {sources && sources.length > 0 && (
                  <motion.div
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span className="text-xl">🌐</span>
                      Job Sources Performance
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400">
                            <th className="pb-2 font-medium">Source</th>
                            <th className="pb-2 font-medium text-center">Total</th>
                            <th className="pb-2 font-medium text-center">Response</th>
                            <th className="pb-2 font-medium text-center">Offers</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {sources.map((source) => (
                            <tr key={source.name}>
                              <td className="py-2 text-gray-900 dark:text-white font-medium">
                                {source.name}
                              </td>
                              <td className="py-2 text-center text-gray-700 dark:text-gray-300">
                                {source.total}
                              </td>
                              <td className="py-2 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  source.responseRate >= 50
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : source.responseRate >= 25
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                  {source.responseRate}%
                                </span>
                              </td>
                              <td className="py-2 text-center text-gray-700 dark:text-gray-300">
                                {source.offers}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Skills Analysis */}
              {skills && skills.topSkills.length > 0 && (
                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    Skills You're Targeting
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({skills.totalUniqueSkills} unique skills found)
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.topSkills.slice(0, 15).map((skill) => (
                      <motion.span
                        key={skill.keyword}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                        title={`Found in ${skill.count} applications`}
                      >
                        {skill.keyword}
                        <span className="ml-1 text-xs opacity-70">({skill.count})</span>
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {overview.totalApplications === 0 && (
                <motion.div
                  className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-gray-200 dark:border-slate-700 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No data yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Start tracking jobs to see your personalized insights
                  </p>
                  <a
                    href="/"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Jobs
                  </a>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading && !showLoginModal && !showSignupModal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated - show compact hero with CTA at top
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const iconVariants = {
    locked: { scale: 1, rotate: 0 },
    shake: {
      rotate: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
  };

  const features = [
    {
      icon: '📊',
      title: 'Application Stats',
      description: 'Track total applications and status breakdown',
    },
    {
      icon: '📈',
      title: 'Trend Analysis',
      description: 'Visualize your application activity over time',
    },
    {
      icon: '🎯',
      title: 'Response Rates',
      description: 'See how many applications get responses',
    },
    {
      icon: '💡',
      title: 'Skills Insights',
      description: 'Discover which skills you\'re targeting most',
    },
    {
      icon: '🔥',
      title: 'Streak Tracking',
      description: 'Stay motivated with daily streaks',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section - Compact with CTA */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-slate-700 mb-8"
          variants={itemVariants}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Icon */}
            <motion.div
              className="flex-shrink-0 mx-auto md:mx-0"
              variants={iconVariants}
              initial="locked"
              whileHover="shake"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 md:w-10 md:h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </motion.div>
            
            {/* Title & Description */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Personal Insights
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your job search progress and discover patterns
              </p>
            </div>
          </div>
          
          {/* CTA Buttons - Prominent */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <motion.button
              onClick={() => {
                setPrefillDemo(true);
                setShowLoginModal(true);
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try Demo
              </span>
            </motion.button>
            
            <motion.button
              onClick={() => setShowLoginModal(true)}
              className="flex-1 px-6 py-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-semibold border-2 border-gray-200 dark:border-slate-600"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </span>
            </motion.button>
            
            <motion.button
              onClick={() => setShowSignupModal(true)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign Up Free
              </span>
            </motion.button>
          </div>
          
          {/* Trust indicators - inline */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No credit card
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              100% Free
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              30 sec setup
            </span>
          </div>
        </motion.div>

        {/* Features Section - Horizontal scroll */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
            What you can do
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-hide">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-slate-700 flex-shrink-0 w-56 snap-center"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -3 }}
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
          {/* Scroll indicator */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="flex gap-1">
                {features.map((_, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                ))}
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPrefillDemo(false);
        }}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setPrefillDemo(false);
          setShowSignupModal(true);
        }}
        prefillDemo={prefillDemo}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}
