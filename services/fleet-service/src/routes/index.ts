// ============================================================================
// Fleet Service — Route Aggregator
// ============================================================================

import { Router } from 'express';
import vehicleRoutes from './vehicles';
import ownerRoutes from './owner';
import makeRoutes from './makes';
import deviceRoutes from './devices';

const router = Router();

router.use('/vehicles', vehicleRoutes);
router.use('/vehicles/makes', makeRoutes);
router.use('/owner', ownerRoutes);
router.use('/devices', deviceRoutes);

export default router;