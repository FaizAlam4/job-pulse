import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { connectDB, disconnectDB } from './config/database.js';
import { config } from './config/index.js';
import redis from './config/redis.js';
import { registerJobRoutes, registerUtilityRoutes } from './routes/index.js';
import { startScheduler, stopScheduler } from './schedulers/jobScheduler.js';
import { startNotificationCleanupScheduler, stopNotificationCleanupScheduler } from './schedulers/notificationScheduler.js';
import { allSchemas } from './schemas/index.js';

// Global error handlers to catch crashes
process.on('uncaughtException', (err) => {
  console.error('\n💥 UNCAUGHT EXCEPTION:');
  console.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
});

/**
 * Initialize and start the Fastify server
 */
const initializeServer = async () => {
  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'error' : 'info',
      transport:
        config.nodeEnv === 'production'
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
              },
            },
    },
    ajv: {
      customOptions: {
        // Allow "example" keyword in JSON schemas (used by Swagger/OpenAPI)
        keywords: ['example'],
      },
    },
  });

  // Connect to MongoDB
  await connectDB();

  // Register CORS plugin (MUST BE BEFORE ROUTES)
  // Allows all origins (for demo/portfolio purposes)
  await fastify.register(cors, {
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  console.log('✓ CORS enabled for all origins');

  // Register shared JSON schemas (used for validation + OpenAPI generation)
  for (const schema of allSchemas) {
    fastify.addSchema(schema);
  }

  // Register Swagger (OpenAPI 3.0 spec generation)
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Job Pulse API',
        description: 'Job aggregation, tracking, and analytics platform API',
        version: '1.0.0',
        contact: {
          name: 'Faiz Alam',
          url: 'https://github.com/FaizAlam4/job-pulse',
        },
        license: { name: 'MIT' },
      },
      servers: [
        ...(process.env.API_BASE_URL
          ? [{ url: process.env.API_BASE_URL, description: 'Production' }]
          : []),
        { url: `http://localhost:${config.port}`, description: 'Local development' },
      ],
      tags: [
        { name: 'Jobs', description: 'Job listings — browse, search, and filter aggregated jobs' },
        { name: 'Auth', description: 'Authentication — register, login, and manage profiles' },
        { name: 'Tracking', description: 'Application tracking — Kanban pipeline for job applications' },
        { name: 'Insights', description: 'Personal analytics — trends, goals, skills, and sources' },
        { name: 'Notifications', description: 'System notifications' },
        { name: 'Admin', description: 'Admin operations — ingestion, re-scoring, cleanup' },
        { name: 'System', description: 'Health checks and API info' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter JWT token obtained from /api/auth/login',
          },
        },
      },
    },
  });

  // Register Swagger UI (serves interactive docs at /docs)
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      tryItOutEnabled: true,
    },
  });
  console.log('✓ Swagger UI available at /docs');

  // Register rate limiting plugin (MUST BE BEFORE ROUTES)
  // Protects against DoS attacks and accidental abuse
  await fastify.register(rateLimit, {
    max: 100,                    // Maximum 100 requests
    timeWindow: '15 minutes',    // Per 15-minute window
    cache: 10000,                // Cache size for tracking IPs
    allowList: ['127.0.0.1'],    // Localhost always allowed
    redis: undefined,            // Optional: use Redis for distributed rate limiting
    skipOnError: false,          // Don't skip if error occurs
  });
  console.log('✓ Rate limiting enabled: 100 requests per 15 minutes per IP');

  // Register routes
  await registerUtilityRoutes(fastify);
  await registerJobRoutes(fastify);

  // Start schedulers
  startScheduler();
  startNotificationCleanupScheduler();

  // Graceful shutdown handlers
  const signals = ['SIGTERM', 'SIGINT'];

  const closeGracefully = async (signal) => {
    console.log(`\n⏹ Received ${signal}, shutting down gracefully...`);

    stopScheduler();
    stopNotificationCleanupScheduler();
    await fastify.close();
    if (redis) await redis.quit();
    await disconnectDB();

    process.exit(0);
  };

  signals.forEach((signal) => {
    process.on(signal, () => closeGracefully(signal));
  });

  // Start the server
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });

    console.log('\n╔════════════════════════════════════╗');
    console.log('║   Job Intelligence Engine Started   ║');
    console.log('╚════════════════════════════════════╝\n');
    console.log(`✓ Server running on http://localhost:${config.port}`);
    console.log(`✓ Environment: ${config.nodeEnv}`);
    console.log(`✓ Database: ${config.mongodbUri}`);
    console.log(`✓ Cache: ${config.redisEnabled ? 'Redis enabled' : 'disabled (no REDIS_URL)'}\n`);
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

// Start the server
initializeServer();
