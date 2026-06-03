// ============================================================================
// IAM Service — Route Aggregator
// ============================================================================

import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;