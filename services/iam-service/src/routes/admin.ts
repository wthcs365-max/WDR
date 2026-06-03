// ============================================================================
// IAM Service — Admin Routes
// ============================================================================

import { Router, Response, NextFunction } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '@wdr/auth-middleware';
import { userService } from '../services/user-service';
import { kycService } from '../services/kyc-service';
import { UserRole } from '@wdr/shared-types';

const router = Router();

// All admin routes require admin role
router.use(requireAuth);
router.use(requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN));

/**
 * GET /admin/users — List users (admin)
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const result = await userService.list(page, pageSize);

    res.json({
      data: result.users,
      meta: {
        page,
        page_size: pageSize,
        total: result.total,
        request_id: `req_${Date.now()}`,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/kyc/pending
 */
router.get('/kyc/pending', async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const result = await kycService.getPendingVerifications(page, pageSize);

    res.json({
      data: result.documents,
      meta: { page, page_size: pageSize, total: result.total },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/kyc/:id/approve
 */
router.post('/kyc/:id/approve', async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const doc = await kycService.approveDocument(req.params.id, req.user!.sub);
    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /admin/kyc/:id/reject
 */
router.post('/kyc/:id/reject', async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Rejection reason is required' },
      });
      return;
    }
    const doc = await kycService.rejectDocument(req.params.id, req.user!.sub, reason);
    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
});

export default router;