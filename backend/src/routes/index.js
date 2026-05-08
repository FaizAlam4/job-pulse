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
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { registerNotificationRoutes } from './notification.js';
import { registerAuthRoutes } from './auth.js';
import trackingRoutes from './tracking.js';
import insightsRoutes from './insights.js';

/**
 * Register all job routes
 * @param {FastifyInstance} fastify - Fastify instance
 */
export const registerJobRoutes = async (fastify) => {
  // Get all jobs (with optional filters)
  fastify.get('/jobs', {
    schema: {
      tags: ['Jobs'],
      summary: 'List jobs with filters and pagination',
      description: 'Returns paginated job listings with optional filtering by location, skills, remote status, and more.',
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by title, company, or keywords' },
          location: { type: 'string', description: 'Filter by location (partial match)' },
          country: { type: 'string', description: 'Filter by country (USA, UK, India, etc.)' },
          state: { type: 'string', description: 'Filter by state (California, NY, etc.)' },
          city: { type: 'string', description: 'Filter by city' },
          remote: { type: 'string', enum: ['true', 'false'], description: 'Remote jobs only' },
          skills: { type: 'string', description: 'Comma-separated skills (node,react,python)' },
          postedWithinHours: { type: 'integer', description: 'Jobs posted within last N hours' },
          limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          page: { type: 'integer', default: 1, minimum: 1 },
          sortBy: { type: 'string', enum: ['score', 'postedAt', 'company'], default: 'score' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { $ref: 'Job#' } },
            filters: { type: 'object' },
            pagination: { $ref: 'Pagination#' },
          },
        },
      },
    },
  }, getAllJobs);

  // Search jobs by keyword
  fastify.get('/jobs/search', {
    schema: {
      tags: ['Jobs'],
      summary: 'Full-text search across jobs',
      description: 'Search job titles, companies, descriptions, and locations with fuzzy matching.',
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 2, description: 'Search query (min 2 chars)' },
          limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          page: { type: 'integer', default: 1, minimum: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { $ref: 'Job#' } },
            query: { type: 'string' },
            pagination: { $ref: 'Pagination#' },
          },
        },
        400: { $ref: 'ErrorResponse#' },
      },
    },
  }, searchJobs);

  // Get top-ranked jobs
  fastify.get('/jobs/top', {
    schema: {
      tags: ['Jobs'],
      summary: 'Get top-ranked jobs by score',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 10, minimum: 1, maximum: 50 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { $ref: 'Job#' } },
            count: { type: 'integer' },
          },
        },
      },
    },
  }, getTopRankedJobs);

  // Get job statistics
  fastify.get('/jobs/stats', {
    schema: {
      tags: ['Jobs'],
      summary: 'Get aggregate job statistics',
      description: 'Returns total counts, average scores, top locations, and source breakdown.',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                overall: {
                  type: 'object',
                  properties: {
                    totalJobs: { type: 'integer' },
                    avgScore: { type: 'number' },
                    newestJob: { type: 'string', format: 'date-time', nullable: true },
                    oldestJob: { type: 'string', format: 'date-time', nullable: true },
                  },
                },
                bySource: { type: 'array', items: { type: 'object' } },
                topLocations: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },
  }, getJobStats);

  // Get single job by ID (must be after other /jobs/* routes)
  fastify.get('/jobs/:id', {
    schema: {
      tags: ['Jobs'],
      summary: 'Get job detail with similar jobs',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'MongoDB ObjectId' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                job: { $ref: 'Job#' },
                similarJobs: { type: 'array', items: { $ref: 'JobSummary#' } },
              },
            },
          },
        },
        404: { $ref: 'ErrorResponse#' },
      },
    },
  }, getJobById);

  // Admin: Trigger ingestion pipeline (protected by API key)
  fastify.post('/admin/ingest', {
    preHandler: apiKeyAuth,
    schema: {
      tags: ['Admin'],
      summary: 'Trigger job ingestion pipeline',
      description: 'Manually trigger the fetch → deduplicate → save → score → archive pipeline. Supports Google Jobs API filters.',
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (default: "backend developer")' },
          location: { type: 'string', description: 'Location filter (e.g., "San Francisco, CA")' },
          country: { type: 'string', description: 'Country filter (USA, UK, India, etc.)' },
          remote: { type: 'string', enum: ['true', 'false'], description: 'Remote jobs only' },
          radius: { type: 'integer', description: 'Search radius in km' },
          timePeriod: { type: 'string', enum: ['yesterday', '3days', 'week', 'month'] },
          jobType: { type: 'string', enum: ['fulltime', 'parttime', 'contract', 'internship'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            filtersApplied: {},
            data: { type: 'object' },
          },
        },
      },
    },
  }, triggerIngestion);

  // Admin: Re-score all jobs
  fastify.post('/admin/rescore', {
    schema: {
      tags: ['Admin'],
      summary: 'Re-score all active jobs',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            count: { type: 'integer' },
          },
        },
      },
    },
  }, resendAllJobs);

  // Admin: Clean up old jobs (hard delete for free tier storage)
  fastify.post('/admin/cleanup', {
    schema: {
      tags: ['Admin'],
      summary: 'Delete old jobs',
      description: 'Hard-deletes jobs older than N days to save storage on Atlas free tier.',
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 60, minimum: 7, description: 'Delete jobs older than N days' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
  }, cleanupOldJobs);

  // DEBUG: Ingest from debug file (no API calls)
  fastify.post('/admin/debug-ingest', {
    schema: {
      tags: ['Admin'],
      summary: '[DEBUG] Ingest jobs from local file',
      description: 'Loads jobs from a local debug JSON file instead of calling external APIs.',
    },
  }, debugIngestFromFile);

  // DEBUG: Delete all jobs
  fastify.post('/admin/debug-delete-all', {
    schema: {
      tags: ['Admin'],
      summary: '[DEBUG] Delete all jobs',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: { deletedCount: { type: 'integer' } },
            },
          },
        },
      },
    },
  }, debugDeleteAllJobs);

  // Register notification routes
  await registerNotificationRoutes(fastify);
  
  // Register authentication routes
  await registerAuthRoutes(fastify);
  
  // Register tracking routes (protected by auth - handled inside plugin)
  await fastify.register(trackingRoutes, { 
    prefix: '/tracking'
  });
  
  // Register insights routes (protected by auth - handled inside plugin)
  await fastify.register(insightsRoutes, { 
    prefix: '/insights'
  });
};

/**
 * Register health check and info endpoints
 * @param {FastifyInstance} fastify - Fastify instance
 */
export const registerUtilityRoutes = async (fastify) => {
  // Health check
  fastify.get('/health', {
    schema: {
      tags: ['System'],
      summary: 'Health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, (req, reply) => {
    reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API info
  fastify.get('/info', {
    schema: {
      tags: ['System'],
      summary: 'API information and available endpoints',
      response: { 200: { type: 'object' } },
    },
  }, (req, reply) => {
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
