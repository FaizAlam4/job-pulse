import axios from 'axios';
import { config } from '../config/index.js';

/**
 * Build time filter query modifier
 * Google Jobs uses query modification for time filters
 * @param {string} timePeriod - yesterday, 3days, week, month
 * @returns {string} Query suffix
 */
const getTimeQuerySuffix = (timePeriod) => {
  const timeMap = {
    'yesterday': ' since yesterday',
    '3days': ' in the last 3 days',
    'week': ' in the last week',
    'month': ' in the last month',
  };
  return timeMap[timePeriod?.toLowerCase()] || '';
};

/**
 * Build job type query modifier
 * @param {string} jobType - fulltime, parttime, contract, internship
 * @returns {string} Query suffix  
 */
const getJobTypeQuerySuffix = (jobType) => {
  const typeMap = {
    'fulltime': ' full time',
    'full-time': ' full time',
    'parttime': ' part time',
    'part-time': ' part time',
    'contract': ' contract',
    'internship': ' internship',
  };
  return typeMap[jobType?.toLowerCase()] || '';
};

/**
 * Get country code for gl parameter
 * @param {string} country - Country name or code
 * @returns {string} 2-letter country code
 */
const getCountryCode = (country) => {
  const countryMap = {
    'usa': 'us', 'us': 'us', 'united states': 'us', 'america': 'us',
    'uk': 'uk', 'united kingdom': 'uk', 'england': 'uk', 'britain': 'uk',
    'india': 'in', 'in': 'in',
    'germany': 'de', 'de': 'de',
    'canada': 'ca', 'ca': 'ca',
    'australia': 'au', 'au': 'au',
    'france': 'fr', 'fr': 'fr',
    'japan': 'jp', 'jp': 'jp',
    'singapore': 'sg', 'sg': 'sg',
  };
  return countryMap[country?.toLowerCase()] || null;
};

/**
 * Fetch jobs from Google Jobs via SerpAPI
 * SerpAPI provides structured access to Google Jobs search results
 * 
 * Supported filters from SerpAPI Google Jobs API:
 * - location: Geographic location (city, state, country)
 * - gl: Country code (us, uk, in, de, etc.)
 * - ltype: 1 for remote/work from home jobs
 * - lrad: Search radius in km
 * - Time: Via query modification (yesterday, 3days, week, month)
 * - Job Type: Via query modification (fulltime, parttime, contract, internship)
 * 
 * @param {string} query - Job search query (e.g., "backend engineer")
 * @param {object} options - Filter options
 * @param {string} options.location - Location filter (e.g., "New York, NY")
 * @param {string} options.country - Country filter (e.g., "USA", "UK")
 * @param {string} options.remote - "true" for remote jobs only
 * @param {number} options.radius - Search radius in km
 * @param {string} options.timePeriod - yesterday, 3days, week, month
 * @param {string} options.jobType - fulltime, parttime, contract, internship
 * @returns {Promise<Array>} Array of job objects
 */
