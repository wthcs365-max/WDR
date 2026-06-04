import { Router } from 'express';
import walletRoutes from './wallet';
import transactionRoutes from './transactions';
import paymentRoutes from './payments';
import commissionRoutes from './commissions';
import payoutRoutes from './payouts';
import invoiceRoutes from './invoices';
import adminRoutes from './admin';
import internalRoutes from './internal';

const router = Router();

router.use('/wallet', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payments', paymentRoutes);
router.use('/commissions', commissionRoutes);
router.use('/payouts', payoutRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/admin', adminRoutes);
router.use('/internal/ledger', internalRoutes);

export default router;