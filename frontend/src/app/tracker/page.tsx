/**
 * Tracker Page
 * Application tracking and management (requires authentication)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/auth/LoginModal';
import SignupModal from '@/components/auth/SignupModal';
import { useAppDispatch, useAppSelector } from '@/modules/common/hooks/useRedux';
import {
  fetchTrackedJobs,
  updateTracking,
  removeTrackedJob,
  fetchAnalytics,
  clearError,
  updateTrackingStatusLocally,
  updateTrackingLocally,
} from '@/modules/tracking/store/trackingSlice';
import {
  TrackedJob,
  TrackingStatus,
  TRACKING_STATUS_LABELS,
  TRACKING_STATUS_COLORS,
} from '@/modules/tracking/types';
import { KanbanColumn } from '@/modules/tracking/components/KanbanColumn';
import { JobDetailsModal } from '@/modules/tracking/components/JobDetailsModal';

const KANBAN_COLUMNS: TrackingStatus[] = [
  'saved',
  'applied',
  'phone-screen',
  'interview',
  'offer',
  'rejected',
];

export default function TrackerPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const dispatch = useAppDispatch();
  
  const { trackedJobs, analytics, isLoading, error, pagination } = useAppSelector(
    (state: any) => state.tracking
  );

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [prefillDemo, setPrefillDemo] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedJob, setDraggedJob] = useState<TrackedJob | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Fixed at 20 items per page for list view

  // Derive selectedJob from Redux state so it stays in sync with updates
  const selectedJob = selectedJobId 
    ? trackedJobs.find((job: TrackedJob) => job._id === selectedJobId) || null 
    : null;

  // Fetch tracked jobs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch with pagination only for list view
      const params = viewMode === 'list' 
        ? { page: currentPage, limit: itemsPerPage }
        : undefined;
      dispatch(fetchTrackedJobs(params) as any);
      dispatch(fetchAnalytics() as any);
    }
  }, [isAuthenticated, viewMode, currentPage, itemsPerPage, dispatch]);

  // Reset to page 1 when switching views
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Group jobs by status
  const jobsByStatus = KANBAN_COLUMNS.reduce((acc, status) => {
    acc[status] = trackedJobs.filter((job: TrackedJob) => job.status === status);
    return acc;
  }, {} as Record<TrackingStatus, TrackedJob[]>);

  // Calculate counts locally from trackedJobs for immediate UI updates
  const jobCountByStatus = KANBAN_COLUMNS.reduce((acc, status) => {
    acc[status] = jobsByStatus[status].length;
    return acc;
  }, {} as Record<TrackingStatus, number>);

  // Handle drag and drop
  const handleDragStart = (job: TrackedJob) => {
    setDraggedJob(job);
  };

  const handleDragEnd = () => {
    setDraggedJob(null);
  };

  const handleDrop = async (status: TrackingStatus) => {
    if (draggedJob && draggedJob.status !== status) {
      // Optimistic update - update UI immediately
      dispatch(updateTrackingStatusLocally({ trackingId: draggedJob._id, status }));
      
      // Then sync with backend
      dispatch(
        updateTracking({
          trackingId: draggedJob._id,
          data: { status, statusChangeNotes: `Changed to ${TRACKING_STATUS_LABELS[status]}` },
        }) as any
      );
    }
    setDraggedJob(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleJobClick = (job: TrackedJob) => {
    setSelectedJobId(job._id);
    setShowJobDetails(true);
  };

  const handleDeleteJob = async (trackingId: string) => {
    if (confirm('Are you sure you want to remove this job from tracking?')) {
      await dispatch(removeTrackedJob(trackingId) as any);
      setShowJobDetails(false);
      setSelectedJobId(null);
    }
  };

  // If authenticated, show tracker content
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  Application Tracker
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage your job applications in one place
                </p>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📊 Kanban
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📋 List
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            {trackedJobs.length > 0 && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {KANBAN_COLUMNS.map((status) => (
                  <div
                    key={status}
                    className={`${TRACKING_STATUS_COLORS[status].bg} ${TRACKING_STATUS_COLORS[status].border} border rounded-lg p-4`}
                  >
                    <div className={`text-2xl font-bold ${TRACKING_STATUS_COLORS[status].text}`}>
                      {jobCountByStatus[status]}
                    </div>
                    <div className={`text-sm ${TRACKING_STATUS_COLORS[status].text}`}>
                      {TRACKING_STATUS_LABELS[status]}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {/* Kanban View */}
          {!isLoading && viewMode === 'kanban' && (
            <div className="space-y-3">
              {/* Responsive container: horizontal scroll on mobile/tablet, grid on desktop */}
              <div className="lg:hidden">
                {/* Mobile/Tablet: Horizontal scroll */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                  {KANBAN_COLUMNS.map((status) => (
                    <div key={status} className="flex-shrink-0 w-72 snap-center">
                      <KanbanColumn
                        status={status}
                        jobs={jobsByStatus[status]}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onJobClick={handleJobClick}
                        isDraggingOver={draggedJob?.status !== status}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Scroll indicator dots */}
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <div className="flex gap-1">
                      {KANBAN_COLUMNS.map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                      ))}
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Desktop: Grid layout */}
              <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {KANBAN_COLUMNS.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    jobs={jobsByStatus[status]}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onJobClick={handleJobClick}
                    isDraggingOver={draggedJob?.status !== status}
                  />
                ))}
              </div>
            </div>
          )}

          {/* List View */}
          {!isLoading && viewMode === 'list' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700">
              <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {trackedJobs.map((job: TrackedJob) => (
                      <tr
                        key={job._id}
                        onClick={() => handleJobClick(job)}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {job.jobSnapshot.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {job.jobSnapshot.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {job.jobSnapshot.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              TRACKING_STATUS_COLORS[job.status as TrackingStatus].bg
                            } ${TRACKING_STATUS_COLORS[job.status as TrackingStatus].text}`}
                          >
                            {TRACKING_STATUS_LABELS[job.status as TrackingStatus]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {job.appliedAt
                            ? new Date(job.appliedAt).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {'⭐'.repeat(job.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJob(job._id);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalCount)} of {pagination.totalCount} applications
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!pagination.hasPrevPage}
                      className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        // Show first page, last page, current page and adjacent pages
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && trackedJobs.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-slate-700">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No applications tracked yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start tracking jobs by clicking &quot;Track this Job&quot; on any job listing
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Jobs
              </a>
            </div>
          )}
        </div>

        {/* Job Details Modal */}
        <AnimatePresence>
          {showJobDetails && selectedJob && (
            <JobDetailsModal
              job={selectedJob}
              onClose={() => {
                setShowJobDetails(false);
                setSelectedJobId(null);
              }}
              onDelete={handleDeleteJob}
              onUpdate={(data) => {
                // Optimistic update for immediate UI feedback
                dispatch(updateTrackingLocally({ trackingId: selectedJob._id, updates: data }));
                
                // Then sync with backend
                dispatch(
                  updateTracking({
                    trackingId: selectedJob._id,
                    data,
                  }) as any
                );
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Loading state - but keep modals rendered
  if (authLoading && !showLoginModal && !showSignupModal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated - show lock screen
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const lockVariants = {
    locked: { scale: 1, rotate: 0 },
    shake: {
      rotate: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
  };

  const features = [
    {
      icon: '📊',
      title: 'Track Applications',
      description: 'Monitor your job applications from applied to offer',
    },
    {
      icon: '📝',
      title: 'Add Notes',
      description: 'Keep detailed notes for each application',
    },
    {
      icon: '📈',
      title: 'View Analytics',
      description: 'Track your application success rate',
    },
    {
      icon: '🎯',
      title: 'Organize Pipeline',
      description: 'Manage stages: Applied, Interview, Offer',
    },
    {
      icon: '🔄',
      title: 'Sync Everywhere',
      description: 'Access your tracker from any device',
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
              variants={lockVariants}
              initial="locked"
              whileHover="shake"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </motion.div>
            
            {/* Title & Description */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Application Tracker
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your job applications from applied to offer
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg"
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

      {/* Modals */}
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
