// ============================================================================
// IAM Service — User Routes
// GET /users/me, PATCH /users/me, GET /users/me/kyc, etc.
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '@wdr/auth-middleware';
import { userService } from '../services/user-service';
import { kycService } from '../services/kyc-service';
import { paymentMethodService } from '../services/payment-method-service';

const router = Router();

const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  preferredName: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  dateOfBirth: z.string().optional(),
});

const uploadKycSchema = z.object({
  documentType: z.enum([
    'id_document', 'drivers_license', 'passport',
    'proof_of_address', 'selfie', 'bank_statement',
  ]),
  documentUrl: z.string().url(),
});

const addPaymentMethodSchema = z.object({
  methodType: z.enum(['card', 'bank_account', 'ewallet', 'crypto']),
  provider: z.string().min(1),
  token: z.string().min(1),
  lastFour: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().optional(),
  cardBrand: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/**
 * GET /users/me
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getById(req.user!.sub);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /users/me
 */
router.patch('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile(req.user!.sub, input);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /users/me/kyc — List KYC documents
 */
router.get('/me/kyc', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const documents = await kycService.listDocuments(req.user!.sub);
    res.json({ data: documents });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /users/me/kyc — Upload KYC document
 */
router.post('/me/kyc', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { documentType, documentUrl } = uploadKycSchema.parse(req.body);
    const doc = await kycService.uploadDocument(req.user!.sub, documentType, documentUrl);
    res.status(201).json({ data: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /users/me/payment-methods
 */
router.get('/me/payment-methods', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const methods = await paymentMethodService.list(req.user!.sub);
    res.json({ data: methods });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /users/me/payment-methods
 */
router.post('/me/payment-methods', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = addPaymentMethodSchema.parse(req.body);
    const method = await paymentMethodService.add(req.user!.sub, input);
    res.status(201).json({ data: method });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /users/me/payment-methods/:id
 */
router.delete('/me/payment-methods/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await paymentMethodService.remove(req.params.id, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;