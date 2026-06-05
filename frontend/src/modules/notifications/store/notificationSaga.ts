import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchNotificationsRequest,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  fetchUnreadCountSuccess,
  markAllReadRequest,
  markAllReadSuccess,
  markAllReadFailure,
} from './notificationSlice';

import { smartGet } from '@/services/apiClient';

function fetchNotificationsApi(page = 1, limit = 10): Promise<any> {
  return smartGet(`/notifications?page=${page}&limit=${limit}`).then(res => res.data);
}

function fetchUnreadCountApi(): Promise<any> {
  return smartGet('/notifications/unread-count').then(res => res.data);
}

function markAllReadApi(): Promise<any> {
  // use fetch directly since smartGet only does GET
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return fetch(`${baseUrl}/notifications/mark-all-read`, { method: 'PATCH' });
}

function* fetchNotificationsSaga(action: any): any {
  try {
    const page = action.payload?.page || 1;
    const limit = action.payload?.limit || 10;
    const data = yield call(fetchNotificationsApi, page, limit);
    yield put(fetchNotificationsSuccess({
      items: data.items,
      page: data.page,
      totalPages: data.totalPages,
    }));
  } catch (error: any) {
    yield put(fetchNotificationsFailure(error.message || 'Unknown error'));
  }
}

function* fetchUnreadCountSaga(): any {
  try {
    const data = yield call(fetchUnreadCountApi);
    yield put(fetchUnreadCountSuccess(data.count ?? 0));
  } catch (_) {
    // Silent — unread count is best-effort
  }
}

function* markAllReadSaga(): any {
  try {
    yield call(markAllReadApi);
    yield put(markAllReadSuccess());
  } catch (error: any) {
    yield put(markAllReadFailure(error.message || 'Unknown error'));
  }
}

export function* notificationSaga() {
  yield takeLatest(fetchNotificationsRequest.type, fetchNotificationsSaga);
  yield takeLatest('notifications/fetchUnreadCount', fetchUnreadCountSaga);
  yield takeLatest(markAllReadRequest.type, markAllReadSaga);
}
