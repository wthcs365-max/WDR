// ============================================================================
// Fleet Service — Telematics Device Routes
// ============================================================================

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { deviceService } from '../services/device-service';

const router = Router();

const registerDeviceSchema = z.object({
  vehicleId: z.string().uuid(),
  deviceImei: z.string().min(1),
  deviceType: z.enum(['obd2', 'gps_tracker', 'telematics_unit', 'ble_tag']),
  firmwareVersion: z.string().optional(),
});

/**
 * POST /devices — Register a device
 */
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = registerDeviceSchema.parse(req.body);
    const device = await deviceService.register(req.user!.sub, input);
    res.status(201).json({ data: device });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /devices/:vehicleId — Get device for a vehicle
 */
router.get('/:vehicleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const device = await deviceService.getByVehicle(req.params.vehicleId);
    if (!device) {
      res.status(404).json({
        error: { code: 'DEVICE_NOT_FOUND', message: 'No device registered for this vehicle' },
      });
      return;
    }
    res.json({ data: device });
  } catch (err) {
    next(err);
  }
});

export default router;