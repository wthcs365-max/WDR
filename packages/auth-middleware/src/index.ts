// ============================================================================
// WTH Drive Rentals — JWT Auth Middleware
// Handles token verification, role-based access, and optional auth
// ============================================================================

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload, UserRole } from '@wdr/shared-types';

const getSecret = (): string => {
  return process.env.JWT_SECRET || 'wdr-dev-secret-do-not-use-in-production';
};

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Required authentication — rejects if no valid JWT is present
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
    });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, getSecret()) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: {
        code: 'TOKEN_INVALID',
        message: 'Token is invalid or expired',
      },
    });
  }
}

/**
 * Optional authentication — attaches user if token present, but doesn't reject
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, getSecret()) as JwtPayload;
      req.user = decoded;
    } catch {
      // Silently ignore invalid tokens for optional auth
    }
  }
  next();
}

/**
 * Role-based access control — must be used after requireAuth
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${roles.join(' or ')}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '1h' });
}

/**
 * Generate refresh token (longer-lived)
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, getSecret(), { expiresIn: '7d' });
}