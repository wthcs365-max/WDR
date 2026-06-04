import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { walletService } from '../services/wallet-service';

const router = Router();

/** GET /wallet */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.getWallet(req.user!.sub);
    res.json({ data: wallet });
  } catch (err) { next(err); }
});

/** POST /wallet/top-up */
router.post('/top-up', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { amountZar } = z.object({ amountZar: z.number().positive() }).parse(req.body);
    const wallet = await walletService.topUp(req.user!.sub, amountZar);
    res.json({ data: wallet });
  } catch (err) { next(err); }
});

/** GET /wallet/transactions */
router.get('/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const wallet = await walletService.getWallet(req.user!.sub);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const { transactionService } = await import('../services/transaction-service');
    const result = await transactionService.listTransactions(wallet.id, page, pageSize);
    res.json({ data: result.transactions, meta: { page, page_size: pageSize, total: result.total } });
  } catch (err) { next(err); }
});

export default router;