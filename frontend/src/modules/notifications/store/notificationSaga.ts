import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchNotificationsRequest,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
} from './notificationSlice';
import { Notification } from '../types';


function fetchNotificationsApi(page = 1, limit = 20): Promise<any> {
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/notifications?page=${page}&limit=${limit}`;
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    });
}

function* fetchNotificationsSaga(action: any): any {
  try {
    const page = action.payload?.page || 1;
    const limit = action.payload?.limit || 20;
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

export function* notificationSaga() {
  yield takeLatest(fetchNotificationsRequest.type, fetchNotificationsSaga);
}
