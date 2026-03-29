// src/middleware/apiKeyAuth.js

/**
 * Fastify preHandler to protect a specific endpoint with an API key
 * Usage: { preHandler: apiKeyAuth }
 */
export async function apiKeyAuth(request, reply) {
  const apiKey = request.headers['x-api-key'] || request.query.api_key;
  const validKey = process.env.ADMIN_API_KEY || 'changeme';
  if (!apiKey || apiKey !== validKey) {
    reply.code(401).send({ error: 'Unauthorized: Invalid or missing API key' });
  }
}
