import { Router } from 'express';
import planRoutes from './plans';
import subscriptionRoutes from './subscriptions';
import internalRoutes from './internal';

const router = Router();

router.use('/subscriptions/plans', planRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/internal/subscriptions', internalRoutes);

export default router;