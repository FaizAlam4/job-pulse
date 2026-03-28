/**
 * Redux Store Configuration
 * Configures Redux Toolkit store with Saga middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootReducer from './rootReducer';
import rootSaga from './rootSaga';

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable thunk since we're using saga
      thunk: false,
      // Disable serializable check for saga actions
      serializableCheck: false,
    }).concat(sagaMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Run root saga
sagaMiddleware.run(rootSaga);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store
export default store;
