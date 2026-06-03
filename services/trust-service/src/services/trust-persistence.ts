// ============================================================================
// Trust Service — Persistence Layer (Prisma)
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { TrustScoreResult, ScoreComponents, TrustTier } from './score-engine';

const prisma = new PrismaClient();

export const trustPersistence = {
  /**
   * Get existing trust score for a user
   */
  async getScore(userId: string) {
    return prisma.trustScore.findUnique({
      where: { userId },
    });
  },

  /**
   * Save or update a trust score
   */
  async saveScore(
    userId: string,
    result: TrustScoreResult,
    calculationVersion: number
  ) {
    return prisma.trustScore.upsert({
      where: { userId },
      create: {
        userId,
        overallScore: result.overallScore,
        tier: result.tier,
        identityScore: result.components.identityScore,
        financialScore: result.components.financialScore,
        behavioralScore: result.components.behavioralScore,
        drivingBehaviorScore: result.components.telematicsScore,
        paymentReliabilityScore: result.components.financialScore,
        verificationScore: result.components.identityScore,
        socialScore: result.components.behavioralScore,
        depositWaiverEligible: result.waiverEligible,
        maxWaiverAmountZar: result.maxWaiverAmount === Infinity ? 999999 : result.maxWaiverAmount,
        reducedDepositPct: result.waiverEligible ? 100 - result.waiverFeePercent : 0,
        calculationVersion,
        lastCalculatedAt: new Date(),
      },
      update: {
        overallScore: result.overallScore,
        tier: result.tier,
        identityScore: result.components.identityScore,
        financialScore: result.components.financialScore,
        behavioralScore: result.components.behavioralScore,
        drivingBehaviorScore: result.components.telematicsScore,
        paymentReliabilityScore: result.components.financialScore,
        verificationScore: result.components.identityScore,
        socialScore: result.components.behavioralScore,
        depositWaiverEligible: result.waiverEligible,
        maxWaiverAmountZar: result.maxWaiverAmount === Infinity ? 999999 : result.maxWaiverAmount,
        reducedDepositPct: result.waiverEligible ? 100 - result.waiverFeePercent : 0,
        calculationVersion,
        lastCalculatedAt: new Date(),
      },
    });
  },

  /**
   * Log a score change event (audit trail)
   */
  async logScoreEvent(
    userId: string,
    eventType: string,
    scoreDelta: number,
    previousScore: number | null,
    newScore: number | null,
    reason: string,
    referenceId?: string
  ) {
    return prisma.trustScoreEvent.create({
      data: {
        userId,
        eventType,
        scoreDelta,
        previousScore,
        newScore,
        reason,
        referenceId: referenceId || undefined,
      },
    });
  },

  /**
   * Get score event history
   */
  async getScoreHistory(userId: string, limit: number = 50) {
    return prisma.trustScoreEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Get or create a deposit record for a booking
   */
  async getDeposit(bookingId: string) {
    return prisma.deposit.findUnique({
      where: { bookingId },
    });
  },

  /**
   * Create a deposit waiver approval
   */
  async createWaiverApproval(
    renterId: string,
    trustScoreId: string,
    bookingId: string,
    waiverAmountZar: number,
    approved: boolean,
    approvedBy: string
  ) {
    return prisma.waiverApproval.create({
      data: {
        renterId,
        trustScoreId,
        bookingId,
        waiverAmountZar,
        approved,
        approvedBy,
        approvalCriteria: {},
        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
      },
    });
  },

  /**
   * List deposits (for admin)
   */
  async listDeposits(page: number = 1, pageSize: number = 20) {
    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: { select: { id: true, status: true } },
        },
      }),
      prisma.deposit.count(),
    ]);
    return { deposits, total };
  },

  /**
   * List claims (for admin)
   */
  async listClaims(page: number = 1, pageSize: number = 20) {
    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: { select: { id: true, status: true } },
        },
      }),
      prisma.claim.count(),
    ]);
    return { claims, total };
  },
};