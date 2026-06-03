// ============================================================================
// IAM Service — Configuration
// ============================================================================

export const config = {
  port: parseInt(process.env.PORT || '4001', 10),
  jwtSecret: process.env.JWT_SECRET || 'wdr-dev-secret-do-not-use-in-production',
  jwtExpiresIn: '1h',
  jwtRefreshExpiresIn: '7d',
  bcryptRounds: 12,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};