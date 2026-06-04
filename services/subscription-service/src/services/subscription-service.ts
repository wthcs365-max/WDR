// ============================================================================
// Subscription Service — Subscription Lifecycle Service
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  SubscriptionResponse,
  CreateSubscriptionInput,
  SubscriptionStatus,
  BillingPeriod,
} from '@wdr/shared-types';

const prisma = new PrismaClient();

const TRUST_DISCOUNTS: Record<string, number> = {
  diamond: 0.85,
  platinum: 0.90,
  gold: 0.95,
  silver: 1.00,
  bronze: 1.15,
};

const MINIMUM_TRUST_TIERS: Record<string, string> = {
  vaas_flex: 'silver',
  vaas_plus: 'gold',
  vaas_business: 'bronze',
  wdr_plus_membership: 'bronze',
};

function calculatePeriodEnd(start: Date, period: string): Date {
  const end = new Date(start);
  switch (period) {
    case 'weekly': end.setDate(end.getDate() + 7); break;
    case 'biweekly': end.setDate(end.getDate() + 14); break;
    case 'monthly': end.setMonth(end.getMonth() + 1); break;
    case 'quarterly': end.setMonth(end.getMonth() + 3); break;
    case 'annual': end.setFullYear(end.getFullYear() + 1); break;
  }
  return end;
}

