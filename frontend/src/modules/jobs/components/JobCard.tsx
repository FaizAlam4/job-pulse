/**
 * JobCard Component
 * Displays individual job listing
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Job } from '@/modules/jobs/types';
import { formatDistanceToNow } from '@/modules/common/utils/dateUtils';

interface JobCardProps {
  job: Job;
  variant?: 'default' | 'compact';
}

// Convert 0-1 score to percentage
const toPercentage = (score: number): number => {
  return Math.round(score <= 1 ? score * 100 : score);
};

export const JobCard: React.FC<JobCardProps> = ({ job, variant = 'default' }) => {
  const scorePercent = toPercentage(job.score);
  const scoreColor = scorePercent >= 70 ? 'text-green-600 bg-green-100' :
                     scorePercent >= 40 ? 'text-yellow-600 bg-yellow-100' :
                     'text-red-600 bg-red-100';

  if (variant === 'compact') {
    return (
      <Link href={`/jobs/${job._id}`}>
        <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.company}</p>
            </div>
            <span className={`px-2 py-1 rounded text-sm font-medium ${scoreColor}`}>
              {scorePercent}%
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/jobs/${job._id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-gray-700 font-medium">{job.company}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${scoreColor}`}>
            {scorePercent}%
          </span>
        </div>

        {/* Location & Time */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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
          <span className="text-gray-400">•</span>
          <span className="capitalize">{job.source}</span>
        </div>

        {/* Description Preview */}
        {job.description && (
          // If job.description contains HTML, render it as HTML. If not, render as plain text.
          // WARNING: Only use dangerouslySetInnerHTML if the HTML is trusted or sanitized to prevent XSS.
          <p
            className="text-gray-600 text-sm mb-4 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="px-2 py-1 text-gray-500 text-xs">
                +{job.skills.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {job.workFromHome && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">
              🏠 Remote
            </span>
          )}
          {job.salary && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
              💰 {job.salary}
            </span>
          )}
          {job.scheduleType && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
              {job.scheduleType}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
