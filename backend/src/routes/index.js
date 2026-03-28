import {
  getAllJobs,
  getTopRankedJobs,
  getJobById,
  getJobStats,
  searchJobs,
  triggerIngestion,
  resendAllJobs,
  cleanupOldJobs,
  debugIngestFromFile,
  debugDeleteAllJobs,
} from '../controllers/jobController.js';

/**
 * Register all job routes
 * @param {FastifyInstance} fastify - Fastify instance
 */
export const registerJobRoutes = async (fastify) => {
  // Get all jobs (with optional filters)
  fastify.get('/jobs', getAllJobs);

  // Search jobs by keyword
  fastify.get('/jobs/search', searchJobs);

  // Get top-ranked jobs
  fastify.get('/jobs/top', getTopRankedJobs);

  // Get job statistics
  fastify.get('/jobs/stats', getJobStats);

  // Get single job by ID (must be after other /jobs/* routes)
  fastify.get('/jobs/:id', getJobById);

  // Admin: Trigger ingestion pipeline
  fastify.post('/admin/ingest', triggerIngestion);

  // Admin: Re-score all jobs
  fastify.post('/admin/rescore', resendAllJobs);

  // Admin: Clean up old jobs (hard delete for free tier storage)
  fastify.post('/admin/cleanup', cleanupOldJobs);

  // DEBUG: Ingest from debug file (no API calls)
  fastify.post('/admin/debug-ingest', debugIngestFromFile);

  // DEBUG: Delete all jobs
  fastify.post('/admin/debug-delete-all', debugDeleteAllJobs);
};

/**
 * Register health check and info endpoints
 * @param {FastifyInstance} fastify - Fastify instance
 */
export const registerUtilityRoutes = async (fastify) => {
  // Health check
  fastify.get('/health', (req, reply) => {
    reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API info
  fastify.get('/info', (req, reply) => {
    reply.send({
      name: 'Job Intelligence Engine',
      version: '1.0.0',
      description: 'Production-grade job aggregation and ranking system',
      endpoints: {
        'GET /jobs': 'List jobs (?location, ?country, ?state, ?city, ?remote, ?skills, ?page, ?limit, ?sortBy, ?order)',
        'GET /jobs/search': 'Search jobs (?q=keyword&page=1&limit=20)',
        'GET /jobs/top': 'Get top-ranked jobs (?limit=10)',
        'GET /jobs/stats': 'Get job statistics (count, sources, locations)',
        'GET /jobs/:id': 'Get job detail with similar jobs',
        'POST /admin/ingest': 'Trigger job ingestion with filters (see ingestFilters below)',
        'POST /admin/rescore': 'Re-score all jobs',
        'POST /admin/cleanup': 'Delete old jobs (?days=60)',
        'POST /admin/debug-delete-all': 'DEBUG: Delete all jobs',
      },
      filters: {
        location: 'Partial match on location field',
        country: 'Filter by country (USA, UK, India, Germany, Canada, Australia)',
        state: 'Filter by state (California, NY, etc.)',
        city: 'Filter by city (San Francisco, Boulder, etc.)',
        remote: 'true = remote/anywhere jobs only',
        skills: 'Comma-separated: node,python,docker',
        postedWithinHours: 'Jobs posted in last N hours',
      },
      ingestFilters: {
        description: 'Filters supported by POST /admin/ingest (Google Jobs API)',
        query: 'Search query (default: "backend developer")',
        location: 'Location filter (e.g., "San Francisco, CA", "Austin, Texas")',
        country: 'Country filter: USA, UK, India, Germany, Canada, Australia, France, Japan, Singapore',
        remote: '"true" for remote/work-from-home jobs only',
        radius: 'Search radius in kilometers (e.g., 50)',
        timePeriod: 'yesterday, 3days, week, month',
        jobType: 'fulltime, parttime, contract, internship',
        examples: [
          'POST /admin/ingest?location=New%20York&remote=true',
          'POST /admin/ingest?country=UK&jobType=fulltime&timePeriod=week',
          'POST /admin/ingest?query=python%20developer&location=San%20Francisco&timePeriod=3days',
        ],
      },
    });
  });
};
