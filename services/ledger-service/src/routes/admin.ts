import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthenticatedRequest } from '@wdr/auth-middleware';
import { walletService } from '../services/wallet-service';
import { transactionService } from '../services/transaction-service';
import { commissionService } from '../services/commission-service';
import { payoutService } from '../services/payout-service';
import { UserRole } from '@wdr/shared-types';

const router = Router();
router.use(requireAuth);
router.use(requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get('/wallets/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.getWalletById(req.params.id);
    res.json({ data: wallet });
  } catch (err) { next(err); }
});

router.post('/wallets/:id/freeze', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.freezeWallet(req.params.id);
    res.json({ data: wallet });
  } catch (err) { next(err); }
});

router.post('/wallets/:id/unfreeze', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.unfreezeWallet(req.params.id);
    res.json({ data: wallet });
  } catch (err) { next(err); }
});

router.post('/payouts/batch', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const maxItems = parseInt(req.body.maxItems) || 50;
    const result = await payoutService.processBatchPayouts(maxItems);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;