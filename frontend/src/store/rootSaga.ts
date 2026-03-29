/**
 * Root Saga
 * Combines all module sagas
 */

import { all, fork } from 'redux-saga/effects';

import { jobsSaga } from '@/modules/jobs/store';
import { notificationSaga } from '@/modules/notifications/store/notificationSaga';

/**
 * Root saga that forks all module sagas
 */
export default function* rootSaga() {
  yield all([
    fork(jobsSaga),
    fork(notificationSaga),
    // Add more module sagas here as needed
    // fork(filtersSaga),
    // fork(authSaga),
  ]);
}
