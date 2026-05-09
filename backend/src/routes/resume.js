/**
 * Resume Analysis Routes
 * 
 * POST /resume/analyze - Analyze resume (auth required)
 * GET /resume/status - Check feature availability
 * POST /resume/history - Save analysis (auth required)
 * GET /resume/history - List saved analyses (auth required)
 * GET /resume/history/:id - Get saved analysis (auth required)
 * DELETE /resume/history/:id - Delete saved analysis (auth required)
 */

import resumeController, { saveAnalysis, getHistory, getAnalysisById, deleteAnalysis } from '../controllers/resumeController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

// Rate limit: 5 requests per hour per user
const resumeRateLimit = {
  max: 5,
  timeWindow: '1 hour',
  keyGenerator: (request) => request.user?.id || request.ip,
  errorResponseBuilder: () => ({
    success: false,
    error: 'Rate limit exceeded. You can analyze up to 5 resumes per hour.',
  }),
};

export default async function resumeRoutes(fastify, options) {
  // Status endpoint (public) - no multipart needed
  fastify.get('/status', {
    schema: {
      description: 'Check resume analysis feature availability',
      tags: ['Resume'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                available: { type: 'boolean' },
                provider: { type: 'string', nullable: true },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, resumeController.status);

  // Analyze endpoint needs multipart - register in a sub-scope
  fastify.register(async function analyzeScope(scopedFastify) {
    await scopedFastify.register(import('@fastify/multipart'), {
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1,
      },
    });

    scopedFastify.post('/analyze', {
      preHandler: authenticateToken,
      config: {
        rateLimit: resumeRateLimit,
      },
      schema: {
        description: 'Analyze a resume PDF and get improvement suggestions + job matches',
        tags: ['Resume'],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  overallScore: { type: 'number' },
                  fixes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        section: { type: 'string' },
                        issue: { type: 'string' },
                        suggestion: { type: 'string' },
                        priority: { type: 'string' },
                      },
                    },
                  },
                  matchedJobs: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        jobId: { type: 'string' },
                        title: { type: 'string' },
                        company: { type: 'string' },
                        matchScore: { type: 'number' },
                        reason: { type: 'string' },
                      },
                    },
                  },
                  extractedSkills: { type: 'array', items: { type: 'string' } },
                  summary: { type: 'string' },
                  tokensUsed: { type: 'number' },
                  analysisTime: { type: 'number' },
                  jobsAnalyzed: { type: 'number' },
                  provider: { type: 'string' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
          429: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    }, resumeController.analyze);
  });

  // History endpoints - JSON body, no multipart needed
  fastify.post('/history', {
    preHandler: authenticateToken,
    schema: {
      description: 'Save a resume analysis result',
      tags: ['Resume'],
    },
  }, saveAnalysis);

  fastify.get('/history', {
    preHandler: authenticateToken,
    schema: {
      description: 'Get saved resume analyses',
      tags: ['Resume'],
    },
  }, getHistory);

  fastify.get('/history/:id', {
    preHandler: authenticateToken,
    schema: {
      description: 'Get a saved resume analysis by ID',
      tags: ['Resume'],
    },
  }, getAnalysisById);

  fastify.delete('/history/:id', {
    preHandler: authenticateToken,
    schema: {
      description: 'Delete a saved resume analysis',
      tags: ['Resume'],
    },
  }, deleteAnalysis);
}
