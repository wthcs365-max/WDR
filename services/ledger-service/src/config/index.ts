export const config = {
  port: parseInt(process.env.PORT || '4004', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  vatRate: 0.15,
  platformProcessingFee: 0.025,
  defaultOwnerP2PRate: 0.20,
  diamondOwnerP2PRate: 0.15,
  dealerStandardRate: 0.12,
  dealerVolumeRate: 0.10,
  dealerVolumeThreshold: 10,
  payoutDelayHours: 48,
  depositReleaseDelayHours: 24,
};