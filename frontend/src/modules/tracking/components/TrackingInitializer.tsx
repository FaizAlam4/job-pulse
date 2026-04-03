/**
 * Tracking Initializer Component
 * Automatically fetches tracked jobs when user is authenticated
 * Should be placed inside both Redux Provider and AuthProvider
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/modules/common/hooks/useRedux';
import { fetchTrackedJobs } from '@/modules/tracking/store/trackingSlice';

export const TrackingInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const dispatch = useAppDispatch();
  const { trackedJobs, lastSync } = useAppSelector((state: any) => state.tracking);

  useEffect(() => {
    // Fetch tracked jobs when user is authenticated and we don't have data yet
    if (isAuthenticated && !isLoading) {
      // Only fetch if we don't have data or it's been more than 5 minutes since last sync
      const shouldFetch = trackedJobs.length === 0 || 
                          !lastSync || 
                          (Date.now() - lastSync > 5 * 60 * 1000);
      
      if (shouldFetch) {
        dispatch(fetchTrackedJobs() as any);
      }
    }
  }, [isAuthenticated, isLoading, dispatch]);

  return <>{children}</>;
};

export default TrackingInitializer;
