// ============================================================================
// IAM Service — User Service (business logic)
// ============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import {
  CreateUserInput,
  UpdateUserInput,
  UserResponse,
  AuthTokens,
  JwtPayload,
} from '@wdr/shared-types';

const prisma = new PrismaClient();

function toUserResponse(user: any): UserResponse {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    fullName: user.fullName,
    preferredName: user.preferredName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isActive: user.isActive,
    isOnboarded: user.isOnboarded,
    createdAt: user.createdAt.toISOString(),
  };
}

function generateTokens(userId: string, role: string): AuthTokens {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: userId,
    role: role as any,
    permissions: ['book', 'list_vehicle'],
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600, // 1 hour in seconds
  };
}

export const userService = {
  /**
   * Register a new user
   */
  async register(input: CreateUserInput): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError('EMAIL_EXISTS', 'A user with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        idNumber: input.idNumber,
        nationality: input.nationality || 'ZA',
        role: input.role || 'renter',
        referralCode: input.referralCode,
        referredBy: input.referredBy,
      },
    });

    const tokens = generateTokens(user.id, user.role);
    return { user: toUserResponse(user), tokens };
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('ACCOUNT_DISABLED', 'This account has been disabled', 403);
    }

    const tokens = generateTokens(user.id, user.role);
    return { user: toUserResponse(user), tokens };
  },

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtSecret) as any;
      if (decoded.type !== 'refresh') {
        throw new AppError('INVALID_TOKEN', 'Invalid refresh token', 401);
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user || !user.isActive) {
        throw new AppError('USER_NOT_FOUND', 'User not found or inactive', 404);
      }

      return generateTokens(user.id, user.role);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('INVALID_TOKEN', 'Invalid or expired refresh token', 401);
    }
  },

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    return toUserResponse(user);
  },

  /**
   * Update user profile
   */
  async updateProfile(id: string, input: UpdateUserInput): Promise<UserResponse> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName: input.fullName,
        preferredName: input.preferredName,
        phone: input.phone,
        avatarUrl: input.avatarUrl,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      },
    });
    return toUserResponse(user);
  },

  /**
   * List users (admin)
   */
  async list(page: number = 1, pageSize: number = 20): Promise<{ users: UserResponse[]; total: number }> {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      users: users.map(toUserResponse),
      total,
    };
  },
};

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}