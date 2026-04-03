/**
 * Tracking Offline Sync Service
 * Handles offline caching and sync for tracking data
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { TrackedJob, TrackJobRequest, UpdateTrackingRequest } from '../types';

interface TrackingDB extends DBSchema {
  trackedJobs: {
    key: string;
    value: TrackedJob;
    indexes: { 'by-status': string; 'by-updated': string };
  };
  pendingActions: {
    key: number;
    value: PendingAction;
    indexes: { 'by-timestamp': number };
  };
}

export interface PendingAction {
  id?: number;
  type: 'track' | 'update' | 'delete';
  trackingId?: string;
  data?: TrackJobRequest | UpdateTrackingRequest;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'job-pulse-tracking-db';
const DB_VERSION = 1;
let trackingDB: IDBPDatabase<TrackingDB> | null = null;

/**
 * Initialize Tracking IndexedDB
 */
export const initTrackingDB = async (): Promise<IDBPDatabase<TrackingDB>> => {
  if (trackingDB) return trackingDB;

  trackingDB = await openDB<TrackingDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tracked jobs store
      if (!db.objectStoreNames.contains('trackedJobs')) {
        const trackedStore = db.createObjectStore('trackedJobs', { keyPath: '_id' });
        trackedStore.createIndex('by-status', 'status');
        trackedStore.createIndex('by-updated', 'updatedAt');
      }

      // Pending actions store (for offline queue)
      if (!db.objectStoreNames.contains('pendingActions')) {
        const pendingStore = db.createObjectStore('pendingActions', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return trackingDB;
};

/**
 * Save tracked jobs to IndexedDB
 */
export const saveTrackedJobs = async (jobs: TrackedJob[]): Promise<void> => {
  const db = await initTrackingDB();
  const tx = db.transaction('trackedJobs', 'readwrite');

  for (const job of jobs) {
    await tx.store.put(job);
  }

  await tx.done;
  console.log(`💾 Saved ${jobs.length} tracked jobs to offline storage`);
};

/**
 * Get all tracked jobs from IndexedDB
 */
export const getTrackedJobsFromDB = async (): Promise<TrackedJob[]> => {
  const db = await initTrackingDB();
  const jobs = await db.getAll('trackedJobs');
  console.log(`📥 Retrieved ${jobs.length} tracked jobs from offline storage`);
  return jobs;
};

/**
 * Get single tracked job from IndexedDB
 */
export const getTrackedJobFromDB = async (trackingId: string): Promise<TrackedJob | undefined> => {
  const db = await initTrackingDB();
  return await db.get('trackedJobs', trackingId);
};

/**
 * Save single tracked job to IndexedDB
 */
export const saveTrackedJob = async (job: TrackedJob): Promise<void> => {
  const db = await initTrackingDB();
  await db.put('trackedJobs', job);
  console.log(`💾 Saved tracked job ${job._id} to offline storage`);
};

/**
 * Delete tracked job from IndexedDB
 */
export const deleteTrackedJobFromDB = async (trackingId: string): Promise<void> => {
  const db = await initTrackingDB();
  await db.delete('trackedJobs', trackingId);
  console.log(`🗑️ Deleted tracked job ${trackingId} from offline storage`);
};

/**
 * Add pending action to queue (for offline operations)
 */
export const addPendingAction = async (action: Omit<PendingAction, 'id'>): Promise<number> => {
  const db = await initTrackingDB();
  const id = await db.add('pendingActions', action as PendingAction);
  console.log(`📋 Added pending action #${id} to offline queue`);
  return id;
};

/**
 * Get all pending actions
 */
export const getPendingActions = async (): Promise<PendingAction[]> => {
  const db = await initTrackingDB();
  return await db.getAll('pendingActions');
};

/**
 * Delete pending action
 */
export const deletePendingAction = async (id: number): Promise<void> => {
  const db = await initTrackingDB();
  await db.delete('pendingActions', id);
  console.log(`✅ Removed pending action #${id} from queue`);
};

/**
 * Update pending action retry count
 */
export const updatePendingActionRetry = async (id: number): Promise<void> => {
  const db = await initTrackingDB();
  const action = await db.get('pendingActions', id);
  if (action) {
    action.retryCount += 1;
    await db.put('pendingActions', action);
  }
};

/**
 * Clear all offline data (useful for logout)
 */
export const clearTrackingOfflineData = async (): Promise<void> => {
  const db = await initTrackingDB();
  await db.clear('trackedJobs');
  await db.clear('pendingActions');
  console.log('🧹 Cleared all tracking offline data');
};

/**
 * Sync pending actions with server
 * Returns array of successful action IDs
 */
export const syncPendingActions = async (
  trackJobFn: (data: TrackJobRequest) => Promise<any>,
  updateTrackingFn: (trackingId: string, data: UpdateTrackingRequest) => Promise<any>,
  deleteTrackingFn: (trackingId: string) => Promise<any>
): Promise<number[]> => {
  const pendingActions = await getPendingActions();
  const successfulIds: number[] = [];

  console.log(`🔄 Syncing ${pendingActions.length} pending actions...`);

  for (const action of pendingActions) {
    try {
      switch (action.type) {
        case 'track':
          if (action.data) {
            await trackJobFn(action.data as TrackJobRequest);
          }
          break;
        case 'update':
          if (action.trackingId && action.data) {
            await updateTrackingFn(action.trackingId, action.data as UpdateTrackingRequest);
          }
          break;
        case 'delete':
          if (action.trackingId) {
            await deleteTrackingFn(action.trackingId);
          }
          break;
      }

      if (action.id) {
        successfulIds.push(action.id);
        await deletePendingAction(action.id);
      }
    } catch (error) {
      console.error(`Failed to sync action #${action.id}:`, error);
      if (action.id && action.retryCount < 3) {
        await updatePendingActionRetry(action.id);
      } else if (action.id) {
        // Delete after 3 failed retries
        await deletePendingAction(action.id);
      }
    }
  }

  console.log(`✅ Successfully synced ${successfulIds.length}/${pendingActions.length} actions`);
  return successfulIds;
};

/**
 * Get sync status
 */
export const getSyncStatus = async (): Promise<{
  trackedJobsCount: number;
  pendingActionsCount: number;
  lastSync: number | null;
}> => {
  const db = await initTrackingDB();
  const trackedJobs = await db.getAll('trackedJobs');
  const pendingActions = await db.getAll('pendingActions');
  
  // Get last sync timestamp from localStorage
  const lastSync = localStorage.getItem('tracking-last-sync');

  return {
    trackedJobsCount: trackedJobs.length,
    pendingActionsCount: pendingActions.length,
    lastSync: lastSync ? parseInt(lastSync) : null,
  };
};

/**
 * Update last sync timestamp
 */
export const updateLastSync = (): void => {
  localStorage.setItem('tracking-last-sync', Date.now().toString());
};

export const trackingOfflineService = {
  initTrackingDB,
  saveTrackedJobs,
  getTrackedJobsFromDB,
  getTrackedJobFromDB,
  saveTrackedJob,
  deleteTrackedJobFromDB,
  addPendingAction,
  getPendingActions,
  deletePendingAction,
  updatePendingActionRetry,
  clearTrackingOfflineData,
  syncPendingActions,
  getSyncStatus,
  updateLastSync,
};
