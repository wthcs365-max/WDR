import { Router, Request, Response, NextFunction } from 'express';
import { planService } from '../services/plan-service';

const router = Router();

/** GET /subscriptions/plans */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await planService.listPlans();
    res.json({ data: plans });
  } catch (err) { next(err); }
});

/** GET /subscriptions/plans/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await planService.getPlan(req.params.id);
    res.json({ data: plan });
  } catch (err) { next(err); }
});

export default router;