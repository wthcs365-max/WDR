import { Router, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { analyticsEngine } from '../services/analytics-engine';
import { UserRole } from '@wdr/shared-types';

const router = Router();

/** GET /analytics/fleet — Fleet utilization overview */
router.get('/fleet', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const result = await analyticsEngine.getFleetUtilization(req.user!.sub, days);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/** GET /analytics/fleet/over-time — Daily utilization breakdown */
router.get('/fleet/over-time', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const result = await analyticsEngine.getUtilizationOverTime(req.user!.sub, days);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/** GET /analytics/vehicles/top — Top-performing vehicles */
router.get('/vehicles/top', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await analyticsEngine.getTopVehicles(req.user!.sub, limit);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/** GET /analytics/vehicles/revenue — Revenue by vehicle */
router.get('/vehicles/revenue', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsEngine.getRevenueByVehicle(req.user!.sub);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/** GET /analytics/revenue — Revenue summary */
router.get('/revenue', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsEngine.getDashboardSummary(req.user!.sub);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/** GET /analytics/payouts/monthly — Monthly payout report */
router.get('/payouts/monthly', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const result = await analyticsEngine.getMonthlyPayoutReport(req.user!.sub, year, month);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/** GET /analytics/admin/trust-distribution — Trust score distribution (admin) */
router.get('/admin/trust-distribution', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsEngine.getTrustScoreDistribution();
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;