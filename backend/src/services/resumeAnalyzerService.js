/**
 * Resume Analyzer Service
 * 
 * Orchestrates resume analysis:
 * 1. Validates PDF
 * 2. Fetches relevant jobs from DB
 * 3. Calls AI provider
 * 4. Returns structured results
 */

import { getAIProvider, isAIAvailable } from './ai/aiProviderFactory.js';
import Job from '../models/Job.js';

// PDF magic bytes
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

/**
 * Validate PDF buffer
 * @param {Buffer} buffer
 * @returns {{valid: boolean, error?: string}}
 */
export const validatePDF = (buffer) => {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file' };
  }
  
  // Check magic bytes
  if (!buffer.slice(0, 4).equals(PDF_MAGIC)) {
    return { valid: false, error: 'Invalid PDF file' };
  }
  
  // Max 2MB
  const maxSize = 2 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return { valid: false, error: 'File too large (max 2MB)' };
  }
  
  return { valid: true };
};

/**
 * Fetch top jobs for matching
 * @param {string} targetRole - Target job role
 * @param {string} locationPreference - Location preference
 * @returns {Promise<Array>}
 */
const fetchTopJobs = async (targetRole, locationPreference) => {
  const query = { isActive: true };
  
  // Build text search for role matching
  const searchTerms = targetRole.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  // Fetch top-scored jobs with basic filtering
  const jobs = await Job.find(query)
    .sort({ score: -1, postedAt: -1 })
    .limit(50) // Fetch more, filter client-side
    .select('title company location description score')
    .lean();
  
  // Filter by relevance to target role
  const filtered = jobs.filter(job => {
    const titleLower = job.title.toLowerCase();
    return searchTerms.some(term => titleLower.includes(term));
  });
  
  // If no matches, return top jobs regardless
  const result = filtered.length > 0 ? filtered : jobs;
  
  // Return top 20 for AI analysis
  return result.slice(0, 20);
};

/**
 * Analyze resume and match with jobs
 * 
 * @param {Object} params
 * @param {Buffer} params.pdfBuffer - PDF file buffer
 * @param {string} params.targetRole - Target job role
 * @param {string} params.experienceLevel - Experience level
 * @param {string} params.locationPreference - Location preference
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeResume = async ({
  pdfBuffer,
  targetRole,
  experienceLevel,
  locationPreference,
}) => {
  // Validate AI availability
  if (!isAIAvailable()) {
    throw new Error('AI service is not available. Please try again later.');
  }
  
  // Validate PDF
  const validation = validatePDF(pdfBuffer);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Validate inputs
  if (!targetRole || targetRole.trim().length < 2) {
    throw new Error('Target role is required');
  }
  if (!experienceLevel) {
    throw new Error('Experience level is required');
  }
  if (!locationPreference) {
    throw new Error('Location preference is required');
  }
  
  // Fetch relevant jobs
  const jobs = await fetchTopJobs(targetRole, locationPreference);
  
  if (jobs.length === 0) {
    throw new Error('No jobs available for matching. Please try again later.');
  }
  
  // Get AI provider and analyze
  const provider = getAIProvider();
  console.log(`[ResumeAnalyzer] Using AI provider: ${provider.name}`);
  
  const startTime = Date.now();
  const result = await provider.analyzeResume({
    pdfBuffer,
    targetRole,
    experienceLevel,
    locationPreference,
    jobs,
  });
  const duration = Date.now() - startTime;
  
  console.log(`[ResumeAnalyzer] Analysis completed in ${duration}ms, tokens: ${result.tokensUsed}`);
  
  return {
    ...result,
    analysisTime: duration,
    jobsAnalyzed: jobs.length,
    provider: provider.name,
  };
};

/**
 * Check if resume analysis feature is available
 * @returns {Object} Feature status
 */
export const getFeatureStatus = () => {
  const available = isAIAvailable();
  return {
    available,
    provider: available ? getAIProvider().name : null,
    message: available 
      ? 'Resume analysis is available' 
      : 'Resume analysis is currently unavailable. AI service not configured.',
  };
};

export default { analyzeResume, validatePDF, getFeatureStatus };
