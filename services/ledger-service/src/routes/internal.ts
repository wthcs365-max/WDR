import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { transactionService } from '../services/transaction-service';
import { commissionService } from '../services/commission-service';
import { payoutService } from '../services/payout-service';
import { TransactionType, LedgerDirection } from '@wdr/shared-types';

const router = Router();

/** POST /internal/ledger/transactions — Create payment transaction (service-to-service) */
router.post('/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      walletId: z.string().uuid(),
      transactionType: z.nativeEnum(TransactionType),
      direction: z.nativeEnum(LedgerDirection),
      amountZar: z.number().positive(),
      referenceType: z.string().optional(),
      referenceId: z.string().uuid().optional(),
      description: z.string().optional(),
      debitAccount: z.string().optional(),
      creditAccount: z.string().optional(),
    });
    const input = schema.parse(req.body);
    const tx = await transactionService.createTransaction(req.user!.sub, input, input.debitAccount, input.creditAccount);
    res.status(201).json({ data: tx });
  } catch (err) { next(err); }
});

/** POST /internal/ledger/commissions — Create commission record */
router.post('/commissions', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      bookingId: z.string().uuid(),
      ownerId: z.string().uuid(),
      grossAmountZar: z.number().positive(),
      ownershipType: z.string(),
      ownerTrustTier: z.string().optional(),
      ownerVehicleCount: z.number().int().optional(),
    });
    const input = schema.parse(req.body);
    const commission = await commissionService.calculateCommission(
      input.bookingId, input.ownerId, input.grossAmountZar,
      input.ownershipType, input.ownerTrustTier, input.ownerVehicleCount
    );
    res.status(201).json({ data: commission });
  } catch (err) { next(err); }
});

/** POST /internal/ledger/payouts/process — Trigger batch payout */
router.post('/payouts/process', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const maxItems = parseInt(req.body.maxItems) || 50;
    const result = await payoutService.processBatchPayouts(maxItems);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/** POST /internal/ledger/refund — Issue refund */
router.post('/refund', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      amountZar: z.number().positive(),
      referenceType: z.string(),
      referenceId: z.string().uuid(),
      description: z.string(),
    });
    const { userId, amountZar, referenceType, referenceId, description } = schema.parse(req.body);
    const tx = await transactionService.refund(userId, amountZar, referenceType, referenceId, description);
    res.json({ data: tx });
  } catch (err) { next(err); }
});

export default router;