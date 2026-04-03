/**
 * JobCard Component
 * Displays individual job listing
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Job } from '@/modules/jobs/types';
import { formatDistanceToNow } from '@/modules/common/utils/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector } from '@/modules/common/hooks/useRedux';
import { TRACKING_STATUS_LABELS, TRACKING_STATUS_COLORS, TrackingStatus } from '@/modules/tracking/types';

interface JobCardProps {
  job: Job;
  variant?: 'default' | 'compact';
  index?: number;
}

// Convert 0-1 score to percentage
const toPercentage = (score: number): number => {
  return Math.round(score <= 1 ? score * 100 : score);
};

export const JobCard: React.FC<JobCardProps> = ({ job, variant = 'default', index = 0 }) => {
  const { isAuthenticated } = useAuth();
  
  // Get tracked jobs from Redux state (loaded once on login)
  const { trackedJobs, trackedJobIds } = useAppSelector((state: any) => state.tracking);
  
  // Check if this job is tracked using local state (no API call!)
  const trackedJob = isAuthenticated && trackedJobIds.includes(job._id) 
    ? trackedJobs.find((t: any) => t.jobId === job._id) 
    : null;
  
  const scorePercent = toPercentage(job.score);
  const scoreColor = scorePercent >= 70 ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/40' :
                     scorePercent >= 40 ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/40' :
                     'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40';

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.05,
      },
    },
  };

  const compactContent = (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)' }}
      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 hover:shadow-md cursor-pointer border border-gray-100 dark:border-slate-700 transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">{job.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>
            </div>
            <span className={`px-2 py-1 rounded text-sm font-medium ${scoreColor}`}>
              {scorePercent}%
            </span>
          </div>
    </motion.div>
  );

  return (
    <Link href={`/jobs/${job._id}`}>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(0, 0, 0, 0.15)' }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg cursor-pointer border border-gray-100 dark:border-slate-700 transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {job.title}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 font-medium">{job.company}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${scoreColor}`}>
              {scorePercent}%
            </span>
            {trackedJob && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  TRACKING_STATUS_COLORS[trackedJob.status as TrackingStatus].bg
                } ${TRACKING_STATUS_COLORS[trackedJob.status as TrackingStatus].text}`}
                title="This job is being tracked"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {TRACKING_STATUS_LABELS[trackedJob.status as TrackingStatus]}
              </span>
            )}
          </div>
        </div>

        {/* Location & Time */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location || 'Location not specified'}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDistanceToNow(job.postedAt)}
          </span>
          <span className="text-gray-400 dark:text-gray-500">•</span>
          <span className="capitalize">{job.source}</span>
        </div>

        {/* Description Preview */}
        {job.description && (
          <p
            className="job-description text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                +{job.skills.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {job.workFromHome && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-md">
              🏠 Remote
            </span>
          )}
          {job.salary && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-md">
              💰 {job.salary}
            </span>
          )}
          {job.scheduleType && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
              {job.scheduleType}
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default JobCard;
