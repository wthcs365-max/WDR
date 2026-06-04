import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { subscriptionMgmtService } from '../services/subscription-service';
import { billingService } from '../services/billing-service';
import { usageService } from '../services/usage-service';

const router = Router();

const createSubSchema = z.object({
  planId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  autoRenew: z.boolean().optional(),
  paymentMethodId: z.string().min(1),
});

const updateSubSchema = z.object({
  planId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  autoRenew: z.boolean().optional(),
});

/** POST /subscriptions */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = createSubSchema.parse(req.body);
    const sub = await subscriptionMgmtService.createSubscription(req.user!.sub, input);
    res.status(201).json({ data: sub });
  } catch (err) { next(err); }
});

/** GET /subscriptions — List user's subscriptions */
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const subs = await subscriptionMgmtService.listSubscriptions(req.user!.sub);
    res.json({ data: subs });
  } catch (err) { next(err); }
});

/** GET /subscriptions/:id */
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await subscriptionMgmtService.getSubscription(req.params.id);
    res.json({ data: sub });
  } catch (err) { next(err); }
});

/** PATCH /subscriptions/:id */
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateSubSchema.parse(req.body);
    const sub = await subscriptionMgmtService.updateSubscription(req.params.id, req.user!.sub, data);
    res.json({ data: sub });
  } catch (err) { next(err); }
});

/** POST /subscriptions/:id/pause */
router.post('/:id/pause', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await subscriptionMgmtService.pauseSubscription(req.params.id, req.user!.sub);
    res.json({ data: sub });
  } catch (err) { next(err); }
});

/** POST /subscriptions/:id/resume */
router.post('/:id/resume', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await subscriptionMgmtService.resumeSubscription(req.params.id, req.user!.sub);
    res.json({ data: sub });
  } catch (err) { next(err); }
});

/** POST /subscriptions/:id/cancel */
router.post('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await subscriptionMgmtService.cancelSubscription(req.params.id, req.user!.sub);
    res.json({ data: sub });
  } catch (err) { next(err); }
});

/** POST /subscriptions/:id/upgrade */
router.post('/:id/upgrade', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = z.object({ planId: z.string().uuid() }).parse(req.body);
    const sub = await subscriptionMgmtService.changePlan(req.params.id, req.user!.sub, planId);
    res.json({ data: sub });
  } catch (err) { next(err); }
});

/** POST /subscriptions/:id/downgrade */
router.post('/:id/downgrade', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = z.object({ planId: z.string().uuid() }).parse(req.body);
    const sub = await subscriptionMgmtService.changePlan(req.params.id, req.user!.sub, planId);
    res.json({ data: sub });
  } catch (err) { next(err); }
});

/** POST /subscriptions/:id/swap-vehicle */
router.post('/:id/swap-vehicle', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { vehicleId } = z.object({ vehicleId: z.string().uuid() }).parse(req.body);
    const sub = await subscriptionMgmtService.swapVehicle(req.params.id, req.user!.sub, vehicleId);
    res.json({ data: sub });
  } catch (err) { next(err); }
});

/** GET /subscriptions/:id/billing-cycles */
router.get('/:id/billing-cycles', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const result = await billingService.listBillingCycles(req.params.id, page, pageSize);
    res.json({ data: result.cycles, meta: { page, page_size: pageSize, total: result.total } });
  } catch (err) { next(err); }
});

/** GET /subscriptions/:id/billing-cycles/:cycleId */
router.get('/:id/billing-cycles/:cycleId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const cycle = await billingService.getBillingCycle(req.params.cycleId);
    res.json({ data: cycle });
  } catch (err) { next(err); }
});

/** GET /subscriptions/:id/usage */
router.get('/:id/usage', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const usage = await billingService.getCurrentUsage(req.params.id);
    res.json({ data: usage });
  } catch (err) { next(err); }
});

/** GET /subscriptions/:id/usage/history */
router.get('/:id/usage/history', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const history = await usageService.getUsageHistory(req.params.id);
    res.json({ data: history });
  } catch (err) { next(err); }
});

export default router;