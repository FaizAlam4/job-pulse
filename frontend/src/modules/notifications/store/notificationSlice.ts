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
}

const initialState: NotificationState = {
  items: [],
  loading: false,
  error: null,
  page: 1,
  totalPages: 1,
  hasMore: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    fetchNotificationsRequest(state, action) {
      state.loading = true;
      state.error = null;
      // If page is 1, reset items
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
  },
});


export const {
  fetchNotificationsRequest,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