export const subscriptionMgmtService = {
  /**
   * Check if user is eligible for a plan based on trust tier
   */
  async checkEligibility(userId: string, planId: string): Promise<{ eligible: boolean; reason?: string }> {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) return { eligible: false, reason: 'Plan not found' };

    const minTier = MINIMUM_TRUST_TIERS[plan.planType];
    if (!minTier) return { eligible: true };

    const trustScore = await prisma.trustScore.findUnique({ where: { userId } });
    if (!trustScore) return { eligible: false, reason: 'Trust score required' };

    const tierOrder = ['restricted', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const userTierIdx = tierOrder.indexOf(trustScore.tier);
    const minTierIdx = tierOrder.indexOf(minTier);

    if (userTierIdx < minTierIdx) {
      return { eligible: false, reason: `Minimum trust tier required: ${minTier}` };
    }

    return { eligible: true };
  },

  /**
   * Create a new subscription
   */
  async createSubscription(
    userId: string,
    input: CreateSubscriptionInput
  ): Promise<SubscriptionResponse> {
    // Check eligibility
    const eligibility = await this.checkEligibility(userId, input.planId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Not eligible for this plan');
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
    if (!plan) throw new Error('Plan not found');

    // Get trust score for pricing
    const trustScore = await prisma.trustScore.findUnique({ where: { userId } });
    const multiplier = trustScore ? (TRUST_DISCOUNTS[trustScore.tier] || 1.0) : 1.0;
    const adjustedPrice = Math.round(Number(plan.priceZar) * multiplier * 100) / 100;

    const now = new Date();
    const periodEnd = calculatePeriodEnd(now, plan.billingPeriod);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: input.planId,
        vehicleId: input.vehicleId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew: input.autoRenew ?? true,
        metadata: {
          basePrice: Number(plan.priceZar),
          trustAdjustedPrice: adjustedPrice,
          trustTier: trustScore?.tier || 'unknown',
        },
      },
    });

    // Create initial billing cycle
    await prisma.billingCycle.create({
      data: {
        subscriptionId: subscription.id,
        periodStart: now,
        periodEnd,
        amountZar: adjustedPrice,
        status: 'pending',
        usageData: { km: 0, days: 0 },
      },
    });

    return this.getSubscription(subscription.id);
  },

  /**
   * Get subscription by ID
   */
  async getSubscription(id: string): Promise<SubscriptionResponse> {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        vehicle: { include: { model: { include: { make: true } } } },
        billingCycles: { orderBy: { periodStart: 'desc' }, take: 1 },
      },
    });

    if (!sub) throw new Error('Subscription not found');

    const metadata = (sub.metadata as any) || {};
    const currentCycle = sub.billingCycles[0];
    const usage = (currentCycle?.usageData as any) || { km: 0, days: 0 };

    return {
      id: sub.id,
      planId: sub.planId,
      planName: sub.plan.name,
      vehicleId: sub.vehicleId,
      vehicleName: sub.vehicle
        ? `${sub.vehicle.model.make.name} ${sub.vehicle.model.name}`
        : null,
      status: sub.status as SubscriptionStatus,
      currentPeriodStart: sub.currentPeriodStart.toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      priceZar: Number(sub.plan.priceZar),
      trustAdjustedPrice: metadata.trustAdjustedPrice || Number(sub.plan.priceZar),
      usageCurrentPeriod: { km: usage.km || 0, days: usage.days || 0 },
      autoRenew: sub.autoRenew,
      createdAt: sub.createdAt.toISOString(),
    };
  },

  /**
   * List user's subscriptions
   */
  async listSubscriptions(userId: string): Promise<SubscriptionResponse[]> {
    const subs = await prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        vehicle: { include: { model: { include: { make: true } } } },
        billingCycles: { orderBy: { periodStart: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subs.map(sub => {
      const metadata = (sub.metadata as any) || {};
      const currentCycle = sub.billingCycles[0];
      const usage = (currentCycle?.usageData as any) || { km: 0, days: 0 };
      return {
        id: sub.id,
        planId: sub.planId,
        planName: sub.plan.name,
        vehicleId: sub.vehicleId,
        vehicleName: sub.vehicle
          ? `${sub.vehicle.model.make.name} ${sub.vehicle.model.name}`
          : null,
        status: sub.status as SubscriptionStatus,
        currentPeriodStart: sub.currentPeriodStart.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        priceZar: Number(sub.plan.priceZar),
        trustAdjustedPrice: metadata.trustAdjustedPrice || Number(sub.plan.priceZar),
        usageCurrentPeriod: { km: usage.km || 0, days: usage.days || 0 },
        autoRenew: sub.autoRenew,
        createdAt: sub.createdAt.toISOString(),
      };
    });
  },

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    userId: string,
    data: { planId?: string; vehicleId?: string; autoRenew?: boolean }
  ): Promise<SubscriptionResponse> {
    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) throw new Error('Subscription not found or not owned by you');

    await prisma.subscription.update({
      where: { id },
      data: {
        ...(data.planId && { planId: data.planId }),
        ...(data.vehicleId && { vehicleId: data.vehicleId }),
        ...(data.autoRenew !== undefined && { autoRenew: data.autoRenew }),
      },
    });

    return this.getSubscription(id);
  },

  /**
   * Pause a subscription
   */
  async pauseSubscription(id: string, userId: string): Promise<SubscriptionResponse> {
    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) throw new Error('Subscription not found');

    await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.PAUSED, pauseStart: new Date() },
    });

    return this.getSubscription(id);
  },

  /**
   * Resume a subscription
   */
  async resumeSubscription(id: string, userId: string): Promise<SubscriptionResponse> {
    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) throw new Error('Subscription not found');

    await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.ACTIVE, pauseEnd: new Date() },
    });

    return this.getSubscription(id);
  },

  /**
   * Cancel a subscription
   */
  async cancelSubscription(id: string, userId: string): Promise<SubscriptionResponse> {
    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) throw new Error('Subscription not found');

    await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });

    return this.getSubscription(id);
  },

  /**
   * Upgrade or downgrade plan
   */
  async changePlan(id: string, userId: string, newPlanId: string): Promise<SubscriptionResponse> {
    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) throw new Error('Subscription not found');

    const eligibility = await this.checkEligibility(userId, newPlanId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Not eligible for this plan');
    }

    await prisma.subscription.update({
      where: { id },
      data: { planId: newPlanId },
    });

    return this.getSubscription(id);
  },

  /**
   * Swap vehicle for Plus/Business subscriptions
   */
  async swapVehicle(id: string, userId: string, newVehicleId: string): Promise<SubscriptionResponse> {
    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) throw new Error('Subscription not found');

    const vehicle = await prisma.vehicle.findUnique({ where: { id: newVehicleId } });
    if (!vehicle) throw new Error('Vehicle not found');

    await prisma.subscription.update({
      where: { id },
      data: { vehicleId: newVehicleId },
    });

    return this.getSubscription(id);
  },
};