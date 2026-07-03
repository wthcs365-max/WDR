import { Router } from 'express';
import partnerRoutes from './partner';

const router = Router();
router.use('/partner', partnerRoutes);
export default router;