export interface Notification {
  _id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  meta?: Record<string, any>;
  createdAt: string;
  dedupKey?: string;
}
