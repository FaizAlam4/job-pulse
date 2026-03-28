import Job from '../models/Job.js';
import { calculateJobScore } from '../utils/scoring.js';
import { config } from '../config/index.js';

/**
 * Scoring Service
 * Calculates and updates job relevance scores
 */

/**
 * Default keywords to match against job descriptions
 * These represent skills commonly sought in backend development
 */
const DEFAULT_KEYWORDS = [
  'node',
  'javascript',
  'typescript',
  'express',
  'mongodb',
  'postgresql',
  'sql',
  'rest api',
  'graphql',
  'docker',
  'kubernetes',
  'aws',
  'cloud',
  'backend',
  'api',
  'database',
  'react',
  'python',
  'java',
  'golang',
  'rust',
  'microservices',
  'react native',
  'vue',
];

/**
 * Score a single job
 * @param {object} job - Job object or document
 * @param {string[]} keywords - Keywords for relevance matching
 * @returns {object} Scoring result
 */
export const scoreJob = (job, keywords = DEFAULT_KEYWORDS) => {
  return calculateJobScore(
    job,
    keywords,
    config.recencyWeight,
    config.relevanceWeight
  );
};

/**
 * Score all active jobs in the database
 * Updates their score fields for efficient querying
 * 
 * @param {string[]} keywords - Keywords for relevance matching
 * @returns {Promise<number>} Number of jobs scored
 */
export const scoreAllJobs = async (keywords = DEFAULT_KEYWORDS) => {
  console.log('⭐ Scoring all active jobs...');

  try {
    const jobs = await Job.find({ isActive: true });

    let updateCount = 0;

    for (const job of jobs) {
      const scoring = scoreJob(job, keywords);

      // Update job with scores
      await Job.updateOne(
        { _id: job._id },
        {
          score: scoring.totalScore,
          freshnessScore: scoring.freshnessScore,
          relevanceScore: scoring.relevanceScore,
          keywords: scoring.matchedKeywords,
        }
      );

      updateCount++;
    }

    console.log(`✓ Scored ${updateCount} jobs`);

    return updateCount;
  } catch (error) {
    console.error('✗ Job scoring error:', error.message);
    throw error;
  }
};

/**
 * Get top-ranked jobs
 * @param {number} limit - Number of jobs to return
 * @param {string[]} keywords - Keywords for filtering/scoring
 * @returns {Promise<Array>} Top jobs sorted by score
 */
export const getTopJobs = async (limit = 10, keywords = DEFAULT_KEYWORDS) => {
  try {
    const topJobs = await Job.find({ isActive: true })
      .sort({ score: -1, postedAt: -1 })
      .limit(limit)
      .select('-__v');

    // Re-score if needed (optional, for real-time accuracy)
    return topJobs;
  } catch (error) {
    console.error('✗ Get top jobs error:', error.message);
    throw error;
  }
};

/**
 * Get jobs by location and/or skills
 * @param {object} filters - Filter criteria
 * @param {string} filters.location - Location to filter by
 * @param {string[]} filters.skills - Skills to match
 * @param {number} filters.postedWithinHours - Posted within N hours
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Filtered and sorted jobs
 */
export const filterJobs = async (
  filters = {},
  limit = 20
) => {
  try {
    const query = { isActive: true };

    // Location filter
    if (filters.location) {
      query.location = { $regex: filters.location, $options: 'i' };
    }

    // Time filter
    if (filters.postedWithinHours) {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - filters.postedWithinHours);
      query.postedAt = { $gte: cutoffTime };
    }

    let jobs = await Job.find(query)
      .sort({ score: -1, postedAt: -1 })
      .limit(limit)
      .select('-__v');

    // Skill filtering (if provided, re-score with specific keywords)
    if (filters.skills && filters.skills.length > 0) {
      jobs = jobs.filter((job) => {
        const scoring = scoreJob(job, filters.skills);
        return scoring.totalScore > 0;
      });
    }

    return jobs;
  } catch (error) {
    console.error('✗ Filter jobs error:', error.message);
    throw error;
  }
};
