export const config = {
  port: parseInt(process.env.PORT || '4008', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  defaultProvider: process.env.DEFAULT_NOTIFICATION_PROVIDER || 'mock',
  maxRetries: 3,
  retryDelayMs: 5000,
};