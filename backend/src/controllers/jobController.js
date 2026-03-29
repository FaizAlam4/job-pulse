import Job from '../models/Job.js';
import { getTopJobs, filterJobs, scoreAllJobs } from '../services/scoringService.js';
import { runJobIngestionPipeline } from '../services/aggregationService.js';
import { deleteOldJobs, deduplicateJobs, archiveOldJobs } from '../services/deduplicateService.js';
import fs from 'fs';
import path from 'path';

/**
 * Get all jobs with optional filtering
 * @QueryParams:
 *   - search: Search by title, company, or keywords (case-insensitive)
 *   - location: Filter by location (case-insensitive, partial match)
 *   - country: Filter by country (e.g., "United States", "USA", "India")
 *   - state: Filter by state (e.g., "California", "CA", "New York")
 *   - city: Filter by city (e.g., "San Francisco", "Boulder")
 *   - remote: Filter remote jobs (true/false)
 *   - skills: Comma-separated skills (e.g., "node,express,mongodb")
 *   - postedWithinHours: Only jobs posted in last N hours
 *   - limit: Number of results (default: 20, max: 100)
 *   - page: Page number (default: 1)
 *   - sortBy: Sort field (default: score) - score, postedAt, company
 *   - order: Sort order (default: desc) - asc, desc
 */
