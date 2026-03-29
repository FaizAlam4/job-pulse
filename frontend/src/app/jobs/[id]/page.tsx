/**
 * Job Detail Page
 * Displays full details for a single job
 */

'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/modules/common/hooks/useRedux';
import { fetchJobDetailRequest } from '@/modules/jobs/store/jobsSlice';
import {
  selectCurrentJob,
  selectSimilarJobs,
  selectJobDetailLoading,
  selectJobsError,
} from '@/modules/jobs/store/jobsSelectors';
import { PageLoader } from '@/modules/common/components/Loader';
import { ErrorState } from '@/modules/common/components/ErrorState';
import { formatDate, formatDistanceToNow } from '@/modules/common/utils/dateUtils';
import { Job, SimilarJob } from '@/modules/jobs/types';

// Convert 0-1 score to percentage
const toPercentage = (score: number): number => {
  return Math.round(score <= 1 ? score * 100 : score);
};

// Score badge color helper (expects 0-100)
const getScoreGradient = (score: number): string => {
  if (score >= 70) return 'from-emerald-500 to-green-600';
  if (score >= 50) return 'from-blue-500 to-indigo-600';
  if (score >= 30) return 'from-amber-500 to-orange-600';
  return 'from-gray-500 to-gray-600';
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  // Import resetFilters action
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { resetFilters } = require('@/modules/filters/store/filtersSlice');
  
  const job = useAppSelector(selectCurrentJob);
  const similarJobs = useAppSelector(selectSimilarJobs);
  const loading = useAppSelector(selectJobDetailLoading);
  const error = useAppSelector(selectJobsError);

  const jobId = params?.id as string;

  useEffect(() => {
    if (jobId) {
      dispatch(fetchJobDetailRequest(jobId));
    }
  }, [dispatch, jobId]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorState
          title="Failed to load job"
          message={error}
          onRetry={() => dispatch(fetchJobDetailRequest(jobId))}
        />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorState
          title="Job not found"
          message="The job you're looking for doesn't exist or has been removed."
        />
      </div>
    );
  }

  // Convert scores to percentage
  const scorePercent = toPercentage(job.score);
  const freshnessPercent = toPercentage(job.freshnessScore || 0);
  const relevancePercent = toPercentage(job.relevanceScore || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header with gradient */}
      <div className={`bg-gradient-to-br ${getScoreGradient(scorePercent)} text-white`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => {
              dispatch(resetFilters());
              router.push('/');
            }}
            className="inline-flex items-center text-sm text-white/80 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{job.title}</h1>
              <p className="text-xl text-white/90 mb-4">{job.company}</p>
              <div className="flex flex-wrap items-center gap-3">
                {job.location && (
                  <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </span>
                )}
                {job.source && (
                  <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm capitalize">
                    {job.source.replace('-', ' ')}
                  </span>
                )}
              </div>
            </div>

            {/* Score Badge */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-xl min-w-[160px]">
              <p className="text-5xl font-bold text-gray-900 dark:text-white">{scorePercent}%</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Match Score</p>
              <div className="mt-3 flex justify-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <svg 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.ceil(scorePercent / 20) ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Job Description
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                {job.description ? (
                  <div
                    className="job-description whitespace-pre-wrap overflow-auto"
                    style={{
                      maxHeight: '40vh', // desktop
                      minHeight: '120px',
                    }}
                  >
                    <div
                      className="px-1 md:px-2"
                      style={{
                        maxHeight: '40vh',
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                      }}
                      dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="italic">No description available</p>
                    <p className="text-sm mt-1">Click "Apply Now" to view full details on the source website</p>
                  </div>
                )}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Score Breakdown
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Overall Score</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{scorePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(scorePercent)}`} style={{ width: `${scorePercent}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Freshness Score</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{freshnessPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600" style={{ width: `${freshnessPercent}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Relevance Score</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{relevancePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${relevancePercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Jobs */}
            {similarJobs && similarJobs.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Similar Jobs
                </h2>
                <div className="space-y-3">
                  {similarJobs.map((similarJob: SimilarJob) => {
                    const similarScorePercent = toPercentage(similarJob.score);
                    return (
                      <Link 
                        key={similarJob._id} 
                        href={`/jobs/${similarJob._id}`}
                        className="block p-4 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">{similarJob.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{similarJob.company}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {similarJob.location}
                              </span>
                              <span>{formatDistanceToNow(similarJob.postedAt)}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-sm font-semibold bg-gradient-to-r ${getScoreGradient(similarScorePercent)} text-white`}>
                            {similarScorePercent}%
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6">
              {job.sourceUrl ? (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <span>Apply Now</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <div className="text-center">
                  <div className="w-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-4 py-3 rounded-xl font-medium mb-2">
                    External Link Not Available
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Search for "{job.title}" on job boards</p>
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Job Details
              </h2>
              <div className="space-y-4">
                {job.salary && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Salary</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{job.salary}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Source</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{job.source?.replace('-', ' ')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Posted</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDistanceToNow(job.postedAt)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(job.postedAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Added to JobPulse</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(job.createdAt)}</p>
                  </div>
                </div>

                {job.hash && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Job ID</p>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-500 truncate max-w-[150px]" title={job.hash}>{job.hash.substring(0, 12)}...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status
              </h2>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${job.isActive !== false ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${job.isActive !== false ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {job.isActive !== false ? 'Active' : 'Archived'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
