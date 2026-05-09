'use client';

import { useSSE } from '@/hooks/useSSE';

/**
 * Mounts the SSE connection.
 * This is a thin client component — no UI rendered.
 * Placed inside Redux Provider in layout so useDispatch works.
 */
export function SSEConnector() {
  useSSE();
  return null;
}
