/**
 * Tracking Redux Store
 * State management for job application tracking
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  TrackedJob,
  TrackJobRequest,
  UpdateTrackingRequest,
  AddInterviewRequest,
  AddContactRequest,
  TrackingAnalytics,
  TrackingStatus,
} from '../types';
import { trackingService } from '../services/trackingService';
import {
  saveTrackedJobs,
  getTrackedJobsFromDB,
  saveTrackedJob,
  deleteTrackedJobFromDB,
  addPendingAction,
  syncPendingActions,
  updateLastSync,
} from '../services/trackingOfflineService';

interface TrackingState {
  trackedJobs: TrackedJob[];
  trackedJobIds: string[]; // Quick lookup array of tracked jobIds
  currentTracking: TrackedJob | null;
  analytics: TrackingAnalytics | null;
  isLoading: boolean;
  isTracking: boolean;
  isUpdating: boolean;
  isDeletingId: string | null;
  error: string | null;
  lastSync: number | null;
  isOffline: boolean;
}

const initialState: TrackingState = {
  trackedJobs: [],
  trackedJobIds: [],
  currentTracking: null,
  analytics: null,
  isLoading: false,
  isTracking: false,
  isUpdating: false,
  isDeletingId: null,
  error: null,
  lastSync: null,
  isOffline: false,
};

// Async thunks
export const fetchTrackedJobs = createAsyncThunk(
  'tracking/fetchTrackedJobs',
  async (params: { status?: TrackingStatus; sortBy?: string; order?: 'asc' | 'desc' } | undefined, { rejectWithValue }) => {
    try {
      const response = await trackingService.getTrackedJobs(params);
      const jobs = response.data || [];
      
      // Save to offline storage
      await saveTrackedJobs(jobs);
      updateLastSync();
      
      return jobs;
    } catch (error: any) {
      // If offline, load from IndexedDB
      if (!navigator.onLine) {
        const offlineJobs = await getTrackedJobsFromDB();
        return offlineJobs;
      }
      return rejectWithValue(error.message);
    }
  }
);

export const trackNewJob = createAsyncThunk(
  'tracking/trackNewJob',
  async (data: TrackJobRequest, { rejectWithValue }) => {
    try {
      const response = await trackingService.trackJob(data);
      const tracking = response.data?.tracking;
      
      // Save to offline storage
      if (tracking) {
        await saveTrackedJob(tracking);
      }
      updateLastSync();
      
      return tracking;
    } catch (error: any) {
      // If offline, queue the action
      if (!navigator.onLine) {
        await addPendingAction({
          type: 'track',
          data,
          timestamp: Date.now(),
          retryCount: 0,
        });
        return rejectWithValue('Offline: Action queued for sync');
      }
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTrackedJob = createAsyncThunk(
  'tracking/fetchTrackedJob',
  async (trackingId: string) => {
    const response = await trackingService.getTrackedJob(trackingId);
    return response.data;
  }
);

export const updateTracking = createAsyncThunk(
  'tracking/updateTracking',
  async ({ trackingId, data }: { trackingId: string; data: UpdateTrackingRequest }, { rejectWithValue }) => {
    try {
      const response = await trackingService.updateTrackedJob(trackingId, data);
      const tracking = response.data;
      
      // Save to offline storage
      if (tracking) {
        await saveTrackedJob(tracking);
      }
      updateLastSync();
      
      return tracking;
    } catch (error: any) {
      // If offline, queue the action and update locally
      if (!navigator.onLine) {
        await addPendingAction({
          type: 'update',
          trackingId,
          data,
          timestamp: Date.now(),
          retryCount: 0,
        });
        return rejectWithValue('Offline: Action queued for sync');
      }
      return rejectWithValue(error.message);
    }
  }
);

export const addInterviewToTracking = createAsyncThunk(
  'tracking/addInterview',
  async ({ trackingId, data }: { trackingId: string; data: AddInterviewRequest }) => {
    const response = await trackingService.addInterview(trackingId, data);
    return response.data;
  }
);

export const addContactToTracking = createAsyncThunk(
  'tracking/addContact',
  async ({ trackingId, data }: { trackingId: string; data: AddContactRequest }) => {
    const response = await trackingService.addContact(trackingId, data);
    return response.data;
  }
);

export const removeTrackedJob = createAsyncThunk(
  'tracking/removeTrackedJob',
  async (trackingId: string, { rejectWithValue }) => {
    try {
      await trackingService.deleteTrackedJob(trackingId);
      
      // Delete from offline storage
      await deleteTrackedJobFromDB(trackingId);
      updateLastSync();
      
      return trackingId;
    } catch (error: any) {
      // If offline, queue the action
      if (!navigator.onLine) {
        await addPendingAction({
          type: 'delete',
          trackingId,
          timestamp: Date.now(),
          retryCount: 0,
        });
        await deleteTrackedJobFromDB(trackingId);
        return trackingId;
      }
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'tracking/fetchAnalytics',
  async () => {
    const response = await trackingService.getTrackingAnalytics();
    return response.data;
  }
);

export const checkJobTrackingStatus = createAsyncThunk(
  'tracking/checkJobTracking',
  async (jobId: string) => {
    const response = await trackingService.checkJobTracking(jobId);
    return { jobId, ...response.data };
  }
);

// Sync pending actions
export const syncOfflineActions = createAsyncThunk(
  'tracking/syncOfflineActions',
  async (_, { dispatch }) => {
    const successfulIds = await syncPendingActions(
      (data) => trackingService.trackJob(data),
      (trackingId, data) => trackingService.updateTrackedJob(trackingId, data),
      (trackingId) => trackingService.deleteTrackedJob(trackingId)
    );
    
    // Refresh tracked jobs after sync
    if (successfulIds.length > 0) {
      await dispatch(fetchTrackedJobs());
    }
    
    return successfulIds.length;
  }
);

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTracking: (state) => {
      state.currentTracking = null;
    },
    // Optimistic update for status change
    updateTrackingStatusLocally: (state, action: PayloadAction<{ trackingId: string; status: TrackingStatus }>) => {
      const tracking = state.trackedJobs.find(t => t._id === action.payload.trackingId);
      if (tracking) {
        tracking.status = action.payload.status;
        tracking.updatedAt = new Date().toISOString();
      }
      if (state.currentTracking && state.currentTracking._id === action.payload.trackingId) {
        state.currentTracking.status = action.payload.status;
        state.currentTracking.updatedAt = new Date().toISOString();
      }
    },
    // Optimistic update for any tracking fields
    updateTrackingLocally: (state, action: PayloadAction<{ trackingId: string; updates: Partial<TrackedJob> }>) => {
      const { trackingId, updates } = action.payload;
      const tracking = state.trackedJobs.find(t => t._id === trackingId);
      if (tracking) {
        Object.assign(tracking, updates, { updatedAt: new Date().toISOString() });
      }
      if (state.currentTracking && state.currentTracking._id === trackingId) {
        Object.assign(state.currentTracking, updates, { updatedAt: new Date().toISOString() });
      }
    },
    // Local sync timestamp
    updateSyncTimestamp: (state) => {
      state.lastSync = Date.now();
    },
    // Set offline status
    setOfflineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch tracked jobs
    builder
      .addCase(fetchTrackedJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrackedJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trackedJobs = action.payload;
        // Build trackedJobIds for quick lookup
        state.trackedJobIds = action.payload
          .filter((job: TrackedJob) => job.jobId)
          .map((job: TrackedJob) => job.jobId as string);
        state.lastSync = Date.now();
      })
      .addCase(fetchTrackedJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tracked jobs';
      });

    // Track new job
    builder
      .addCase(trackNewJob.pending, (state) => {
        state.isTracking = true;
        state.error = null;
      })
      .addCase(trackNewJob.fulfilled, (state, action) => {
        state.isTracking = false;
        if (action.payload) {
          state.trackedJobs.unshift(action.payload);
          // Add to tracked job IDs
          if (action.payload.jobId) {
            state.trackedJobIds.push(action.payload.jobId as string);
          }
        }
      })
      .addCase(trackNewJob.rejected, (state, action) => {
        state.isTracking = false;
        state.error = action.error.message || 'Failed to track job';
      });

    // Fetch single tracked job
    builder
      .addCase(fetchTrackedJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrackedJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTracking = action.payload || null;
      })
      .addCase(fetchTrackedJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tracked job';
      });

    // Update tracking
    builder
      .addCase(updateTracking.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateTracking.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (action.payload) {
          const index = state.trackedJobs.findIndex(t => t._id === action.payload!._id);
          if (index !== -1) {
            state.trackedJobs[index] = action.payload;
          }
          if (state.currentTracking && state.currentTracking._id === action.payload._id) {
            state.currentTracking = action.payload;
          }
        }
      })
      .addCase(updateTracking.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error.message || 'Failed to update tracking';
      });

    // Add interview
    builder
      .addCase(addInterviewToTracking.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.trackedJobs.findIndex(t => t._id === action.payload!._id);
          if (index !== -1) {
            state.trackedJobs[index] = action.payload;
          }
          if (state.currentTracking && state.currentTracking._id === action.payload._id) {
            state.currentTracking = action.payload;
          }
        }
      });

    // Add contact
    builder
      .addCase(addContactToTracking.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.trackedJobs.findIndex(t => t._id === action.payload!._id);
          if (index !== -1) {
            state.trackedJobs[index] = action.payload;
          }
          if (state.currentTracking && state.currentTracking._id === action.payload._id) {
            state.currentTracking = action.payload;
          }
        }
      });

    // Remove tracked job
    builder
      .addCase(removeTrackedJob.pending, (state, action) => {
        state.isDeletingId = action.meta.arg;
        const removedJob = state.trackedJobs.find(t => t._id === action.payload);
        state.trackedJobs = state.trackedJobs.filter(t => t._id !== action.payload);
        // Remove from tracked job IDs
        if (removedJob?.jobId) {
          state.trackedJobIds = state.trackedJobIds.filter(id => id !== removedJob.jobId);
        }
      })
      .addCase(removeTrackedJob.fulfilled, (state, action) => {
        state.isDeletingId = null;
        state.trackedJobs = state.trackedJobs.filter(t => t._id !== action.payload);
        if (state.currentTracking && state.currentTracking._id === action.payload) {
          state.currentTracking = null;
        }
      })
      .addCase(removeTrackedJob.rejected, (state, action) => {
        state.isDeletingId = null;
        state.error = action.error.message || 'Failed to delete tracked job';
      });

    // Fetch analytics
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload || null;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch analytics';
      });
  },
});

export const {
  setOfflineStatus,
  clearError,
  clearCurrentTracking,
  updateTrackingStatusLocally,
  updateTrackingLocally,
  updateSyncTimestamp,
} = trackingSlice.actions;

export default trackingSlice.reducer;
