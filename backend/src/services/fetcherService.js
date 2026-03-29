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
 * @param {number} options.maxJobs - Maximum jobs to fetch (default: 100)
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
      maxJobs = 100,
    } = options;

    // Build query with time and job type modifiers
    let modifiedQuery = query;
    if (timePeriod) {
      modifiedQuery += getTimeQuerySuffix(timePeriod);
    }
    if (jobType) {
      modifiedQuery += getJobTypeQuerySuffix(jobType);
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
    console.log(`📡 Fetching jobs from Google Jobs: "${modifiedQuery}"${filterStr} (max: ${maxJobs})`);

    const allJobs = [];
    let nextPageToken = null;
    let page = 0;

    // Fetch multiple pages to reach maxJobs
    while (allJobs.length < maxJobs && (page === 0 || nextPageToken)) {
      // Build params object
      const params = {
        engine: 'google_jobs',
        q: modifiedQuery,
        location: location,
        api_key: config.serpapiKey,
      };

      // Add next_page_token if available (for pagination)
      if (nextPageToken) {
        params.next_page_token = nextPageToken;
      }

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

      try {
        const response = await axios.get('https://serpapi.com/search', {
          params,
          timeout: 15000,
        });

        const jobs = response.data.jobs_results || [];
        
        if (!jobs || jobs.length === 0) {
          console.log(`   Page ${page + 1}: No more results`);
          break;
        }

        console.log(`   Page ${page + 1}: Fetched ${jobs.length} jobs`);

        // Parse detected extensions for additional metadata
        const pageJobs = jobs.map((job) => {
          const ext = job.detected_extensions || {};
          return {
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: job.description || '',
            postedAt: new Date(),
            source: 'google-jobs',
            externalId: job.job_id,
            sourceUrl: job.apply_link || job.share_link || job.link,
            // Additional metadata from detected_extensions
            salary: ext.salary || null,
            scheduleType: ext.schedule_type || null,
            workFromHome: ext.work_from_home || false,
            healthInsurance: ext.health_insurance || false,
            dentalCoverage: ext.dental_coverage || false,
            paidTimeOff: ext.paid_time_off || false,
          };
        });

        allJobs.push(...pageJobs);
        
        // Get next page token for pagination
        nextPageToken = response.data.next_page_token || null;
        page++;

        // Add a small delay between requests to avoid rate limiting
        if (allJobs.length < maxJobs && nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (pageError) {
        console.error(`   Page ${page + 1} error:`, pageError.message);
        break;
      }
    }

    console.log(`   ✓ Total fetched: ${allJobs.length} jobs`);
    return allJobs;
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
  const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';
  try {
    console.log(`📡 Fetching jobs from Remotive: "${category}"`);
    const response = await axios.get(REMOTIVE_API_URL, {
      params: { category },
      timeout: 10000,
    });
    const jobs = response.data.jobs || [];
    // Normalize Remotive response to match Google Jobs schema
    return jobs.map((job) => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      description: job.description || '',
      postedAt: new Date(job.published_at || job.publication_date || Date.now()),
      source: 'remotive',
      externalId: job.id ? job.id.toString() : undefined,
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
 * COST OPTIMIZATION:
 * - Each SerpAPI request costs 1 credit (you have 240/month)
 * - Each request returns ~10 jobs
 * - Cost = (jobs_per_country ÷ 10) × num_countries
 * 
 * With defaults (50 jobs × 3 countries = 15 requests per run):
 * - 240 ÷ 15 = 16 runs/month ≈ 0.5 runs/day
 * 
 * To run daily, reduce maxJobsPerCountry or countries
 * 
 * @param {object} options - Filter options
 * @param {string} options.query - Search query (default: backend developer)
 * @param {string} options.location - Location filter
 * @param {string} options.country - Country filter (overrides config)
 * @param {string} options.remote - "true" for remote jobs
 * @param {number} options.radius - Search radius in km
 * @param {string} options.timePeriod - yesterday, 3days, week, month
 * @param {string} options.jobType - fulltime, parttime, contract, internship
 * @returns {Promise<Array>} Combined array of job objects
 */
export const fetchAllJobs = async (options = {}) => {
  try {
    console.log('🔄 Starting multi-source job fetch...');
    
    const { 
      query, // If provided, use single query; otherwise use config.searchQueries
      country,
      maxJobsPerCountry,
      maxJobsPerQuery,
      countriesToFetch: countriesOverride,
      ...filters 
    } = options;
    
    // Determine countries to fetch from (priority: override > param > config)
    const countries = country 
      ? [country] 
      : (countriesOverride || config.countriesToFetch);

    // Determine queries to use (single query or multiple from config)
    const queries = query ? [query] : config.searchQueries;
    const jobsPerQuery = maxJobsPerQuery || config.maxJobsPerQuery;

    const allJobs = [];
    const totalRequests = countries.length * queries.length * Math.ceil(jobsPerQuery / 10);

    console.log(`📊 Budget Info: ~${totalRequests} requests per run (you have 240/month)`);
    console.log(`🌍 Fetching from: ${countries.join(', ')}`);
    console.log(`🔍 Queries: ${queries.join(', ')}`);
    console.log(`⏱  Target: ${jobsPerQuery} jobs per query\n`);

    // Fetch from Google Jobs if enabled
    if (config.includeGoogleJobs) {
      for (const targetCountry of countries) {
        for (const searchQuery of queries) {
          const googleOptions = {
            location: filters.location || (targetCountry === 'India' ? 'India' : targetCountry),
            country: targetCountry,
            remote: filters.remote,
            radius: filters.radius,
            timePeriod: filters.timePeriod,
            jobType: filters.jobType,
            maxJobs: jobsPerQuery,
          };

          console.log(`\n🌍 Fetching "${searchQuery}" from ${targetCountry}...`);
          const googleJobs = await fetchFromGoogleJobs(searchQuery, googleOptions);
          allJobs.push(...googleJobs);
          
          // Small delay between queries to avoid rate limiting
          if (queries.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    } else {
      console.log('⚠ Google Jobs API fetch is disabled by config.includeGoogleJobs');
    }

    // Fetch from Remotive if enabled
    if (config.includeRemotive) {
      console.log('\n🌐 Fetching from Remotive (remote jobs)...');
      const remotiveJobs = await fetchFromRemotive('backend');
      allJobs.push(...remotiveJobs);
    }

    console.log(`\n✓ Fetched ${allJobs.length} total jobs`);

    return allJobs;
  } catch (error) {
    console.error('✗ Job fetch pipeline error:', error.message);
    return [];
  }
};
