export const config = {
  port: parseInt(process.env.PORT || '3004', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};