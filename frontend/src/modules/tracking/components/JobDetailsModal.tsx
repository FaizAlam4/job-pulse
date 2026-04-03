/**
 * Job Details Modal Component
 * Detailed view and editing for tracked jobs
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrackedJob,
  UpdateTrackingRequest,
  TrackingStatus,
  TRACKING_STATUS_LABELS,
  TRACKING_STATUS_COLORS,
  PRIORITY_LABELS,
} from '@/modules/tracking/types';

interface JobDetailsModalProps {
  job: TrackedJob;
  onClose: () => void;
  onDelete: (trackingId: string) => void;
  onUpdate: (data: UpdateTrackingRequest) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  onClose,
  onDelete,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(job.notes || '');
  const [editedStatus, setEditedStatus] = useState(job.status);
  const [editedPriority, setEditedPriority] = useState(job.priority);

  // Sync local state when job prop changes (e.g., after Redux update)
  useEffect(() => {
    setEditedNotes(job.notes || '');
    setEditedStatus(job.status);
    setEditedPriority(job.priority);
  }, [job.notes, job.status, job.priority]);

  const handleSave = () => {
    onUpdate({
      notes: editedNotes,
      status: editedStatus,
      priority: editedPriority,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 transition-opacity bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80"
          onClick={onClose}
        />

        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {job.jobSnapshot.title}
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {job.jobSnapshot.company}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                📍 {job.jobSnapshot.location}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status Bar */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  TRACKING_STATUS_COLORS[job.status].bg
                } ${TRACKING_STATUS_COLORS[job.status].text}`}
              >
                {TRACKING_STATUS_LABELS[job.status]}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Priority: {'⭐'.repeat(job.priority)}
              </span>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="flex px-6 -mb-px space-x-8">
              {['details', 'notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 300px)' }}>
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {isEditing && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value as TrackingStatus)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      >
                        {Object.entries(TRACKING_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value} className="text-sm">
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={editedPriority}
                        onChange={(e) => setEditedPriority(parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      >
                        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                          <option key={value} value={value} className="text-sm">
                            {label} {'⭐'.repeat(parseInt(value))}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                  <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {job.jobSnapshot.description || 'No description available'}
                    </p>
                  </div>
                </div>

                {job.jobSnapshot.sourceUrl && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Original Posting</h4>
                    <a
                      href={job.jobSnapshot.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View job posting →
                    </a>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Timeline</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Tracked:</span>{' '}
                      {new Date(job.trackedAt).toLocaleString()}
                    </p>
                    {job.appliedAt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Applied:</span>{' '}
                        {new Date(job.appliedAt).toLocaleString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Last Updated:</span>{' '}
                      {new Date(job.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {job.statusHistory && job.statusHistory.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Status History</h4>
                    <div className="space-y-2">
                      {job.statusHistory.map((entry, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {TRACKING_STATUS_LABELS[entry.status]}
                          </span>
                          {entry.notes && (
                            <span className="text-gray-600 dark:text-gray-400">- {entry.notes}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                {isEditing ? (
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add your notes here..."
                  />
                ) : (
                  <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {job.notes || 'No notes yet. Click Edit to add notes.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={() => onDelete(job._id)}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              Delete Tracking
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                Close
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
