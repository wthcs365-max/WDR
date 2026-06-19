import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { notificationService } from '../services/notification-service';

const router = Router();

const sendSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  channels: z.array(z.enum(['email', 'sms', 'push'])).optional(),
  data: z.record(z.any()).optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});

/** POST /notifications/send — Send a custom notification */
router.post('/send', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = sendSchema.parse(req.body);
    const results = await notificationService.send(input);
    res.status(201).json({ data: results });
  } catch (err) { next(err); }
});

/** GET /notifications/history — Get notification history for current user */
router.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const result = await notificationService.getHistory(req.user!.sub, page, pageSize);
    res.json({ data: result.notifications, meta: { page, page_size: pageSize, total: result.total } });
  } catch (err) { next(err); }
});

/** GET /notifications/providers — List available providers */
router.get('/providers', async (_req: AuthenticatedRequest, res: Response) => {
  const providers = notificationService.providerRegistry.listProviders();
  res.json({ data: providers });
});

// ─── Template Endpoints (triggered by other services) ──────────────────────

/** POST /notifications/payment/received */
router.post('/payment/received', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, email, amount, bookingId } = z.object({
      userId: z.string().uuid(), email: z.string().email().optional(), amount: z.number(), bookingId: z.string(),
    }).parse(req.body);
    const event = notificationService.paymentReceived(userId, email, amount, bookingId);
    const results = await notificationService.send(event);
    res.status(201).json({ data: results });
  } catch (err) { next(err); }
});

/** POST /notifications/booking/confirmed */
router.post('/booking/confirmed', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, email, vehicleName, bookingId } = z.object({
      userId: z.string().uuid(), email: z.string().email().optional(), vehicleName: z.string(), bookingId: z.string(),
    }).parse(req.body);
    const event = notificationService.bookingConfirmed(userId, email, vehicleName, bookingId);
    const results = await notificationService.send(event);
    res.status(201).json({ data: results });
  } catch (err) { next(err); }
});

/** POST /notifications/booking/cancelled */
router.post('/booking/cancelled', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, email, vehicleName, bookingId } = z.object({
      userId: z.string().uuid(), email: z.string().email().optional(), vehicleName: z.string(), bookingId: z.string(),
    }).parse(req.body);
    const event = notificationService.bookingCancelled(userId, email, vehicleName, bookingId);
    const results = await notificationService.send(event);
    res.status(201).json({ data: results });
  } catch (err) { next(err); }
});

/** POST /notifications/trust/tier-changed */
router.post('/trust/tier-changed', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, email, newTier, oldTier } = z.object({
      userId: z.string().uuid(), email: z.string().email().optional(), newTier: z.string(), oldTier: z.string(),
    }).parse(req.body);
    const event = notificationService.trustTierChanged(userId, email, newTier, oldTier);
    const results = await notificationService.send(event);
    res.status(201).json({ data: results });
  } catch (err) { next(err); }
});

/** POST /notifications/payout/processed */
router.post('/payout/processed', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, email, amount, bookingId } = z.object({
      userId: z.string().uuid(), email: z.string().email().optional(), amount: z.number(), bookingId: z.string(),
    }).parse(req.body);
    const event = notificationService.payoutProcessed(userId, email, amount, bookingId);
    const results = await notificationService.send(event);
    res.status(201).json({ data: results });
  } catch (err) { next(err); }
});

/** POST /notifications/telemetry/alert */
router.post('/telemetry/alert', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, email, phone, alertType, severity, message } = z.object({
      userId: z.string().uuid(), email: z.string().email().optional(), phone: z.string().optional(),
      alertType: z.string(), severity: z.string(), message: z.string(),
    }).parse(req.body);
    const event = notificationService.telemetryAlert(userId, email, phone, alertType, severity, message);
    const results = await notificationService.send(event);
    res.status(201).json({ data: results });
  } catch (err) { next(err); }
});

export default router;