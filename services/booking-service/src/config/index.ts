export const config = {
  port: parseInt(process.env.PORT || '4003', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};