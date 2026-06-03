// ============================================================================
// Fleet Service — Vehicle Routes
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { vehicleService } from '../services/vehicle-service';

const router = Router();

const createVehicleSchema = z.object({
  ownershipType: z.enum(['private_owner', 'dealer', 'fleet_operator', 'wdr_owned']),
  modelId: z.number().int().positive(),
  year: z.number().int().min(1990).max(2030),
  color: z.string().optional(),
  vin: z.string().optional(),
  registrationPlate: z.string().optional(),
  mileageKm: z.number().int().min(0),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']),
  transmission: z.enum(['manual', 'automatic', 'cvt', 'dsg']),
  seats: z.number().int().min(1).max(15).default(5),
  doors: z.number().int().min(1).max(7).default(4),
  dailyRateZar: z.number().positive(),
  weeklyRateZar: z.number().positive().optional(),
  monthlyRateZar: z.number().positive().optional(),
  depositZar: z.number().positive().optional(),
  features: z.array(z.string()).optional(),
  insuranceTier: z.enum(['basic', 'standard', 'premium', 'wdr_shield_waived']).optional(),
  isP2pEnabled: z.boolean().optional(),
  isVaasEnabled: z.boolean().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

const updateVehicleSchema = createVehicleSchema.partial();

/**
 * GET /vehicles — Search vehicles
 */
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await vehicleService.search({
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      radiusKm: req.query.radius_km ? parseInt(req.query.radius_km as string) : undefined,
      startDate: req.query.start_date as string | undefined,
      endDate: req.query.end_date as string | undefined,
      minRate: req.query.min_rate ? parseFloat(req.query.min_rate as string) : undefined,
      maxRate: req.query.max_rate ? parseFloat(req.query.max_rate as string) : undefined,
      makes: req.query.makes as string | undefined,
      transmission: req.query.transmission as any,
      fuelType: req.query.fuel_type as string | undefined,
      minSeats: req.query.min_seats ? parseInt(req.query.min_seats as string) : undefined,
      features: req.query.features as string | undefined,
      ownershipType: req.query.ownership_type as any,
      p2pEnabled: req.query.p2p_enabled === 'true',
      vaasEnabled: req.query.vaas_enabled === 'true',
      sort: req.query.sort as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.page_size ? parseInt(req.query.page_size as string) : undefined,
    });

    res.json({
      data: result.vehicles,
      meta: {
        page: parseInt(req.query.page as string) || 1,
        page_size: parseInt(req.query.page_size as string) || 20,
        total: result.total,
        request_id: `req_${Date.now()}`,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /vehicles/:id — Get vehicle details
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await vehicleService.getById(req.params.id);
    res.json({ data: vehicle });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /vehicles/:id/availability — Get availability calendar
 */
router.get('/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const availability = await vehicleService.getAvailability(
      req.params.id,
      req.query.start_date as string,
      req.query.end_date as string
    );
    res.json({ data: availability });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /vehicles — Create vehicle listing
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = createVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.create(req.user!.sub, input);
    res.status(201).json({ data: vehicle });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /vehicles/:id — Update vehicle listing
 */
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.update(req.params.id, req.user!.sub, input);
    res.json({ data: vehicle });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /vehicles/:id — Remove vehicle listing
 */
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await vehicleService.remove(req.params.id, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;