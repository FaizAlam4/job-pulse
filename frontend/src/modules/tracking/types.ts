/**
 * Tracking Types
 * TypeScript interfaces for job application tracking
 */

export type TrackingStatus = 
  | 'saved' 
  | 'applied' 
  | 'phone-screen' 
  | 'interview' 
  | 'offer' 
  | 'rejected';

export type InterviewType = 
  | 'phone' 
  | 'video' 
  | 'onsite' 
  | 'technical' 
  | 'hr' 
  | 'other';

export interface JobSnapshot {
  title: string;
  company: string;
  location: string;
  description?: string;
  sourceUrl?: string;
  source?: string;
  postedAt?: string;
  fetchedAt?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  keywords?: string[];
  score?: number;
}

export interface StatusHistoryEntry {
  status: TrackingStatus;
  date: string;
  notes?: string;
}

export interface Interview {
  _id?: string;
  date: string;
  type: InterviewType;
  notes?: string;
  duration?: number;
  interviewer?: string;
}

export interface Contact {
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  linkedIn?: string;
}

export interface TrackedJob {
  _id: string;
  jobId?: string;
  jobSnapshot: JobSnapshot;
  status: TrackingStatus;
  statusHistory: StatusHistoryEntry[];
  appliedAt?: string;
  notes?: string;
  reminder?: string;
  interviews: Interview[];
  contacts: Contact[];
  priority: number;
  color?: string;
  applicationSource?: string;
  resumeVersion?: string;
  trackedAt: string;
  updatedAt: string;
}

export interface TrackJobRequest {
  jobId: string;
  status?: TrackingStatus;
  notes?: string;
  priority?: number;
  applicationSource?: string;
}

export interface UpdateTrackingRequest {
  status?: TrackingStatus;
  notes?: string;
  reminder?: string;
  priority?: number;
  color?: string;
  applicationSource?: string;
  resumeVersion?: string;
  statusChangeNotes?: string;
  interviews?: Interview[];
  contacts?: Contact[];
}

export interface AddInterviewRequest {
  date: string;
  type: InterviewType;
  notes?: string;
  duration?: number;
  interviewer?: string;
}

export interface AddContactRequest {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  linkedIn?: string;
}

export interface TrackingAnalytics {
  total: number;
  byStatus: Record<TrackingStatus, number>;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  byCompany: Record<string, number>;
  byLocation: Record<string, number>;
  recentApplications: number;
  avgStageTimes: {
    applied?: number;
    'phone-screen'?: number;
    interview?: number;
  };
}

export interface TrackingResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// UI Helpers
export const TRACKING_STATUS_LABELS: Record<TrackingStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  'phone-screen': 'Phone Screen',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export const TRACKING_STATUS_COLORS: Record<TrackingStatus, { bg: string; text: string; border: string }> = {
  saved: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  },
  applied: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
  },
  'phone-screen': {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600',
  },
  interview: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-600',
  },
  offer: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-600',
  },
  rejected: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-600',
  },
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone: 'Phone',
  video: 'Video',
  onsite: 'On-site',
  technical: 'Technical',
  hr: 'HR',
  other: 'Other',
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High',
};
