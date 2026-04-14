export const formatColdStartError = (
  error: unknown,
  fallbackMessage: string
): string => {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes('timeout') ||
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('fetch')
  ) {
    return 'The server is waking up or the network is slow. Please try again in a few seconds.';
  }

  return error.message || fallbackMessage;
};