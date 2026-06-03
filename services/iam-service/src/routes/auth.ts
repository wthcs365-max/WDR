// ============================================================================
// IAM Service — Auth Routes
// POST /auth/register, /auth/login, /auth/refresh, /auth/logout
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user-service';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  idNumber: z.string().optional(),
  nationality: z.string().optional(),
  role: z.enum(['renter', 'owner', 'dealer', 'fleet_manager']).optional(),
  referralCode: z.string().optional(),
  referredBy: z.string().uuid().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /auth/register
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await userService.register(input);

    res.status(201).json({
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await userService.login(email, password);

    res.json({
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokens = await userService.refreshToken(refreshToken);

    res.json({
      data: { tokens },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  // In a real implementation, this would invalidate the token
  res.json({
    data: { message: 'Logged out successfully' },
  });
});

export default router;