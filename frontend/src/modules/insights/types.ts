/**
 * Insights Types
 * Type definitions for analytics and insights
 */

export interface OverviewStats {
  totalApplications: number;
  statusBreakdown: Record<string, number>;
  responseRate: number;
  avgTimeToResponse: number | null;
  thisWeekApplications: number;
  lastWeekApplications: number;
  weeklyGrowth: number;
  topCompanies: Array<{ name: string; count: number }>;
  priorityDistribution: Record<number, number>;
}

export interface TrendDataPoint {
  date: string;
  applications: number;
  cumulative?: number;
  saved?: number;
  applied?: number;
  'phone-screen'?: number;
  interview?: number;
  offer?: number;
  rejected?: number;
}

export interface ApplicationTrends {
  daily: TrendDataPoint[];
  cumulative: TrendDataPoint[];
  period: number;
}

export interface SourceData {
  name: string;
  total: number;
  responses: number;
  offers: number;
  responseRate: number;
  offerRate: number;
}

export interface SkillData {
  keyword: string;
  count: number;
  offers: number;
  interviews: number;
  successRate: number;
}

export interface SkillsAnalysis {
  topSkills: SkillData[];
  categories: {
    languages: SkillData[];
    frameworks: SkillData[];
    tools: SkillData[];
    soft: SkillData[];
    other: SkillData[];
  };
  totalUniqueSkills: number;
}

export interface Goal {
  target: number;
  current: number;
  label: string;
}

export interface GoalsProgress {
  goals: {
    weeklyApplications: Goal;
    weeklyApplied: Goal;
    monthlyApplications: Goal;
    monthlyInterviews: Goal;
  };
  streaks: {
    current: number;
    longest: number;
  };
}

export interface InsightsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
