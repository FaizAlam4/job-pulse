/**
 * Global test setup — runs before each test file.
 * Stubs environment variables so no .env file is needed.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt';
process.env.ADMIN_API_KEY = 'test-admin-key';
process.env.SERPAPI_KEY = '';
process.env.REDIS_ENABLED = 'false';
process.env.REDIS_URL = '';