export const getAllJobs = async (req, reply) => {
  try {
    const { 
      search,
      location,
      country,
      state,
      city,
      remote,
      skills, 
      postedWithinHours, 
      limit = 20, 
      page = 1,
      sortBy = 'score',
      order = 'desc'
    } = req.query;

    const queryLimit = Math.min(parseInt(limit) || 20, 100);
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const skip = (currentPage - 1) * queryLimit;

    // Build query
    const query = { isActive: true };

    // Search filter (title, company, keywords)
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { keywords: searchRegex },
      ];
    }
    
    // Location filters (can combine multiple)
    const locationConditions = [];
    
    if (location) {
      locationConditions.push({ location: { $regex: location, $options: 'i' } });
    }
    
    if (country) {
      // Common country name variations
      const countryPatterns = getCountryPatterns(country);
      locationConditions.push({ location: { $regex: countryPatterns, $options: 'i' } });
    }
    
    if (state) {
      locationConditions.push({ location: { $regex: state, $options: 'i' } });
    }
    
    if (city) {
      locationConditions.push({ location: { $regex: city, $options: 'i' } });
    }
    
    if (remote === 'true') {
      locationConditions.push({ 
        location: { $regex: 'remote|anywhere|worldwide|global', $options: 'i' } 
      });
    }
    
    if (locationConditions.length > 0) {
      query.$and = locationConditions;
    }
    
    if (postedWithinHours) {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - parseInt(postedWithinHours));
      query.postedAt = { $gte: cutoffTime };
    }

    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = {};
    if (sortBy === 'postedAt') {
      sort.postedAt = sortOrder;
    } else if (sortBy === 'company') {
      sort.company = sortOrder;
    } else {
      sort.score = sortOrder;
      sort.postedAt = -1; // Secondary sort
    }

    // Get total count
    const totalCount = await Job.countDocuments(query);
    const totalPages = Math.ceil(totalCount / queryLimit);

    // Get jobs with pagination
    let jobs = await Job.find(query)
      .sort(sort)
      .skip(skip)
      .limit(queryLimit)
      .select('-__v');

    // Skill filtering (client-side for now)
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim().toLowerCase());
      jobs = jobs.filter(job => {
        const jobText = `${job.title} ${job.description}`.toLowerCase();
        return skillList.some(skill => jobText.includes(skill));
      });
    }

    reply.send({
      success: true,
      data: jobs,
      filters: {
        search: search || null,
        location: location || null,
        country: country || null,
        state: state || null,
        city: city || null,
        remote: remote === 'true' || null,
        skills: skills || null,
      },
      pagination: {
        currentPage,
        totalPages,
        totalCount,
        limit: queryLimit,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get country regex patterns for common variations
 */
function getCountryPatterns(country) {
  const countryMap = {
    'usa': 'united states|usa|u\\.s\\.',
    'us': 'united states|usa|u\\.s\\.',
    'united states': 'united states|usa|u\\.s\\.',
    'uk': 'united kingdom|uk|england|britain',
    'united kingdom': 'united kingdom|uk|england|britain',
    'india': 'india|in',
    'germany': 'germany|deutschland',
    'canada': 'canada|ca',
    'australia': 'australia|au',
  };
  
  const key = country.toLowerCase();
  return countryMap[key] || country;
}

/**
 * Get top-ranked jobs
 * @QueryParams:
 *   - limit: Number of results (default: 10, max: 50)
 */
export const getTopRankedJobs = async (req, reply) => {
  try {
    const { limit = 10 } = req.query;
    const queryLimit = Math.min(parseInt(limit) || 10, 50);

    const topJobs = await getTopJobs(queryLimit);

    reply.send({
      success: true,
      data: topJobs,
      count: topJobs.length,
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get a single job by ID with related jobs
 * @Params:
 *   - id: MongoDB object ID
 */
export const getJobById = async (req, reply) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id).select('-__v');

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: 'Job not found',
      });
    }

    // Find similar jobs (same company or similar location)
    const similarJobs = await Job.find({
      _id: { $ne: job._id },
      isActive: true,
      $or: [
        { company: job.company },
        { location: { $regex: job.location.split(',')[0], $options: 'i' } }
      ]
    })
      .sort({ score: -1 })
      .limit(5)
      .select('title company location score postedAt');

    reply.send({
      success: true,
      data: {
        job,
        similarJobs,
      },
    });
  } catch (error) {
    reply.status(400).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Search jobs by keyword
 * @QueryParams:
 *   - q: Search query (searches title, company, description)
 *   - limit: Number of results (default: 20, max: 100)
 *   - page: Page number (default: 1)
 */
export const searchJobs = async (req, reply) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;

    if (!q || q.trim().length < 2) {
      return reply.status(400).send({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    const queryLimit = Math.min(parseInt(limit) || 20, 100);
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const skip = (currentPage - 1) * queryLimit;

    const searchRegex = { $regex: q, $options: 'i' };
    const query = {
      isActive: true,
      $or: [
        { title: searchRegex },
        { company: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ],
    };

    const totalCount = await Job.countDocuments(query);
    const totalPages = Math.ceil(totalCount / queryLimit);

    const jobs = await Job.find(query)
      .sort({ score: -1, postedAt: -1 })
      .skip(skip)
      .limit(queryLimit)
      .select('-__v');

    reply.send({
      success: true,
      data: jobs,
      query: q,
      pagination: {
        currentPage,
        totalPages,
        totalCount,
        limit: queryLimit,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get job statistics
 */
export const getJobStats = async (req, reply) => {
  try {
    const stats = await Job.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          avgScore: { $avg: '$score' },
          newestJob: { $max: '$postedAt' },
          oldestJob: { $min: '$postedAt' },
        },
      },
    ]);

    const jobsBySource = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    const jobsByLocation = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    reply.send({
      success: true,
      data: {
        overall: stats[0] || {
          totalJobs: 0,
          avgScore: 0,
          newestJob: null,
          oldestJob: null,
        },
        bySource: jobsBySource,
        topLocations: jobsByLocation,
      },
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Manually trigger job ingestion pipeline with filters
 * (for testing/admin purposes)
 * 
 * Supports filters from Google Jobs API:
 * @QueryParams (GET /admin/ingest):
 *   - query: Search query (default: "backend developer")
 *   - location: Location filter (e.g., "San Francisco, CA")
 *   - country: Country filter (USA, UK, India, Germany, Canada, Australia)
 *   - remote: "true" for remote jobs only
 *   - radius: Search radius in km
 *   - timePeriod: yesterday, 3days, week, month
 *   - jobType: fulltime, parttime, contract, internship
 * 
 * @example POST /admin/ingest?location=New%20York&remote=true&timePeriod=week
 * @example POST /admin/ingest?country=UK&jobType=fulltime
 */
export const triggerIngestion = async (req, reply) => {
  try {
    // Extract filter options from query params or body
    const params = { ...req.query, ...req.body };
    
    const options = {
      query: params.query || params.q,
      location: params.location,
      country: params.country,
      remote: params.remote,
      radius: params.radius,
      timePeriod: params.timePeriod || params.time,
      jobType: params.jobType || params.type,
    };
    
    // Remove undefined values
    Object.keys(options).forEach(key => options[key] === undefined && delete options[key]);
    
    const summary = await runJobIngestionPipeline(options);

    reply.send({
      success: true,
      message: 'Job ingestion pipeline executed',
      filtersApplied: Object.keys(options).length > 0 ? options : 'none (defaults used)',
      data: summary,
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Manually re-score all jobs
 */
export const resendAllJobs = async (req, reply) => {
  try {
    const count = await scoreAllJobs();

    reply.send({
      success: true,
      message: `Re-scored ${count} jobs`,
      count: count,
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * ADMIN: Clean up old jobs (hard delete for Atlas free tier)
 * Removes jobs older than N days to save storage space
 * @QueryParams:
 *   - days: Delete jobs older than N days (default: 60)
 */
export const cleanupOldJobs = async (req, reply) => {
  try {
    const { days = 60 } = req.query;
    const daysInt = parseInt(days) || 60;

    if (daysInt < 7) {
      return reply.status(400).send({
        success: false,
        error: 'Cannot delete jobs younger than 7 days',
      });
    }

    const result = await deleteOldJobs(daysInt);

    reply.send({
      success: true,
      message: `Cleanup completed`,
      data: result,
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

/**
 * DEBUG: Delete all jobs (for testing)
 */
export const debugDeleteAllJobs = async (req, reply) => {
  try {
    const result = await Job.deleteMany({});
    
    reply.send({
      success: true,
      message: 'All jobs deleted',
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
};
export const debugIngestFromFile = async (req, reply) => {
  try {
    // Find latest debug file
    const debugDir = './debug';
    if (!fs.existsSync(debugDir)) {
      return reply.status(400).send({
        success: false,
        error: 'No debug folder found. Run ingest first to create debug files.',
      });
    }

    const files = fs.readdirSync(debugDir).filter(f => f.startsWith('jobs-'));
    if (files.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'No debug JSON files found.',
      });
    }

    const latestFile = files.sort().pop();
    const filePath = path.join(debugDir, latestFile);
    
    console.log(`\n🔧 DEBUG MODE: Loading jobs from ${latestFile}...`);
    
    const rawData = fs.readFileSync(filePath, 'utf8');
    const jobs = JSON.parse(rawData);
    
    console.log(`✓ Loaded ${jobs.length} jobs from debug file`);

    // Now run the pipeline with these jobs
    const summary = {
      fetched: jobs.length,
      deduplicated: 0,
      saved: 0,
      scored: 0,
      archived: 0,
      error: null,
    };

    // Step 1: Deduplicate
    const dedupJobs = await deduplicateJobs(jobs);
    summary.deduplicated = dedupJobs.length;

    // Step 2: Save to database
    if (dedupJobs.length > 0) {
      try {
        console.log(`\n📝 Attempting to save ${dedupJobs.length} jobs...`);
        console.log(`First job details:`, JSON.stringify(dedupJobs[0], null, 2));
        
        const savedJobs = await Job.create(dedupJobs);
        summary.saved = savedJobs.length;
        console.log(`✅ Successfully saved ${summary.saved} jobs!`);
      } catch (saveError) {
        console.error(`\n❌ SAVE ERROR:`);
        console.error(`   Name: ${saveError.name}`);
        console.error(`   Message: ${saveError.message}`);
        console.error(`   Code: ${saveError.code}`);
        if (saveError.errors) {
          console.error(`   Field Errors:`, saveError.errors);
        }
        summary.error = saveError.message;
        throw saveError;
      }
    }

    // Step 3: Score jobs
    try {
      summary.scored = await scoreAllJobs();
    } catch (scoreError) {
      console.error(`❌ Score error:`, scoreError.message);
      summary.error = scoreError.message;
    }

    // Step 4: Archive old jobs
    try {
      summary.archived = await archiveOldJobs(30);
    } catch (archiveError) {
      console.error(`❌ Archive error:`, archiveError.message);
      summary.error = archiveError.message;
    }

    console.log(`\n✓ Debug ingest completed`);
    console.log(`Summary:`, summary);

    reply.send({
      success: true,
      message: 'Debug ingest from file completed',
      data: summary,
    });
  } catch (error) {
    reply.status(500).send({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
};
