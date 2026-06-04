export const config = {
  port: parseInt(process.env.PORT || '4007', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dunningRetryDays: [1, 3, 7],
  pauseAfterDaysOverdue: 14,
  cancelAfterDaysOverdue: 30,
};