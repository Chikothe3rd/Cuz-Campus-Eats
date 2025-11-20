import { logger } from '@/lib/log';

// Global error handlers for production visibility
window.addEventListener('error', (event) => {
  logger.error('Global error', { message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', { reason: event.reason });
});
