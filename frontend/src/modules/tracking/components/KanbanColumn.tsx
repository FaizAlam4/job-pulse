/**
 * Kanban Column Component
 * Column for job tracking Kanban board with virtualization for large lists
 */

'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import {
  TrackedJob,
  TrackingStatus,
  TRACKING_STATUS_LABELS,
  TRACKING_STATUS_COLORS,
} from '@/modules/tracking/types';

interface KanbanColumnProps {
  status: TrackingStatus;
  jobs: TrackedJob[];
  onDragStart: (job: TrackedJob) => void;
  onDragEnd: () => void;
  onDrop: (status: TrackingStatus) => void;
  onDragOver: (e: React.DragEvent) => void;
  onJobClick: (job: TrackedJob) => void;
  isDraggingOver: boolean;
}

// Job card component for virtualization
const JobCard: React.FC<{
  job: TrackedJob;
  onDragStart: (job: TrackedJob) => void;
  onDragEnd: () => void;
  onJobClick: (job: TrackedJob) => void;
}> = ({ job, onDragStart, onDragEnd, onJobClick }) => (
  <div
    draggable
    onDragStart={() => onDragStart(job)}
    onDragEnd={onDragEnd}
    onClick={() => onJobClick(job)}
    className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-slate-700 cursor-move hover:shadow-md transition-shadow mb-2"
  >
    {/* Priority Stars */}
    {job.priority > 3 && (
      <div className="text-xs text-yellow-500 mb-1">
        {'⭐'.repeat(job.priority - 3)}
      </div>
    )}

    {/* Job Title */}
    <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
      {job.jobSnapshot.title}
    </h4>

    {/* Company */}
    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
      {job.jobSnapshot.company}
    </p>

    {/* Location */}
    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 flex items-center gap-1">
      <span>📍</span>
      <span className="truncate">{job.jobSnapshot.location}</span>
    </p>

    {/* Metadata */}
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
      {job.appliedAt && (
        <span>{new Date(job.appliedAt).toLocaleDateString()}</span>
      )}
      {job.interviews.length > 0 && (
        <span className="flex items-center gap-1">
          🗓️ {job.interviews.length}
        </span>
      )}
      {job.notes && <span>📝</span>}
    </div>
  </div>
);

// Threshold for when to switch to virtualization
const VIRTUALIZATION_THRESHOLD = 20;

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  jobs,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onJobClick,
  isDraggingOver,
}) => {
  // Use virtualization only when there are many items
  const useVirtualization = jobs.length > VIRTUALIZATION_THRESHOLD;

  const renderJobCard = useCallback(
    (index: number) => (
      <JobCard
        key={jobs[index]._id}
        job={jobs[index]}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onJobClick={onJobClick}
      />
    ),
    [jobs, onDragStart, onDragEnd, onJobClick]
  );

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
    >
      {/* Column Header */}
      <div
        className={`${TRACKING_STATUS_COLORS[status].bg} ${TRACKING_STATUS_COLORS[status].border} border rounded-t-lg p-3 flex-shrink-0`}
      >
        <h3
          className={`text-sm font-semibold ${TRACKING_STATUS_COLORS[status].text} flex items-center justify-between`}
        >
          <span>{TRACKING_STATUS_LABELS[status]}</span>
          <span className="text-xs">{jobs.length}</span>
        </h3>
      </div>

      {/* Column Content - Scrollable */}
      <div
        className={`flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-b-lg p-2 border border-t-0 border-gray-200 dark:border-slate-700 overflow-hidden ${
          isDraggingOver ? 'ring-2 ring-blue-400 ring-inset' : ''
        }`}
      >
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm">
            Drop jobs here
          </div>
        ) : useVirtualization ? (
          /* Virtualized list for many items */
          <Virtuoso
            style={{ height: '100%' }}
            totalCount={jobs.length}
            itemContent={renderJobCard}
            overscan={5}
            className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
          />
        ) : (
          /* Regular list for fewer items */
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
            <div className="space-y-2">
              {jobs.map((job) => (
                <motion.div
                  key={job._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  draggable
                  onDragStart={() => onDragStart(job)}
                  onDragEnd={onDragEnd}
                  onClick={() => onJobClick(job)}
                  className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-slate-700 cursor-move hover:shadow-md transition-shadow"
                >
                  {/* Priority Stars */}
                  {job.priority > 3 && (
                    <div className="text-xs text-yellow-500 mb-1">
                      {'⭐'.repeat(job.priority - 3)}
                    </div>
                  )}

                  {/* Job Title */}
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {job.jobSnapshot.title}
                  </h4>

                  {/* Company */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {job.jobSnapshot.company}
                  </p>

                  {/* Location */}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{job.jobSnapshot.location}</span>
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    {job.appliedAt && (
                      <span>{new Date(job.appliedAt).toLocaleDateString()}</span>
                    )}
                    {job.interviews.length > 0 && (
                      <span className="flex items-center gap-1">
                        🗓️ {job.interviews.length}
                      </span>
                    )}
                    {job.notes && <span>📝</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
