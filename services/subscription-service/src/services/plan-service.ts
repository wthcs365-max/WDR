// ============================================================================
// Subscription Service — Plan Service
// Manages the subscription plan catalog
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { SubscriptionPlanResponse, SubscriptionPlan } from '@wdr/shared-types';

const prisma = new PrismaClient();

const TRUST_PRICING: Record<string, Record<string, number | null>> = {
  diamond: { flex: 0.85, plus: 0.90, business: 0.90 },
  platinum: { flex: 0.90, plus: 0.95, business: 1.00 },
  gold: { flex: 0.95, plus: 1.00, business: 1.00 },
  silver: { flex: 1.00, plus: 1.10, business: 1.05 },
  bronze: { flex: 1.15, plus: null, business: 1.10 },
  restricted: { flex: null, plus: null, business: null },
};

function toPlanResponse(plan: any): SubscriptionPlanResponse {
  return {
    id: plan.id,
    planType: plan.planType as SubscriptionPlan,
    name: plan.name,
    description: plan.description,
    billingPeriod: plan.billingPeriod,
    priceZar: Number(plan.priceZar),
    setupFeeZar: Number(plan.setupFeeZar || 0),
    includedHours: plan.includedHours,
    includedKm: plan.includedKm,
    excessKmRateZar: plan.excessKmRateZar ? Number(plan.excessKmRateZar) : null,
    vehicleCategories: plan.vehicleCategories || [],
    maxActiveBookings: plan.maxActiveBookings || 1,
    features: plan.features || [],
    trustPricing: TRUST_PRICING[plan.planType] || {},
  };
}

export const planService = {
  async listPlans(): Promise<SubscriptionPlanResponse[]> {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceZar: 'asc' },
    });
    return plans.map(toPlanResponse);
  },

  async getPlan(id: string): Promise<SubscriptionPlanResponse> {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new Error('Plan not found');
    return toPlanResponse(plan);
  },
};