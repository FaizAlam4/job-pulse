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

  // GET /api/insights/overview - Dashboard overview stats
  fastify.get('/overview', getOverviewStats);

  // GET /api/insights/trends - Application trends over time
  fastify.get('/trends', getApplicationTrends);

  // GET /api/insights/sources - Breakdown by job sources
  fastify.get('/sources', getSourcesBreakdown);

  // GET /api/insights/skills - Skills analysis
  fastify.get('/skills', getSkillsAnalysis);

  // GET /api/insights/goals - Goals and progress
  fastify.get('/goals', getGoalsProgress);
}
