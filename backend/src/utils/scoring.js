import crypto from 'crypto';

/**
 * Generate deduplication hash from job fields
 * @param {string} title - Job title
 * @param {string} company - Company name
 * @param {string} location - Job location
 * @returns {string} SHA256 hash
 */
export const generateJobHash = (title, company, location) => {
  const hashInput = `${title}-${company}-${location}`.toLowerCase();
  return crypto.createHash('sha256').update(hashInput).digest('hex');
};

/**
 * Parse ISO date string or return current date
 * @param {string|Date} dateStr - Date string to parse
 * @returns {Date}
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

/**
 * Calculate freshness score (0-1) based on posting time
 * Newer jobs get higher scores
 * @param {Date} postedAt - Job posting date
 * @returns {number} Freshness score 0-1
 */
export const calculateFreshnessScore = (postedAt) => {
  const now = new Date();
  const ageInMs = now - new Date(postedAt);
  const ageInHours = ageInMs / (1000 * 60 * 60);

  // Jobs posted within last 24 hours get high scores
  // Score decays logarithmically after that
  if (ageInHours <= 24) {
    return 1.0;
  } else if (ageInHours <= 7 * 24) {
    return 0.8 - (ageInHours - 24) / (7 * 24) * 0.3;
  } else {
    return Math.max(0.1, 0.5 - Math.log(ageInHours / (7 * 24)) * 0.1);
  }
};

/**
 * Calculate relevance score based on keyword matches
 * @param {string} description - Job description
 * @param {string[]} keywords - Keywords to search for
 * @returns {object} { score: number 0-1, matchedKeywords: string[] }
 */
export const calculateRelevanceScore = (description, keywords = []) => {
  if (!description || keywords.length === 0) {
    return { score: 0, matchedKeywords: [] };
  }

  const descLower = description.toLowerCase();
  const matchedKeywords = [];

  for (const keyword of keywords) {
    // Regex for whole word match
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
    if (regex.test(descLower)) {
      matchedKeywords.push(keyword);
    }
  }

  // Score based on percentage of keywords matched
  const score = Math.min(1, matchedKeywords.length / keywords.length);

  return { score, matchedKeywords };
};

/**
 * Combined scoring function
 * @param {object} job - Job object with postedAt and description
 * @param {string[]} keywords - Keywords for relevance matching
 * @param {number} recencyWeight - Weight for recency (0-1)
 * @param {number} relevanceWeight - Weight for relevance (0-1)
 * @returns {object} { totalScore, freshnessScore, relevanceScore, matchedKeywords }
 */
export const calculateJobScore = (
  job,
  keywords = [],
  recencyWeight = 0.6,
  relevanceWeight = 0.4
) => {
  const freshnessScore = calculateFreshnessScore(job.postedAt);
  const relevanceData = calculateRelevanceScore(job.description, keywords);

  const totalScore =
    recencyWeight * freshnessScore + relevanceWeight * relevanceData.score;

  return {
    totalScore: Math.min(1, Math.max(0, totalScore)),
    freshnessScore,
    relevanceScore: relevanceData.score,
    matchedKeywords: relevanceData.matchedKeywords,
  };
};
