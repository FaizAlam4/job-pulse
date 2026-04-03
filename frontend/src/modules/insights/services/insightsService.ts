/**
 * Insights Service
 * API calls for analytics and insights
 */

import apiClient from '@/services/apiClient';
import {
  OverviewStats,
  ApplicationTrends,
  SourceData,
  SkillsAnalysis,
  GoalsProgress,
  InsightsResponse,
} from '../types';

const INSIGHTS_ENDPOINT = '/insights';

/**
 * Get dashboard overview stats
 */
export const getOverviewStats = async (): Promise<InsightsResponse<OverviewStats>> => {
  const response = await apiClient.get(`${INSIGHTS_ENDPOINT}/overview`);
  return response.data;
};

/**
 * Get application trends over time
 */
export const getApplicationTrends = async (
  period: number = 30
): Promise<InsightsResponse<ApplicationTrends>> => {
  const response = await apiClient.get(`${INSIGHTS_ENDPOINT}/trends`, {
    params: { period },
  });
  return response.data;
};

/**
 * Get sources breakdown
 */
export const getSourcesBreakdown = async (): Promise<InsightsResponse<SourceData[]>> => {
  const response = await apiClient.get(`${INSIGHTS_ENDPOINT}/sources`);
  return response.data;
};

/**
 * Get skills analysis
 */
export const getSkillsAnalysis = async (): Promise<InsightsResponse<SkillsAnalysis>> => {
  const response = await apiClient.get(`${INSIGHTS_ENDPOINT}/skills`);
  return response.data;
};

/**
 * Get goals and progress
 */
export const getGoalsProgress = async (): Promise<InsightsResponse<GoalsProgress>> => {
  const response = await apiClient.get(`${INSIGHTS_ENDPOINT}/goals`);
  return response.data;
};

export const insightsService = {
  getOverviewStats,
  getApplicationTrends,
  getSourcesBreakdown,
  getSkillsAnalysis,
  getGoalsProgress,
};
