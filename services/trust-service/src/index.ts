// ============================================================================
// WTH Drive Rentals — Trust Service
// Trust Scoring Engine, Deposit Waiver & Risk Management Microservice
// ============================================================================

import express from 'express';
import cors from 'cors';
import router from './routes';
import { errorHandler } from './utils/error-handler';
import { config } from './config';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'trust-service', timestamp: new Date().toISOString() });
});

// API routes
app.use('/v1', router);

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`[Trust Service] Running on port ${config.port}`);
});

export default app;