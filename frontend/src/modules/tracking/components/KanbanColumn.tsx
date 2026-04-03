/**
 * Kanban Column Component
 * Column for job tracking Kanban board
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
  return (
    <div
      className="flex flex-col h-full"
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
    >
      {/* Column Header */}
      <div
        className={`${TRACKING_STATUS_COLORS[status].bg} ${TRACKING_STATUS_COLORS[status].border} border rounded-t-lg p-3 sticky top-0 z-10`}
      >
        <h3
          className={`text-sm font-semibold ${TRACKING_STATUS_COLORS[status].text} flex items-center justify-between`}
        >
          <span>{TRACKING_STATUS_LABELS[status]}</span>
          <span className="text-xs">{jobs.length}</span>
        </h3>
      </div>

      {/* Column Content */}
      <div className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-b-lg p-2 min-h-[200px] border border-t-0 border-gray-200 dark:border-slate-700">
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

          {jobs.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
              Drop jobs here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
