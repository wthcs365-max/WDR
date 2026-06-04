import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { payoutService } from '../services/payout-service';

const router = Router();

router.get('/owner/:ownerId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const history = await payoutService.getPayoutHistory(req.params.ownerId);
    res.json({ data: history });
  } catch (err) { next(err); }
});

export default router;