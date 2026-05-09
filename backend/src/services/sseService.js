/**
 * SSE (Server-Sent Events) Service
 *
 * Manages a global set of connected clients.
 * All events from the ingestion pipeline are broadcast to every connected browser —
 * no per-user filtering is needed because DB notifications carry no userId.
 */

/** @type {Set<import('fastify').FastifyReply>} */
const clients = new Set();

/**
 * Register a new SSE client
 * @param {import('fastify').FastifyReply} reply
 */
export function addClient(reply) {
  clients.add(reply);
}

/**
 * Remove an SSE client (on disconnect)
 * @param {import('fastify').FastifyReply} reply
 */
export function removeClient(reply) {
  clients.delete(reply);
}

/**
 * Broadcast a named event to every connected client.
 * Dead connections are silently pruned.
 * @param {string} event - SSE event name
 * @param {object} data  - payload (will be JSON-stringified)
 */
export function broadcast(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const reply of clients) {
    try {
      reply.raw.write(message);
    } catch (_) {
      // Client already disconnected — clean up
      clients.delete(reply);
    }
  }
}

/**
 * Convenience: tell all browsers that new jobs were ingested.
 * @param {number} count
 */
export function broadcastNewJobs(count) {
  broadcast('new-jobs', { count });
}

/** @returns {number} */
export function getClientCount() {
  return clients.size;
}
