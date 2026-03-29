/**
 * Root Reducer
 * Combines all module reducers
 */

import { combineReducers } from '@reduxjs/toolkit';

import { jobsReducer } from '@/modules/jobs/store';
import { filtersReducer } from '@/modules/filters/store';
import notificationsReducer from '@/modules/notifications/store/notificationSlice';


const rootReducer = combineReducers({
  jobs: jobsReducer,
  filters: filtersReducer,
  notifications: notificationsReducer,
});

export default rootReducer;
