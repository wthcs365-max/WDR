// ============================================================================
// Trust Service — Route Aggregator
// ============================================================================

import { Router } from 'express';
import { internalRouter, userRouter } from './trust';

const router = Router();

// Internal service endpoints (for other services)
// Mounted at /v1/internal/trust
router.use('/internal/trust', internalRouter);

// User-facing endpoints
// Mounted at /v1/trust
router.use('/trust', userRouter);

export default router;