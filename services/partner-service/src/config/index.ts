export const config = {
  port: parseInt(process.env.PORT || '4010', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  tbybLeadExpiryDays: 30,
  tbybHotLeadThreshold: 70,
  tbybSuccessFeeZar: 1500,
  tbybConversionPct: 0.02,
};