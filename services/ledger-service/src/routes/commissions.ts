import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { commissionService } from '../services/commission-service';

const router = Router();

router.get('/booking/:bookingId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const commission = await commissionService.getByBookingId(req.params.bookingId);
    res.json({ data: commission });
  } catch (err) { next(err); }
});

router.get('/owner/:ownerId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await commissionService.getOwnerSummary(req.params.ownerId);
    res.json({ data: summary });
  } catch (err) { next(err); }
});

export default router;