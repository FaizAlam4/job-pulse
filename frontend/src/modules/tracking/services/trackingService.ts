/**
 * Tracking Service
 * API calls for job application tracking
 */

import apiClient from '@/services/apiClient';
import {
  TrackedJob,
  TrackJobRequest,
  UpdateTrackingRequest,
  AddInterviewRequest,
  AddContactRequest,
  TrackingAnalytics,
  TrackingResponse,
} from '../types';

const TRACKING_ENDPOINT = '/tracking';

/**
 * Track a new job
 */
export const trackJob = async (data: TrackJobRequest): Promise<TrackingResponse<{ trackingId: string; tracking: TrackedJob }>> => {
  const response = await apiClient.post(TRACKING_ENDPOINT, data);
  return response.data;
};

/**
 * Get all tracked jobs
 */
export const getTrackedJobs = async (params?: {
  status?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}): Promise<TrackingResponse<TrackedJob[]>> => {
  const response = await apiClient.get(TRACKING_ENDPOINT, { params });
  return response.data;
};

/**
 * Get single tracked job
 */
export const getTrackedJob = async (trackingId: string): Promise<TrackingResponse<TrackedJob>> => {
  const response = await apiClient.get(`${TRACKING_ENDPOINT}/${trackingId}`);
  return response.data;
};

/**
 * Update tracked job
 */
export const updateTrackedJob = async (
  trackingId: string,
  data: UpdateTrackingRequest
): Promise<TrackingResponse<TrackedJob>> => {
  const response = await apiClient.patch(`${TRACKING_ENDPOINT}/${trackingId}`, data);
  return response.data;
};

/**
 * Add interview to tracked job
 */
export const addInterview = async (
  trackingId: string,
  data: AddInterviewRequest
): Promise<TrackingResponse<TrackedJob>> => {
  const response = await apiClient.post(`${TRACKING_ENDPOINT}/${trackingId}/interviews`, data);
  return response.data;
};

/**
 * Add contact to tracked job
 */
export const addContact = async (
  trackingId: string,
  data: AddContactRequest
): Promise<TrackingResponse<TrackedJob>> => {
  const response = await apiClient.post(`${TRACKING_ENDPOINT}/${trackingId}/contacts`, data);
  return response.data;
};

/**
 * Delete tracked job
 */
export const deleteTrackedJob = async (trackingId: string): Promise<TrackingResponse> => {
  const response = await apiClient.delete(`${TRACKING_ENDPOINT}/${trackingId}`);
  return response.data;
};

/**
 * Get tracking analytics
 */
export const getTrackingAnalytics = async (): Promise<TrackingResponse<TrackingAnalytics>> => {
  const response = await apiClient.get(`${TRACKING_ENDPOINT}/analytics`);
  return response.data;
};

/**
 * Check if a job is being tracked
 */
export const checkJobTracking = async (jobId: string): Promise<TrackingResponse<{ isTracked: boolean; tracking: TrackedJob | null }>> => {
  const response = await apiClient.get(`${TRACKING_ENDPOINT}/check/${jobId}`);
  return response.data;
};

// Export all services
export const trackingService = {
  trackJob,
  getTrackedJobs,
  getTrackedJob,
  updateTrackedJob,
  addInterview,
  addContact,
  deleteTrackedJob,
  getTrackingAnalytics,
  checkJobTracking,
};
