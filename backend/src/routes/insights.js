/**
 * Insights Routes
 * Personal analytics and stats endpoints
 */

import {
  getOverviewStats,
  getApplicationTrends,
  getSourcesBreakdown,
  getSkillsAnalysis,
  getGoalsProgress,
} from '../controllers/insightsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

export default async function insightsRoutes(fastify) {
  // All insights routes require authentication
  fastify.addHook('preHandler', authenticateToken);

  // GET /insights/overview - Dashboard overview stats
  fastify.get('/overview', {
    schema: {
      tags: ['Insights'],
      summary: 'Dashboard overview statistics',
      description: 'Returns total applications, status breakdown, response rate, weekly growth, top companies, and priority distribution.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalApplications: { type: 'integer' },
                statusBreakdown: { type: 'object' },
                responseRate: { type: 'number' },
                avgTimeToResponse: { type: 'integer', nullable: true },
                thisWeekApplications: { type: 'integer' },
                lastWeekApplications: { type: 'integer' },
                weeklyGrowth: { type: 'number' },
                topCompanies: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      count: { type: 'integer' },
                    },
                  },
                },
                priorityDistribution: { type: 'object' },
              },
            },
          },
        },
      },
    },
  }, getOverviewStats);

  // GET /insights/trends - Application trends over time
  fastify.get('/trends', {
    schema: {
      tags: ['Insights'],
      summary: 'Application trends over time',
      description: 'Returns daily and cumulative application counts grouped by date for chart rendering.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'integer', default: 30, description: 'Number of days to look back' },
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
                daily: { type: 'array', items: { type: 'object' } },
                cumulative: { type: 'array', items: { type: 'object' } },
                period: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  }, getApplicationTrends);

  // GET /insights/sources - Breakdown by job sources
  fastify.get('/sources', {
    schema: {
      tags: ['Insights'],
      summary: 'Job source performance breakdown',
      description: 'Compare success and response rates across different job sources (Google Jobs, Remotive, etc.).',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  total: { type: 'integer' },
                  responses: { type: 'integer' },
                  offers: { type: 'integer' },
                  responseRate: { type: 'number' },
                  offerRate: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  }, getSourcesBreakdown);

  // GET /insights/skills - Skills analysis
  fastify.get('/skills', {
    schema: {
      tags: ['Insights'],
      summary: 'Skills analysis from tracked jobs',
      description: 'Extracts and categorizes skills from all tracked job snapshots with success rates per skill.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                topSkills: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      keyword: { type: 'string' },
                      count: { type: 'integer' },
                      offers: { type: 'integer' },
                      interviews: { type: 'integer' },
                      successRate: { type: 'number' },
                    },
                  },
                },
                categories: {
                  type: 'object',
                  properties: {
                    languages: { type: 'array', items: { type: 'object' } },
                    frameworks: { type: 'array', items: { type: 'object' } },
                    tools: { type: 'array', items: { type: 'object' } },
                    soft: { type: 'array', items: { type: 'object' } },
                    other: { type: 'array', items: { type: 'object' } },
                  },
                },
                totalUniqueSkills: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  }, getSkillsAnalysis);

  // GET /insights/goals - Goals and progress
  fastify.get('/goals', {
    schema: {
      tags: ['Insights'],
      summary: 'Weekly goals, progress, and streaks',
      description: 'Returns weekly/monthly application targets, current progress, and application streaks.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                goals: { type: 'object' },
                streaks: {
                  type: 'object',
                  properties: {
                    current: { type: 'integer' },
                    longest: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, getGoalsProgress);
}
