// ============================================================================
// Fleet Service — Owner Routes
// ============================================================================

import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { vehicleService } from '../services/vehicle-service';

const router = Router();

/**
 * GET /owner/vehicles — List my vehicles
 */
router.get('/vehicles', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vehicles = await vehicleService.listByOwner(req.user!.sub);
    res.json({ data: vehicles });
  } catch (err) {
    next(err);
  }
});

export default router;