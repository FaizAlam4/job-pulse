import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import { connectDB, disconnectDB } from './config/database.js';
import { config } from './config/index.js';
import { registerJobRoutes, registerUtilityRoutes } from './routes/index.js';
import { startScheduler, stopScheduler } from './schedulers/jobScheduler.js';
import { startNotificationCleanupScheduler, stopNotificationCleanupScheduler } from './schedulers/notificationScheduler.js';

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
  });

  // Connect to MongoDB
  await connectDB();

  // Register CORS plugin (MUST BE BEFORE ROUTES)
  // Allows frontend to make requests to the API
  await fastify.register(cors, {
    origin: ['http://localhost:3005', 'http://localhost:3000', 'http://127.0.0.1:3005'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  console.log('✓ CORS enabled for frontend origins');

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
    console.log(`✓ Database: ${config.mongodbUri}\n`);
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

// Start the server
initializeServer();
