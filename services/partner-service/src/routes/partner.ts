import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { tbybService, calculateLeadScore, LeadScoringInput } from '../services/tbyb-engine';

const router = Router();

const createLeadSchema = z.object({
  renterId: z.string().uuid(),
  dealerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  bookingId: z.string().uuid(),
  tripDurationDays: z.number().min(0),
  renterTrustScore: z.number().min(0).max(1000),
  vehicleViewCount: z.number().int().min(0),
  extendedTrip: z.boolean(),
  priorPurchaseHistory: z.boolean(),
});

const transitionSchema = z.object({
  status: z.enum(['ACTIVE', 'CONTACTED', 'NEGOTIATING', 'CONVERTED', 'LOST']),
  conversionNotes: z.string().optional(),
});

/** POST /partner/tbyb/leads — Create a TBYB lead (triggered by renter interest) */
router.post('/tbyb/leads', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = createLeadSchema.parse(req.body);
    const scoringInput: LeadScoringInput = {
      tripDurationDays: input.tripDurationDays,
      renterTrustScore: input.renterTrustScore,
      vehicleViewCount: input.vehicleViewCount,
      extendedTrip: input.extendedTrip,
      priorPurchaseHistory: input.priorPurchaseHistory,
    };
    const lead = await tbybService.createLead(
      input.renterId, input.dealerId, input.vehicleId, input.bookingId, scoringInput
    );
    res.status(201).json({ data: lead });
  } catch (err) { next(err); }
});

/** GET /partner/tbyb/leads/:bookingId — Get lead details */
router.get('/tbyb/leads/:bookingId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const lead = await tbybService.getLead(req.params.bookingId);
    if (!lead) {
      res.status(404).json({ error: { code: 'LEAD_NOT_FOUND', message: 'TBYB lead not found' } });
      return;
    }
    res.json({ data: lead });
  } catch (err) { next(err); }
});

/** PATCH /partner/tbyb/leads/:bookingId/status — Transition lead status */
router.patch('/tbyb/leads/:bookingId/status', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = transitionSchema.parse(req.body);
    const lead = await tbybService.transitionLead(req.params.bookingId, status);
    res.json({ data: lead });
  } catch (err) { next(err); }
});

/** POST /partner/tbyb/leads/:bookingId/convert — Convert lead (shortcut) */
router.post('/tbyb/leads/:bookingId/convert', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const lead = await tbybService.transitionLead(req.params.bookingId, 'CONVERTED');
    res.json({ data: lead });
  } catch (err) { next(err); }
});

/** GET /partner/tbyb/leads — List leads (filtered by dealer, optional status) */
router.get('/tbyb/leads', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const dealerId = (req.query.dealerId as string) || req.user!.sub;
    const statusFilter = req.query.status as any;
    const leads = await tbybService.listLeadsForDealer(dealerId, statusFilter);
    res.json({ data: leads });
  } catch (err) { next(err); }
});

/** POST /partner/tbyb/expire — Trigger lead expiry job (admin) */
router.post('/tbyb/expire', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const expiredCount = await tbybService.expireStaleLeads();
    res.json({ data: { expiredCount } });
  } catch (err) { next(err); }
});

/** POST /partner/tbyb/score — Calculate lead score (utility) */
router.post('/tbyb/score', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = createLeadSchema.parse(req.body);
    const scoringInput: LeadScoringInput = {
      tripDurationDays: input.tripDurationDays,
      renterTrustScore: input.renterTrustScore,
      vehicleViewCount: input.vehicleViewCount,
      extendedTrip: input.extendedTrip,
      priorPurchaseHistory: input.priorPurchaseHistory,
    };
    const score = calculateLeadScore(scoringInput);
    res.json({ data: { score, isHotLead: score >= 70 } });
  } catch (err) { next(err); }
});

export default router;