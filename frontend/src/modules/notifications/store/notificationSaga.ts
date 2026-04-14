import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchNotificationsRequest,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
} from './notificationSlice';
import { Notification } from '../types';



import { smartGet } from '@/services/apiClient';

function fetchNotificationsApi(page = 1, limit = 20): Promise<any> {
  const url = `/notifications?page=${page}&limit=${limit}`;
  return smartGet(url).then(res => res.data);
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
