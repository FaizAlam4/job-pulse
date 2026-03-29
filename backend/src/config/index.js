import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/job-pulse',

  // APIs
  serpapiKey: process.env.SERPAPI_KEY || '',

  // Scoring
  recencyWeight: parseFloat(process.env.RECENCY_WEIGHT) || 0.6,
  relevanceWeight: parseFloat(process.env.RELEVANCE_WEIGHT) || 0.4,

  // Scheduler
  fetchIntervalHours: parseInt(process.env.FETCH_INTERVAL_HOURS) || 3,

  // Job Ingestion Configuration (SerpAPI Budget Optimization)
  // Adjust these to control API request costs
  // 1 request = ~10 jobs. With 240 requests/month: 16-req-run = 15 runs/month
  maxJobsPerCountry: parseInt(process.env.MAX_JOBS_PER_COUNTRY) || 50,
  // Format: "India,United States,United Kingdom" or "India" for India only
  countriesToFetch: (process.env.COUNTRIES_TO_FETCH || 'India,United States,United Kingdom').split(',').map(c => c.trim()),
  // Include free Remotive API (no cost)
  includeRemotive: process.env.INCLUDE_REMOTIVE !== 'false', // Default: true
  // Include Google Jobs API (SerpAPI)
  includeGoogleJobs: process.env.INCLUDE_GOOGLE_JOBS !== 'false', // Default: true
};

export default config;
