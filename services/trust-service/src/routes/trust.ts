// ============================================================================
// Trust Service — Trust Score Routes (Internal & User-facing)
// ============================================================================

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { trustService } from '../services/trust-service';
import { trustPersistence } from '../services/trust-persistence';
import { UserRole } from '@wdr/shared-types';

const internalRouter = Router();
const userRouter = Router();

// ─── Internal Endpoints ─────────────────────────────────────────────────────

/**
 * POST /internal/trust/score/calculate/:userId
 * Trigger score calculation (admin/internal)
 */
internalRouter.post('/score/calculate/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await trustService.calculateScore(req.params.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /internal/trust/score/:userId
 * Get current score snapshot
 */
internalRouter.get('/score/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const score = await trustService.getScore(req.params.userId);
    if (!score) {
      res.status(404).json({
        error: { code: 'SCORE_NOT_FOUND', message: 'No trust score found for this user' },
      });
      return;
    }
    res.json({ data: score });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /internal/trust/score/:userId/history
 * Get score event history
 */
internalRouter.get('/score/:userId/history', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const history = await trustService.getScoreHistory(req.params.userId);
    res.json({ data: history });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /internal/trust/score/:userId/explain
 * Human-readable score explanation
 */
internalRouter.get('/score/:userId/explain', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const explanation = await trustService.getExplanation(req.params.userId);
    res.json({ data: { explanation } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /internal/trust/waiver/evaluate
 * Evaluate deposit waiver eligibility for a booking
 */
internalRouter.post('/waiver/evaluate', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      renterId: z.string().uuid(),
      bookingId: z.string().uuid(),
      depositAmount: z.number().positive(),
    });
    const input = schema.parse(req.body);
    const result = await trustService.evaluateWaiver(input.renterId, input.bookingId, input.depositAmount);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /internal/trust/event
 * Ingest a scoring event
 */
internalRouter.post('/event', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      eventType: z.string().min(1),
      reason: z.string().min(1),
      referenceId: z.string().uuid().optional(),
    });
    const input = schema.parse(req.body);
    await trustService.ingestEvent(input.userId, input.eventType, input.reason, input.referenceId);
    res.status(201).json({ data: { message: 'Event ingested' } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /internal/trust/deposits — List deposits (admin)
 */
internalRouter.get('/deposits', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const result = await trustPersistence.listDeposits(page, pageSize);
    res.json({
      data: result.deposits,
      meta: { page, page_size: pageSize, total: result.total },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /internal/trust/claims — List claims (admin)
 */
internalRouter.get('/claims', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const result = await trustPersistence.listClaims(page, pageSize);
    res.json({
      data: result.claims,
      meta: { page, page_size: pageSize, total: result.total },
    });
  } catch (err) {
    next(err);
  }
});

// ─── User-facing Endpoints ──────────────────────────────────────────────────

/**
 * GET /trust/score — Get my trust score
 */
userRouter.get('/score', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const score = await trustService.getScore(req.user!.sub);
    if (!score) {
      res.json({ data: { message: 'No trust score yet. Complete onboarding to get started.' } });
      return;
    }
    res.json({ data: score });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /trust/score/history — My score event history
 */
userRouter.get('/score/history', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const history = await trustService.getScoreHistory(req.user!.sub);
    res.json({ data: history });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /trust/summary — Tier summary + benefits breakdown
 */
userRouter.get('/summary', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const score = await trustService.getScore(req.user!.sub);
    if (!score) {
      res.json({
        data: {
          tier: 'unrated',
          benefits: [],
          message: 'Complete onboarding to unlock your trust score',
        },
      });
      return;
    }

    const explanation = await trustService.getExplanation(req.user!.sub);
    res.json({
      data: {
        overallScore: score.overallScore,
        tier: score.tier,
        components: score.components,
        waiverEligible: score.waiverEligible,
        maxWaiverAmount: score.maxWaiverAmount,
        benefits: {
          depositWaiver: score.waiverEligible
            ? `Up to ZAR ${score.maxWaiverAmount.toLocaleString()} (${score.waiverFeePercent}% fee)`
            : 'Full deposit required',
          vehicleAccess: score.tier,
          insuranceAdjustment: `${score.insuranceAdjustment > 0 ? '+' : ''}${score.insuranceAdjustment}%`,
          subscriptionDiscount: `${score.subscriptionDiscount > 0 ? '+' : ''}${score.subscriptionDiscount}%`,
        },
        explanation,
      },
    });
  } catch (err) {
    next(err);
  }
});

export { internalRouter, userRouter };