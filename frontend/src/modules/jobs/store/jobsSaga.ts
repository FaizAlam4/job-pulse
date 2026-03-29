/**
 * Jobs Saga
 * Redux-Saga for handling async job operations
 */

import { call, put, takeLatest, all } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import jobsService from '../services/jobsService';
import {
  fetchJobsRequest,
  fetchJobsSuccess,
  fetchJobsFailure,
  fetchJobDetailRequest,
  fetchJobDetailSuccess,
  fetchJobDetailFailure,
  fetchTopJobsRequest,
  fetchTopJobsSuccess,
  fetchTopJobsFailure,
  fetchStatsRequest,
  fetchStatsSuccess,
  fetchStatsFailure,
  searchJobsRequest,
  searchJobsSuccess,
  searchJobsFailure,
} from './jobsSlice';
import { JobFilters, JobsResponse, JobDetailResponse, TopJobsResponse, JobStatsResponse, SearchParams } from '../types';

/**
 * Fetch jobs with filters
 */
function* fetchJobsSaga(action: PayloadAction<JobFilters | undefined>) {
  try {
    // Use filters directly from action payload (comes from selectActiveFilters)
    // Don't merge with old state.jobs.filters to avoid stale values
    const defaultFilters: JobFilters = { page: 1, limit: 20, sortBy: 'score', order: 'desc' };
    const filters = { ...defaultFilters, ...action.payload };
    
    const response: JobsResponse = yield call(jobsService.getJobs, filters);
    
    yield put(fetchJobsSuccess({
      jobs: response.data,
      pagination: response.pagination,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs';
    yield put(fetchJobsFailure(message));
  }
}

/**
 * Fetch single job detail
 */
function* fetchJobDetailSaga(action: PayloadAction<string>) {
  try {
    const response: JobDetailResponse = yield call(jobsService.getJobById, action.payload);
    
    yield put(fetchJobDetailSuccess({
      job: response.data.job,
      similarJobs: response.data.similarJobs || [],
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job details';
    yield put(fetchJobDetailFailure(message));
  }
}

/**
 * Fetch top jobs
 */
function* fetchTopJobsSaga(action: PayloadAction<number | undefined>) {
  try {
    const limit = action.payload || 10;
    const response: TopJobsResponse = yield call(jobsService.getTopJobs, limit);
    
    yield put(fetchTopJobsSuccess(response.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch top jobs';
    yield put(fetchTopJobsFailure(message));
  }
}

/**
 * Fetch job statistics
 */
function* fetchStatsSaga() {
  try {
    const response: JobStatsResponse = yield call(jobsService.getJobStats);
    
    yield put(fetchStatsSuccess(response.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch statistics';
    yield put(fetchStatsFailure(message));
  }
}

/**
 * Search jobs
 */
function* searchJobsSaga(action: PayloadAction<SearchParams>) {
  try {
    const response: JobsResponse = yield call(jobsService.searchJobs, action.payload);
    
    yield put(searchJobsSuccess({
      jobs: response.data,
      pagination: response.pagination,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    yield put(searchJobsFailure(message));
  }
}

/**
 * Root Jobs Saga
 */
export default function* jobsSaga() {
  yield all([
    takeLatest(fetchJobsRequest.type, fetchJobsSaga),
    takeLatest(fetchJobDetailRequest.type, fetchJobDetailSaga),
    takeLatest(fetchTopJobsRequest.type, fetchTopJobsSaga),
    takeLatest(fetchStatsRequest.type, fetchStatsSaga),
    takeLatest(searchJobsRequest.type, searchJobsSaga),
  ]);
}
