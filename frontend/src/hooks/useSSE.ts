import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { newJobsReceived, fetchNotificationsRequest } from '@/modules/notifications/store/notificationSlice';
import { API_BASE_URL } from '@/constants/api';

const RETRY_DELAY_MS = 5000;

/**
 * Opens a persistent SSE connection to the backend /events endpoint.
 * - Automatically reconnects after 5 s on error.
 * - On `new-jobs` event: increments unreadCount in Redux so the bell shows a badge.
 * - No auth required: all notifications in this app are global (no userId in DB).
 */
export function useSSE() {
  const dispatch = useDispatch();

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      es = new EventSource(`${API_BASE_URL}/events`);

      es.addEventListener('new-jobs', (e: MessageEvent) => {
        try {
          JSON.parse(e.data); // validate payload
          // Each SSE event = 1 new notification (regardless of job count inside)
          dispatch(newJobsReceived(1));
          // Also refresh the notifications list so modal shows new items
          dispatch(fetchNotificationsRequest({ page: 1 }));
        } catch (_) {
          dispatch(newJobsReceived(1));
          dispatch(fetchNotificationsRequest({ page: 1 }));
        }
      });

      es.onerror = () => {
        es.close();
        if (!unmounted) {
          retryTimeout = setTimeout(connect, RETRY_DELAY_MS);
        }
      };
    }

    connect();

    return () => {
      unmounted = true;
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, [dispatch]);
}
