import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { transactionService } from '../services/transaction-service';

const router = Router();

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tx = await transactionService.getTransaction(req.params.id);
    res.json({ data: tx });
  } catch (err) { next(err); }
});

router.post('/:id/retry', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tx = await transactionService.retryTransaction(req.params.id);
    res.json({ data: tx });
  } catch (err) { next(err); }
});

router.post('/:id/reverse', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tx = await transactionService.reverseTransaction(req.params.id);
    res.json({ data: tx });
  } catch (err) { next(err); }
});

export default router;