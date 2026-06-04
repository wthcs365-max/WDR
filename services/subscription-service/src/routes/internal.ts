import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { subscriptionMgmtService } from '../services/subscription-service';
import { billingService } from '../services/billing-service';

const router = Router();

/** POST /internal/subscriptions/check-eligibility */
router.post('/check-eligibility', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ userId: z.string().uuid(), planId: z.string().uuid() });
    const { userId, planId } = schema.parse(req.body);
    const result = await subscriptionMgmtService.checkEligibility(userId, planId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/** POST /internal/subscriptions/record-usage */
router.post('/record-usage', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      subscriptionId: z.string().uuid(),
      kmDriven: z.number().min(0),
      hoursUsed: z.number().min(0),
    });
    const { subscriptionId, kmDriven, hoursUsed } = schema.parse(req.body);
    await billingService.recordUsage(subscriptionId, kmDriven, hoursUsed);
    res.status(201).json({ data: { message: 'Usage recorded' } });
  } catch (err) { next(err); }
});

/** POST /internal/subscriptions/trigger-billing */
router.post('/trigger-billing', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await billingService.generateMonthlyBilling();
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;