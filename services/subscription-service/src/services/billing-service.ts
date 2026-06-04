// ============================================================================
// Subscription Service — Billing Service
// Manages billing cycles, usage calculation, invoices, and dunning
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { BillingCycleResponse } from '@wdr/shared-types';

const prisma = new PrismaClient();

function toBillingCycleResponse(cycle: any): BillingCycleResponse {
  const usage = (cycle.usageData as any) || {};
  return {
    id: cycle.id,
    periodStart: cycle.periodStart.toISOString(),
    periodEnd: cycle.periodEnd.toISOString(),
    amountZar: Number(cycle.amountZar),
    status: cycle.status,
    usage: {
      km: usage.km || 0,
      excessKm: usage.excessKm || 0,
      excessCharge: usage.excessCharge || 0,
    },
    invoiceId: cycle.invoiceId || null,
  };
}

export const billingService = {
  /**
   * List billing cycles for a subscription
   */
  async listBillingCycles(
    subscriptionId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ cycles: BillingCycleResponse[]; total: number }> {
    const [cycles, total] = await Promise.all([
      prisma.billingCycle.findMany({
        where: { subscriptionId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { periodStart: 'desc' },
      }),
      prisma.billingCycle.count({ where: { subscriptionId } }),
    ]);

    return { cycles: cycles.map(toBillingCycleResponse), total };
  },

  /**
   * Get a specific billing cycle
   */
  async getBillingCycle(id: string): Promise<BillingCycleResponse> {
    const cycle = await prisma.billingCycle.findUnique({ where: { id } });
    if (!cycle) throw new Error('Billing cycle not found');
    return toBillingCycleResponse(cycle);
  },

  /**
   * Calculate usage for a period (KM tracking)
   */
  async calculateUsage(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ totalKm: number; excessKm: number; excessCharge: number }> {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });
    if (!sub) throw new Error('Subscription not found');

    // In production: query telemetry for KM driven in period
    // For now, use stored usage data
    const cycle = await prisma.billingCycle.findFirst({
      where: { subscriptionId, periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } },
    });

    const usageData = (cycle?.usageData as any) || { km: 0 };
    const totalKm = usageData.km || 0;
    const includedKm = sub.plan.includedKm || 0;
    const excessKm = Math.max(0, totalKm - includedKm);
    const excessRate = sub.plan.excessKmRateZar ? Number(sub.plan.excessKmRateZar) : 0;
    const excessCharge = Math.round(excessKm * excessRate * 100) / 100;

    return { totalKm, excessKm, excessCharge };
  },

  /**
   * Record usage for a subscription
   */
  async recordUsage(
    subscriptionId: string,
    kmDriven: number,
    hoursUsed: number
  ): Promise<void> {
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) throw new Error('Subscription not found');

    // Update the current billing cycle usage
    const currentCycle = await prisma.billingCycle.findFirst({
      where: {
        subscriptionId,
        periodStart: { lte: new Date() },
        periodEnd: { gte: new Date() },
      },
    });

    if (currentCycle) {
      const existingUsage = (currentCycle.usageData as any) || { km: 0, days: 0 };
      await prisma.billingCycle.update({
        where: { id: currentCycle.id },
        data: {
          usageData: {
            km: (existingUsage.km || 0) + kmDriven,
            days: (existingUsage.days || 0) + (hoursUsed > 0 ? 1 : 0),
          },
        },
      });
    }
  },

  /**
   * Generate monthly billing cycles (scheduled job)
   */
  async generateMonthlyBilling(): Promise<{ processed: number }> {
    const activeSubs = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: { lte: new Date() },
        autoRenew: true,
      },
      include: { plan: true },
    });

    let processed = 0;

    for (const sub of activeSubs) {
      const metadata = (sub.metadata as any) || {};
      const adjustedPrice = metadata.trustAdjustedPrice || Number(sub.plan.priceZar);

      // Calculate usage for ending period
      const usage = await this.calculateUsage(sub.id, sub.currentPeriodStart, sub.currentPeriodEnd);

      // Create new billing cycle
      const newStart = new Date(sub.currentPeriodEnd);
      const newEnd = new Date(newStart);
      newEnd.setMonth(newEnd.getMonth() + 1);

      await prisma.billingCycle.create({
        data: {
          subscriptionId: sub.id,
          periodStart: newStart,
          periodEnd: newEnd,
          amountZar: adjustedPrice + usage.excessCharge,
          status: 'pending',
          usageData: { km: usage.totalKm, excessKm: usage.excessKm, excessCharge: usage.excessCharge },
        },
      });

      // Update subscription period
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodStart: newStart,
          currentPeriodEnd: newEnd,
        },
      });

      processed++;
    }

    return { processed };
  },

  /**
   * Get current usage for a subscription
   */
  async getCurrentUsage(
    subscriptionId: string
  ): Promise<{ km: number; days: number }> {
    const cycle = await prisma.billingCycle.findFirst({
      where: {
        subscriptionId,
        periodStart: { lte: new Date() },
        periodEnd: { gte: new Date() },
      },
    });

    const usage = (cycle?.usageData as any) || {};
    return { km: usage.km || 0, days: usage.days || 0 };
  },
};