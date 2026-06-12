import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { tripManager } from '../services/trip-manager';
import { ingestionService } from '../services/ingestion-service';
import { trustIntegration } from '../services/trust-integration';

const router = Router();

/** POST /internal/telemetry/trip/start — Start trip tracking */
router.post('/trip/start', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ bookingId: z.string().uuid(), vehicleId: z.string().uuid(), deviceId: z.string().uuid() });
    const { bookingId, vehicleId, deviceId } = schema.parse(req.body);
    const trip = await tripManager.startTrip(bookingId, vehicleId, deviceId);
    res.status(201).json({ data: trip });
  } catch (err) { next(err); }
});

/** POST /internal/telemetry/trip/end — End trip, return summary */
router.post('/trip/end', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.body);
    const summary = await tripManager.endTrip(tripId);

    // Calculate trust score impact
    const { delta, description } = trustIntegration.calculateScoreDelta(summary.score);
    const trustEvent = trustIntegration.buildTrustEvent(
      '', // userId would come from booking lookup
      'trip_completed',
      delta,
      description,
      summary.id
    );

    res.json({ data: { trip: summary, trustImpact: { delta, description } } });
  } catch (err) { next(err); }
});

/** GET /internal/telemetry/trip/:id — Get trip raw data */
router.get('/trip/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const trip = await tripManager.getTripDetail(req.params.id);
    res.json({ data: trip });
  } catch (err) { next(err); }
});

/** GET /internal/telemetry/vehicle/:id/last — Last known position */
router.get('/vehicle/:id/last', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const position = await ingestionService.getLastPosition(req.params.id);
    res.json({ data: position });
  } catch (err) { next(err); }
});

/** GET /internal/telemetry/driving-score/:userId — Aggregate driving score */
router.get('/driving-score/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const trips = await tripManager.getTripHistory(req.params.userId, 1, 50);
    const scores = trips.trips.filter(t => t.score !== null).map(t => t.score);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;

    res.json({ data: { averageScore: avgScore, totalTrips: scores.length, recentScores: scores.slice(0, 10) } });
  } catch (err) { next(err); }
});

export default router;