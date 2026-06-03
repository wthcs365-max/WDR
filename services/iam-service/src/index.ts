// ============================================================================
// WTH Drive Rentals — IAM Service
// Identity & Access Management Microservice
// ============================================================================

import express from 'express';
import cors from 'cors';
import router from './routes';
import { errorHandler } from './utils/error-handler';
import { config } from './config';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'iam-service', timestamp: new Date().toISOString() });
});

// API routes
app.use('/v1', router);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`[IAM Service] Running on port ${config.port}`);
});

export default app;