export const fetchFromGoogleJobs = async (query = 'backend developer', options = {}) => {
  try {
    if (!config.serpapiKey) {
      console.warn('⚠ SerpAPI key not configured. Skipping Google Jobs fetch.');
      return [];
    }

    const {
      location = 'United States',
      country,
      remote,
      radius,
      timePeriod,
      jobType,
    } = options;

    // Build query with time and job type modifiers
    let modifiedQuery = query;
    if (timePeriod) {
      modifiedQuery += getTimeQuerySuffix(timePeriod);
    }
    if (jobType) {
      modifiedQuery += getJobTypeQuerySuffix(jobType);
    }

    // Build params object
    const params = {
      engine: 'google_jobs',
      q: modifiedQuery,
      location: location,
      api_key: config.serpapiKey,
    };

    // Add country code if specified
    if (country) {
      const countryCode = getCountryCode(country);
      if (countryCode) {
        params.gl = countryCode;
      }
    }

    // Add remote filter (ltype=1)
    if (remote === 'true' || remote === true) {
      params.ltype = '1';
    }

    // Add search radius
    if (radius && !isNaN(parseInt(radius))) {
      params.lrad = parseInt(radius);
    }

    // Log filters being applied
    const activeFilters = [];
    if (location !== 'United States') activeFilters.push(`location: ${location}`);
    if (country) activeFilters.push(`country: ${country}`);
    if (remote === 'true' || remote === true) activeFilters.push('remote: true');
    if (radius) activeFilters.push(`radius: ${radius}km`);
    if (timePeriod) activeFilters.push(`time: ${timePeriod}`);
    if (jobType) activeFilters.push(`type: ${jobType}`);
    
    const filterStr = activeFilters.length > 0 ? ` [${activeFilters.join(', ')}]` : '';
    console.log(`📡 Fetching jobs from Google Jobs: "${modifiedQuery}"${filterStr}`);

    const response = await axios.get('https://serpapi.com/search', {
      params,
      timeout: 15000,
    });

    const jobs = response.data.jobs_results || [];

    // Parse detected extensions for additional metadata
    return jobs.map((job) => {
      const ext = job.detected_extensions || {};
      return {
        title: job.title,
        company: job.company_name,
        location: job.location,
        description: job.description || '',
        postedAt: new Date(),
        source: 'google-jobs',
        externalId: job.job_id,
        sourceUrl: job.share_link || job.link,
        // Additional metadata from detected_extensions
        salary: ext.salary || null,
        scheduleType: ext.schedule_type || null,
        workFromHome: ext.work_from_home || false,
        healthInsurance: ext.health_insurance || false,
        dentalCoverage: ext.dental_coverage || false,
        paidTimeOff: ext.paid_time_off || false,
      };
    });
  } catch (error) {
    console.error('✗ Google Jobs fetch error:', error.message);
    return [];
  }
};

/**
 * Fetch jobs from Remotive API
 * Remotive provides free, comprehensive job listings including remote jobs
 * 
 * @param {string} category - Job category (e.g., "backend", "frontend")
 * @returns {Promise<Array>} Array of job objects
 */
export const fetchFromRemotive = async (category = 'backend') => {
  try {
    console.log(`📡 Fetching jobs from Remotive: "${category}"`);

    // Remotive API: https://remotive.com/api/remote-jobs
    const response = await axios.get('https://remotive.io/api/remote-jobs', {
      params: {
        category: category,
      },
      timeout: 10000,
    });

    const jobs = response.data.jobs || [];

    // Normalize Remotive response
    return jobs.map((job) => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      description: job.description || '',
      postedAt: new Date(job.published_at || Date.now()),
      source: 'remotive',
      externalId: job.id.toString(),
      sourceUrl: job.url,
    }));
  } catch (error) {
    console.error('✗ Remotive fetch error:', error.message);
    return [];
  }
};

/**
 * Fetch jobs from multiple sources with filters
 * Aggregates data from different job boards
 * 
 * @param {object} options - Filter options
 * @param {string} options.query - Search query (default: backend developer)
 * @param {string} options.location - Location filter
 * @param {string} options.country - Country filter
 * @param {string} options.remote - "true" for remote jobs
 * @param {number} options.radius - Search radius in km
 * @param {string} options.timePeriod - yesterday, 3days, week, month
 * @param {string} options.jobType - fulltime, parttime, contract, internship
 * @returns {Promise<Array>} Combined array of job objects
 */
export const fetchAllJobs = async (options = {}) => {
  try {
    console.log('🔄 Starting multi-source job fetch...');
    
    const { query = 'backend developer', ...filters } = options;
    
    // Set defaults if not provided
    const googleOptions = {
      location: filters.location || 'United States',
      country: filters.country,
      remote: filters.remote,
      radius: filters.radius,
      timePeriod: filters.timePeriod,
      jobType: filters.jobType,
    };

    // Fetch from all sources in parallel
    // Note: Remotive doesn't support these filters, but we still fetch from it
    const [googleJobs, remotiveJobs] = await Promise.all([
      fetchFromGoogleJobs(query, googleOptions),
      fetchFromRemotive('backend'),
    ]);

    const allJobs = [...googleJobs, ...remotiveJobs];

    console.log(`✓ Fetched ${allJobs.length} total jobs (Google: ${googleJobs.length}, Remotive: ${remotiveJobs.length})`);

    return allJobs;
  } catch (error) {
    console.error('✗ Job fetch pipeline error:', error.message);
    return [];
  }
};
