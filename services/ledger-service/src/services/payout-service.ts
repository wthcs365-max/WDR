// ============================================================================
// Ledger Service — Payout Service
// Manages owner/dealer payouts with scheduling and batch processing
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

export const payoutService = {
  /**
   * Get payout history for an owner
   */
  async getPayoutHistory(ownerId: string) {
    const commissions = await prisma.commission.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return commissions.map(c => ({
      id: c.id,
      bookingId: c.bookingId,
      grossAmount: Number(c.grossAmountZar),
      commissionAmount: Number(c.commissionAmountZar),
      platformFee: Number(c.platformFeeZar),
      payoutAmount: Number(c.ownerPayoutZar),
      status: c.status,
      paidAt: c.paidAt?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
    }));
  },

  /**
   * Process pending payouts as a batch
   */
  async processBatchPayouts(maxItems: number = 50): Promise<{
    processed: number;
    totalAmount: number;
    errors: string[];
  }> {
    const pendingCommissions = await prisma.commission.findMany({
      where: {
        status: { in: ['calculated', 'invoice'] },
        paidAt: null,
      },
      take: maxItems,
      orderBy: { createdAt: 'asc' },
    });

    const errors: string[] = [];
    let processed = 0;
    let totalAmount = 0;

    for (const commission of pendingCommissions) {
      try {
        // In production: call EFT/real-time payment API
        // For now, we simulate a successful payout

        await prisma.commission.update({
          where: { id: commission.id },
          data: { status: 'paid', paidAt: new Date() },
        });

        processed++;
        totalAmount += Number(commission.ownerPayoutZar);
      } catch (err: any) {
        errors.push(`Failed to process commission ${commission.id}: ${err.message}`);
      }
    }

    return { processed, totalAmount, errors };
  },

  /**
   * Schedule a payout (in production: queue to payment gateway)
   */
  async schedulePayout(
    ownerId: string,
    amountZar: number,
    delayHours: number = config.payoutDelayHours
  ): Promise<{ scheduledAt: string; estimatedPayout: string }> {
    const now = new Date();
    const payoutDate = new Date(now.getTime() + delayHours * 60 * 60 * 1000);

    // In production: create a payout record in a queue
    return {
      scheduledAt: now.toISOString(),
      estimatedPayout: payoutDate.toISOString(),
    };
  },
};