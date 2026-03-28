/**
 * Root Saga
 * Combines all module sagas
 */

import { all, fork } from 'redux-saga/effects';
import { jobsSaga } from '@/modules/jobs/store';

/**
 * Root saga that forks all module sagas
 */
export default function* rootSaga() {
  yield all([
    fork(jobsSaga),
    // Add more module sagas here as needed
    // fork(filtersSaga),
    // fork(authSaga),
  ]);
}
