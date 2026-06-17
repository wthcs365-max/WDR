import { Router } from 'express';
import telemetryRoutes from './telemetry';
import internalRoutes from './internal';

const router = Router();

router.use('/telemetry', telemetryRoutes);
router.use('/internal/telemetry', internalRoutes);

export default router;