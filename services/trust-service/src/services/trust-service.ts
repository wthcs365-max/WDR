// ============================================================================
// Trust Service — Orchestration Layer
// Coordinates scoring, persistence, and domain events
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  calculateTrustScore,
  evaluateWaiver,
  checkVehicleAccess,
  generateExplanation,
  TrustScoreResult,
  IdentityData,
  FinancialData,
  BehavioralData,
  TelematicsData,
  WaiverEvaluationInput,
  WaiverEvaluationResult,
  VehicleAccessInput,
  VehicleAccessResult,
  TrustTier,
} from './score-engine';
import { trustPersistence } from './trust-persistence';

const prisma = new PrismaClient();
let calculationVersion = 1;

export const trustService = {
  /**
   * Full trust score calculation for a user
   * Fetches data, computes scores, persists, and returns result
   */
  async calculateScore(userId: string): Promise<TrustScoreResult> {
    // Load data from database (providers would be called async in production)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDocuments: { orderBy: { createdAt: 'desc' }, take: 1 },
        trustScore: true,
        bookingsAsRenter: {
          include: {
            checkOut: true,
            deposit: true,
            claims: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Extract KYC data
    const kycDocs = user.kycDocuments;
    const verifiedKyc = kycDocs.filter(d => d.verificationStatus === 'verified');
    const idDoc = verifiedKyc.find(d => d.documentType === 'id_document');
    const licenseDoc = verifiedKyc.find(d => d.documentType === 'drivers_license');
    const selfieDoc = verifiedKyc.find(d => d.documentType === 'selfie' || d.documentType === 'id_document');

    // Gather booking stats
    const bookings = user.bookingsAsRenter;
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    const lateReturns = completedBookings.filter(b => {
      if (b.actualEndTime && b.endTime) {
        return b.actualEndTime > b.endTime;
      }
      return false;
    });
    const claims = bookings.flatMap(b => b.claims);
    const majorClaims = claims.filter(c => c.claimType === 'damage' && c.amountZar > 5000);
    const lateReturnDays = completedBookings
      .filter(b => b.actualEndTime && b.endTime)
      .map(b => Math.max(0, (b.actualEndTime!.getTime() - b.endTime!.getTime()) / (1000 * 60 * 60 * 24)))
      .reduce((sum, days) => sum + days, 0);

    // Build identity data
    const identityData: IdentityData = {
      idVerificationScore: idDoc ? 100 : (kycDocs.length > 0 ? 50 : 0),
      licenseScore: licenseDoc ? 100 : 0,
      biometricScore: selfieDoc ? 100 : 0,
      phoneVerified: user.phoneVerified,
      recentSimSwap: false,
      addressVerified: false,
      addressDocumentMatch: false,
    };

    // Build financial data
    const onTimeCount = completedBookings.length;
    const totalPaymentCount = completedBookings.length + cancelledBookings.length;
    const financialData: FinancialData = {
      creditScore: 0, // Would come from bureau API
      hasAdverseRecords: false,
      adverseRecordSeverity: 'none',
      bankAccountVerified: false,
      bankAccountHasBalance: false,
      onTimePayments: Math.max(0, onTimeCount - claims.length),
      totalPayments: Math.max(1, totalPaymentCount),
      completedTrips: completedBookings.length,
    };

    // Build behavioral data
    const behavioralData: BehavioralData = {
      completedTrips: completedBookings.length,
      cancelledByRenter: cancelledBookings.length,
      lateReturns: lateReturns.length,
      totalTrips: completedBookings.length + cancelledBookings.length,
      damageClaims: claims.length,
      majorDamageClaims: majorClaims.length,
      appEngagement: 'weekly', // Would come from analytics
      referralTrustScores: [], // Would come from social graph
      daysSinceLastActivity: user.updatedAt
        ? Math.floor((Date.now() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    };

    // Build telematics data (would come from telemetry service in production)
    const telematicsData: TelematicsData = {
      tripScores: [],
      speedCompliancePct: 95,
      nightDrivingPct: 15,
      geofenceBreaches: 0,
      majorGeofenceBreaches: 0,
      avgTripDistanceKm: completedBookings.length > 0
        ? completedBookings.reduce((sum, b) => sum + (b.actualKmDriven || 50), 0) / completedBookings.length
        : 50,
      totalDistanceKm: completedBookings.reduce((sum, b) => sum + (b.actualKmDriven || 0), 0),
      hasCollisionEvent: false,
    };

    // Calculate score
    const result = calculateTrustScore({
      identityData,
      financialData,
      behavioralData,
      telematicsData,
    });

    // Get previous score for change tracking
    const existingScore = await trustPersistence.getScore(userId);
    const previousScore = existingScore?.overallScore || null;

    // Persist score
    calculationVersion++;
    await trustPersistence.saveScore(userId, result, calculationVersion);

    // Log score change event
    if (previousScore !== null) {
      await trustPersistence.logScoreEvent(
        userId,
        'score_change',
        result.overallScore - previousScore,
        previousScore,
        result.overallScore,
        'Score recalculated'
      );
    } else {
      await trustPersistence.logScoreEvent(
        userId,
        'initial_score',
        result.overallScore,
        null,
        result.overallScore,
        'Initial trust score calculated'
      );
    }

    return result;
  },

  /**
   * Get current score for a user (from DB, no recalculation)
   */
  async getScore(userId: string): Promise<TrustScoreResult | null> {
    const score = await trustPersistence.getScore(userId);
    if (!score) return null;

    return {
      overallScore: score.overallScore,
      tier: score.tier as TrustTier,
      components: {
        identityScore: score.identityScore || 0,
        financialScore: score.paymentReliabilityScore || 0,
        behavioralScore: score.socialScore || 0,
        telematicsScore: score.drivingBehaviorScore || 0,
      },
      waiverEligible: score.depositWaiverEligible,
      maxWaiverAmount: score.maxWaiverAmountZar ? Number(score.maxWaiverAmountZar) : 0,
      waiverFeePercent: score.reducedDepositPct ? 100 - Number(score.reducedDepositPct) : 0,
      maxVehicleValue: 0, // computed from tier
      maxDailyRate: 0,
      insuranceAdjustment: 0,
      subscriptionDiscount: 0,
      bookingSpeed: 'normal',
    };
  },

  /**
   * Get score history
   */
  async getScoreHistory(userId: string) {
    return trustPersistence.getScoreHistory(userId);
  },

  /**
   * Generate explanation text for a user's score
   */
  async getExplanation(userId: string): Promise<string> {
    const score = await this.getScore(userId);
    if (!score) {
      return 'No trust score calculated yet. Complete onboarding to get your score.';
    }
    return generateExplanation(score);
  },

  /**
   * Evaluate deposit waiver for a booking
   */
  async evaluateWaiver(
    renterId: string,
    bookingId: string,
    depositAmount: number
  ): Promise<WaiverEvaluationResult> {
    const score = await trustPersistence.getScore(renterId);
    if (!score) {
      return {
        eligible: false,
        maxWaiverAmount: 0,
        waiverFeeZar: 0,
        requiresReview: true,
        reason: 'No trust score found',
      };
    }

    // Get user booking stats
    const bookings = await prisma.booking.findMany({
      where: { renterId },
      include: { claims: true },
    });
    const completed = bookings.filter(b => b.status === 'completed');
    const claims = bookings.flatMap(b => b.claims);

    const input: WaiverEvaluationInput = {
      userId: renterId,
      tier: score.tier as TrustTier,
      bookingDepositZar: depositAmount,
      completedTrips: completed.length,
      hasZeroClaims: claims.length === 0,
      isNewDiamond: score.tier === 'diamond' && completed.length < 3,
    };

    return evaluateWaiver(input);
  },

  /**
   * Check vehicle access for a user
   */
  async checkVehicleAccess(
    userId: string,
    vehicleValue: number,
    dailyRate: number
  ): Promise<VehicleAccessResult> {
    const score = await trustPersistence.getScore(userId);
    if (!score) {
      return { allowed: false, reason: 'No trust score available' };
    }

    const input: VehicleAccessInput = {
      tier: score.tier as TrustTier,
      vehicleValue,
      dailyRate,
    };

    return checkVehicleAccess(input);
  },

  /**
   * Ingest a scoring event (trigger recalculation later)
   */
  async ingestEvent(
    userId: string,
    eventType: string,
    reason: string,
    referenceId?: string
  ): Promise<void> {
    await trustPersistence.logScoreEvent(userId, eventType, 0, null, null, reason, referenceId);
  },
};