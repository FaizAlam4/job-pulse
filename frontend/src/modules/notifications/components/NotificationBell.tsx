
import React, { useEffect, useState } from 'react';
// Simple skeleton loader for notifications
const NotificationSkeleton = () => (
  <div className="p-3 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2 mb-1" />
    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
  </div>
);
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchNotificationsRequest,
  markAllReadRequest,
} from '../store/notificationSlice';
import { RootState } from '@/store';
import { Notification } from '../types';

export const NotificationBell: React.FC = () => {
  const dispatch = useDispatch();
  const { items, loading, page, hasMore, unreadCount, markingRead } = useSelector(
    (state: RootState) => state.notifications
  );
  const [open, setOpen] = useState(false);

  // Fetch unread count on mount so the badge appears immediately on load
  useEffect(() => {
    dispatch({ type: 'notifications/fetchUnreadCount' });
  }, [dispatch]);

  const handleClick = () => {
    const opening = !open;
    setOpen(opening);
    if (opening) {
      dispatch(fetchNotificationsRequest({ page: 1 }));
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(markAllReadRequest());
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchNotificationsRequest({ page: page + 1 }));
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.notification-dropdown')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const bellVariants = {
    initial: { scale: 1 },
    tap: { scale: 0.95 },
    hover: { scale: 1.05 },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' as const } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1, x: 0,
      transition: { delay: i * 0.05, duration: 0.2 },
    }),
  };

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className="relative">
      <motion.button
        className="relative p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors notification-dropdown"
        aria-label="Show notifications"
        onClick={handleClick}
        suppressHydrationWarning
        variants={bellVariants}
        whileHover="hover"
        whileTap="tap"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            aria-label={`${unreadCount} unread notifications`}
          >
            {badgeLabel}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 mt-2 w-80 max-w-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 notification-dropdown"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                    {unreadCount} unread
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                <>
                  <NotificationSkeleton />
                  <NotificationSkeleton />
                  <NotificationSkeleton />
                </>
              ) : items.length === 0 ? (
                <motion.div
                  className="p-4 text-center text-gray-500 dark:text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  No notifications
                </motion.div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {items.map((n: Notification, i: number) => (
                      <motion.div
                        key={n._id}
                        className={`p-3 text-sm ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''} text-gray-800 dark:text-gray-200`}
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && (
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium mb-1">
                              {n.message}
                              <motion.span
                                className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                  n.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                  n.type === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                  n.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                }`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                {n.type}
                              </motion.span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {hasMore && (
                    <motion.button
                      className="w-full p-2 text-center text-blue-600 dark:text-blue-400 hover:underline bg-gray-50 dark:bg-slate-700"
                      onClick={handleLoadMore}
                      disabled={loading}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Load more
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
