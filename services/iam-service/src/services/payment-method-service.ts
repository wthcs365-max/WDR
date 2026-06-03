// ============================================================================
// IAM Service — Payment Method Service
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const paymentMethodService = {
  /**
   * Add a payment method
   */
  async add(userId: string, data: {
    methodType: string;
    provider: string;
    token: string;
    lastFour?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cardBrand?: string;
    isDefault?: boolean;
  }): Promise<any> {
    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await prisma.userPaymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.userPaymentMethod.create({
      data: { ...data, userId },
    });
  },

  /**
   * List user's payment methods
   */
  async list(userId: string): Promise<any[]> {
    return prisma.userPaymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  },

  /**
   * Remove a payment method
   */
  async remove(id: string, userId: string): Promise<void> {
    const method = await prisma.userPaymentMethod.findFirst({
      where: { id, userId },
    });
    if (!method) {
      throw new Error('Payment method not found');
    }
    await prisma.userPaymentMethod.delete({ where: { id } });
  },
};