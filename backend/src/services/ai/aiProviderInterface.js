/**
 * AI Provider Interface
 * 
 * All AI providers must implement this interface.
 * This allows easy swapping between Gemini, OpenAI, Claude, etc.
 * 
 * To add a new provider:
 * 1. Create a new file (e.g., openaiProvider.js)
 * 2. Implement the AIProvider interface
 * 3. Update aiProviderFactory.js to include the new provider
 */

/**
 * @typedef {Object} ResumeAnalysisRequest
 * @property {Buffer} pdfBuffer - The PDF file buffer
 * @property {string} targetRole - Target job role
 * @property {string} experienceLevel - Years of experience (0-1, 1-3, 3-5, 5+)
 * @property {string} locationPreference - Work location preference
 * @property {Array<{title: string, company: string, location: string, description: string}>} jobs - Top jobs to match against
 */

/**
 * @typedef {Object} ResumeFix
 * @property {string} section - Resume section (Summary, Skills, Experience, etc.)
 * @property {string} issue - What's wrong
 * @property {string} suggestion - How to fix it
 * @property {string} priority - high, medium, low
 */

/**
 * @typedef {Object} JobMatch
 * @property {string} jobId - Job ID from database
 * @property {string} title - Job title
 * @property {string} company - Company name
 * @property {number} matchScore - 0-100 match percentage
 * @property {string} reason - Why this job matches
 */

/**
 * @typedef {Object} ResumeAnalysisResponse
 * @property {Array<ResumeFix>} fixes - List of improvements
 * @property {Array<JobMatch>} matchedJobs - Top matching jobs
 * @property {number} overallScore - Resume score 0-100
 * @property {Object} extractedSkills - Skills found in resume
 * @property {number} tokensUsed - Tokens consumed (for monitoring)
 */

/**
 * Abstract AI Provider Interface
 * @interface
 */
export class AIProvider {
  /**
   * Provider name for logging/debugging
   * @returns {string}
   */
  get name() {
    throw new Error('AIProvider.name must be implemented');
  }

  /**
   * Check if provider is configured and ready
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error('AIProvider.isConfigured() must be implemented');
  }

  /**
   * Analyze resume and match with jobs
   * @param {ResumeAnalysisRequest} request
   * @returns {Promise<ResumeAnalysisResponse>}
   */
  async analyzeResume(request) {
    throw new Error('AIProvider.analyzeResume() must be implemented');
  }
}

export default AIProvider;
