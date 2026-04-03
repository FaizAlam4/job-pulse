/**
 * Root Reducer
 * Combines all module reducers
 */

import { combineReducers } from '@reduxjs/toolkit';

import { jobsReducer } from '@/modules/jobs/store';
import { filtersReducer } from '@/modules/filters/store';
import notificationsReducer from '@/modules/notifications/store/notificationSlice';
import trackingReducer from '@/modules/tracking/store/trackingSlice';


const rootReducer = combineReducers({
  jobs: jobsReducer,
  filters: filtersReducer,
  notifications: notificationsReducer,
  tracking: trackingReducer,
});

export default rootReducer;
