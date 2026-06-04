import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { transactionService } from '../services/transaction-service';

const router = Router();

const captureSchema = z.object({
  amountZar: z.number().positive(),
  bookingId: z.string().uuid(),
  description: z.string().min(1),
});

const refundSchema = z.object({
  amountZar: z.number().positive(),
  referenceType: z.string().min(1),
  referenceId: z.string().uuid(),
  description: z.string().min(1),
});

router.post('/capture', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { amountZar, bookingId, description } = captureSchema.parse(req.body);
    const tx = await transactionService.capturePayment(req.user!.sub, amountZar, bookingId, description);
    res.status(201).json({ data: tx });
  } catch (err) { next(err); }
});

router.post('/refund', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { amountZar, referenceType, referenceId, description } = refundSchema.parse(req.body);
    const tx = await transactionService.refund(req.user!.sub, amountZar, referenceType, referenceId, description);
    res.json({ data: tx });
  } catch (err) { next(err); }
});

export default router;