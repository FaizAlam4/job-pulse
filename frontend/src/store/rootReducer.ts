/**
 * Root Reducer
 * Combines all module reducers
 */

import { combineReducers } from '@reduxjs/toolkit';
import { jobsReducer } from '@/modules/jobs/store';
import { filtersReducer } from '@/modules/filters/store';

const rootReducer = combineReducers({
  jobs: jobsReducer,
  filters: filtersReducer,
});

export default rootReducer;
