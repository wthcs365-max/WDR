import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4050', 10),
  subgraphs: [
    { name: 'auth', url: process.env.AUTH_SERVICE_URL || 'http://localhost:4001/graphql' },
    { name: 'iam', url: process.env.IAM_SERVICE_URL || 'http://localhost:4001/graphql' },
    { name: 'fleet', url: process.env.FLEET_SERVICE_URL || 'http://localhost:4002/graphql' },
    { name: 'booking', url: process.env.BOOKING_SERVICE_URL || 'http://localhost:4003/graphql' },
    { name: 'ledger', url: process.env.LEDGER_SERVICE_URL || 'http://localhost:4004/graphql' },
    { name: 'trust', url: process.env.TRUST_SERVICE_URL || 'http://localhost:4005/graphql' },
    { name: 'telemetry', url: process.env.TELEMETRY_SERVICE_URL || 'http://localhost:4006/graphql' },
    { name: 'subscription', url: process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:4007/graphql' },
  ]
};
