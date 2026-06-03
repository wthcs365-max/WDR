// ============================================================================
// Fleet Service — Vehicle Make & Model Routes
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { makeModelService } from '../services/make-model-service';

const router = Router();

/**
 * GET /vehicles/makes
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const makes = await makeModelService.getMakes();
    res.json({ data: makes });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /vehicles/makes/:id/models
 */
router.get('/:id/models', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await makeModelService.getModels(parseInt(req.params.id));
    res.json({ data: models });
  } catch (err) {
    next(err);
  }
});

export default router;