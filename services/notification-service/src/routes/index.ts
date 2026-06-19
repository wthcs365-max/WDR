import { Router } from 'express';
import notificationRoutes from './notifications';

const router = Router();

router.use('/notifications', notificationRoutes);

export default router;