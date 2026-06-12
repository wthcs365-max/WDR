import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { ingestionService } from '../services/ingestion-service';
import { tripManager } from '../services/trip-manager';
import { trustIntegration } from '../services/trust-integration';

const router = Router();

const telemetryEventSchema = z.object({
  deviceId: z.string().min(1),
  vehicleId: z.string().optional(),
  eventType: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  altitudeM: z.number().optional(),
  headingDeg: z.number().optional(),
  speedKmh: z.number().optional(),
  odometerKm: z.number().int().optional(),
  fuelLevelPct: z.number().optional(),
  engineRpm: z.number().int().optional(),
  batteryVoltage: z.number().optional(),
  evChargePct: z.number().optional(),
  engineTempC: z.number().optional(),
  tirePressurePsi: z.record(z.number()).optional(),
  dtcCodes: z.array(z.string()).optional(),
  deviceBatteryPct: z.number().int().optional(),
  signalStrength: z.number().int().optional(),
  accuracyM: z.number().optional(),
  recordedAt: z.string(),
  metadata: z.record(z.any()).optional(),
});

const telemetryBatchSchema = z.object({
  events: z.array(telemetryEventSchema),
});

/** POST /telemetry/events — Ingest a single telemetry event */
router.post('/events', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = telemetryEventSchema.parse(req.body);
    const event = await ingestionService.ingest(input);
    res.status(201).json({ data: event });
  } catch (err) { next(err); }
});

/** POST /telemetry/batch — Ingest batch of events */
router.post('/batch', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { events } = telemetryBatchSchema.parse(req.body);
    const result = await ingestionService.ingestBatch(events);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
});

/** GET /telemetry/vehicles/:id/last — Get last known position */
router.get('/vehicles/:id/last', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const position = await ingestionService.getLastPosition(req.params.id);
    res.json({ data: position });
  } catch (err) { next(err); }
});

/** GET /telemetry/vehicles/:id/trip/current — Get current active trip */
router.get('/vehicles/:id/trip/current', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const trip = await tripManager.getCurrentTrip(req.params.id);
    res.json({ data: trip });
  } catch (err) { next(err); }
});

/** GET /telemetry/vehicles/:id/trip/history — Get trip history */
router.get('/vehicles/:id/trip/history', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const result = await tripManager.getTripHistory(req.params.id, page, pageSize);
    res.json({ data: result.trips, meta: { page, page_size: pageSize, total: result.total } });
  } catch (err) { next(err); }
});

/** GET /telemetry/vehicles/:id/events — Get recent events */
router.get('/vehicles/:id/events', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await ingestionService.getRecentEvents(req.params.id, limit);
    res.json({ data: events });
  } catch (err) { next(err); }
});

/** GET /telemetry/trips/:id — Get trip detail */
router.get('/trips/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const trip = await tripManager.getTripDetail(req.params.id);
    res.json({ data: trip });
  } catch (err) { next(err); }
});

export default router;