import { createSlice } from '@reduxjs/toolkit';
import { Notification } from '../types';


export interface NotificationPagination {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface NotificationState {
  items: Notification[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
  unreadCount: number;       // badge number on the bell
  markingRead: boolean;      // optimistic UI while PATCH is in-flight
}

const initialState: NotificationState = {
  items: [],
  loading: false,
  error: null,
  page: 1,
  totalPages: 1,
  hasMore: false,
  unreadCount: 0,
  markingRead: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    fetchNotificationsRequest(state, action) {
      state.loading = true;
      state.error = null;
      if (!action.payload || action.payload.page === 1) {
        state.items = [];
        state.page = 1;
      }
    },
    fetchNotificationsSuccess(state, action) {
      state.loading = false;
      const { items, page, totalPages } = action.payload;
      if (page === 1) {
        state.items = items;
      } else {
        state.items = [...state.items, ...items];
      }
      state.page = page;
      state.totalPages = totalPages;
      state.hasMore = page < totalPages;
    },
    fetchNotificationsFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    clearNotifications(state) {
      state.items = [];
      state.error = null;
      state.page = 1;
      state.totalPages = 1;
      state.hasMore = false;
    },

    // Unread count — fetched from API on mount and updated by SSE
    fetchUnreadCountSuccess(state, action) {
      state.unreadCount = action.payload;
    },
    // SSE pushed a new-jobs event: increment badge by the count in the event
    newJobsReceived(state, action: { payload: number }) {
      state.unreadCount += action.payload;
    },

    // Mark all read — optimistic: zero the badge immediately, PATCH in background
    markAllReadRequest(state) {
      state.markingRead = true;
      state.unreadCount = 0;
      // Also mark items already in state as read
      state.items = state.items.map(n => ({ ...n, isRead: true }));
    },
    markAllReadSuccess(state) {
      state.markingRead = false;
    },
    markAllReadFailure(state, action) {
      state.markingRead = false;
      // Could restore count here but a refetch on next open is fine
      console.error('mark all read failed', action.payload);
    },
  },
});


export const {
  fetchNotificationsRequest,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  clearNotifications,
  fetchUnreadCountSuccess,
  newJobsReceived,
  markAllReadRequest,
  markAllReadSuccess,
  markAllReadFailure,
} = notificationSlice.actions;

export default notificationSlice.reducer;
