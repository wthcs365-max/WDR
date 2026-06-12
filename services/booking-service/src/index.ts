// ============================================================================
// WTH Drive Rentals — Booking Service
// Booking Lifecycle, State Machine & Orchestration
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
  res.json({ status: 'ok', service: 'booking-service', timestamp: new Date().toISOString() });
});

// Mock Auth Middleware
app.use((req, res, next) => {
  (req as any).user = {
    sub: '00000000-0000-0000-0000-000000000001', // Example Renter UUID
    role: 'renter',
  };
  next();
});

// API routes
app.use('/v1', router);

// Error handler
app.use(errorHandler);

// Start server
const port = Number(process.env.PORT) || 3004;
app.listen(port, '0.0.0.0', () => {
  console.log(`[Booking Service] Running on port ${port}`);
});

export default app;
