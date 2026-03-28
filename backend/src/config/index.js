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
};

export default config;
