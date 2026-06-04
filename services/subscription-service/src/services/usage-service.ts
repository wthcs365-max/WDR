// ============================================================================
// Subscription Service — Usage Service
// Historical usage tracking and queries
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const usageService = {
  /**
   * Get historical usage for a subscription
   */
  async getUsageHistory(subscriptionId: string): Promise<any[]> {
    const cycles = await prisma.billingCycle.findMany({
      where: { subscriptionId },
      orderBy: { periodStart: 'desc' },
      take: 12, // Last 12 periods
    });

    return cycles.map(c => ({
      periodStart: c.periodStart.toISOString(),
      periodEnd: c.periodEnd.toISOString(),
      usage: c.usageData,
      amount: Number(c.amountZar),
      status: c.status,
    }));
  },
};