'use client';

import { useOnlineStatus, useServiceWorkerUpdate } from '@/modules/common/hooks/usePWA';
import { useEffect, useState } from 'react';

/**
 * Offline Indicator Component
 * Shows user when they're offline and when:
 * - New updates are available
 * - They're back online
 */
export const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { updateAvailable, handleUpdate } = useServiceWorkerUpdate();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!isOnline || updateAvailable || wasOffline) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        if (!updateAvailable) {
          setShowNotification(false);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, updateAvailable, wasOffline]);

  if (!showNotification) return null;

  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-3 z-50 animate-pulse">
        <div className="flex-1">
          <p className="font-semibold text-sm">Update available</p>
          <p className="text-xs opacity-90">New version of Job Pulse is ready</p>
        </div>
        <button
          onClick={handleUpdate}
          className="bg-white text-blue-500 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 transition"
        >
          Update
        </button>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-orange-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-2 z-50">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="flex-1">
          <p className="font-semibold text-sm">You're offline</p>
          <p className="text-xs opacity-90">Using cached data</p>
        </div>
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-2 z-50 animate-pulse">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div className="flex-1">
          <p className="font-semibold text-sm">Back online</p>
          <p className="text-xs opacity-90">Syncing latest data</p>
        </div>
      </div>
    );
  }

  return null;
};
