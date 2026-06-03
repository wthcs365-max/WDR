// ============================================================================
// Trust Service — Core Trust Scoring Engine ("WTH Drive Verified")
// Implements the full scoring logic from /home/team/shared/architecture/trust-engine-logic.md
// ============================================================================

export type TrustTier = 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'restricted';

export interface ScoreComponents {
  identityScore: number;     // 0-100, weight 25%
  financialScore: number;    // 0-100, weight 25%
  behavioralScore: number;   // 0-100, weight 20%
  telematicsScore: number;   // 0-100, weight 30%
}

export interface TrustScoreResult {
  overallScore: number;       // 0-1000 (WDR Trust Alpha Score)
  tier: TrustTier;
  components: ScoreComponents;
  waiverEligible: boolean;
  maxWaiverAmount: number;
  waiverFeePercent: number;
  maxVehicleValue: number;
  maxDailyRate: number;
  insuranceAdjustment: number; // percentage modifier
  subscriptionDiscount: number; // percentage modifier
  bookingSpeed: 'instant' | 'fast' | 'normal' | 'review' | 'manual';
}

// ─── Tier Definitions ───────────────────────────────────────────────────────

interface TierConfig {
  minScore: number;
  maxScore: number;
  label: string;
  waiverEligible: boolean;
  maxWaiverAmount: number;
  waiverFeePercent: number;
  maxVehicleValue: number;
  maxDailyRate: number;
  insuranceAdjustment: number;  // negative = discount, positive = loading
  subscriptionDiscount: number; // negative = discount
  bookingSpeed: 'instant' | 'fast' | 'normal' | 'review' | 'manual';
}

const TIER_CONFIGS: Record<TrustTier, TierConfig> = {
  diamond: {
    minScore: 800, maxScore: 1000, label: 'Elite Trust',
    waiverEligible: true, maxWaiverAmount: 50000, waiverFeePercent: 0,
    maxVehicleValue: Infinity, maxDailyRate: Infinity,
    insuranceAdjustment: -25, subscriptionDiscount: -15,
    bookingSpeed: 'instant',
  },
  platinum: {
    minScore: 700, maxScore: 799, label: 'High Trust',
    waiverEligible: true, maxWaiverAmount: 25000, waiverFeePercent: 10,
    maxVehicleValue: 800000, maxDailyRate: 3000,
    insuranceAdjustment: -10, subscriptionDiscount: -10,
    bookingSpeed: 'instant',
  },
  gold: {
    minScore: 600, maxScore: 699, label: 'Verified',
    waiverEligible: true, maxWaiverAmount: 15000, waiverFeePercent: 20,
    maxVehicleValue: 500000, maxDailyRate: 1500,
    insuranceAdjustment: 0, subscriptionDiscount: -5,
    bookingSpeed: 'fast',
  },
  silver: {
    minScore: 500, maxScore: 599, label: 'Standard',
    waiverEligible: true, maxWaiverAmount: 5000, waiverFeePercent: 35,
    maxVehicleValue: 300000, maxDailyRate: 800,
    insuranceAdjustment: 15, subscriptionDiscount: 0,
    bookingSpeed: 'normal',
  },
  bronze: {
    minScore: 300, maxScore: 499, label: 'Basic',
    waiverEligible: false, maxWaiverAmount: 0, waiverFeePercent: 100,
    maxVehicleValue: 150000, maxDailyRate: 500,
    insuranceAdjustment: 30, subscriptionDiscount: 15,
    bookingSpeed: 'review',
  },
  restricted: {
    minScore: 0, maxScore: 299, label: 'High Risk',
    waiverEligible: false, maxWaiverAmount: 0, waiverFeePercent: 100,
    maxVehicleValue: 0, maxDailyRate: 0,
    insuranceAdjustment: 50, subscriptionDiscount: 100,
    bookingSpeed: 'manual',
  },
};

// ─── Identity Score Calculator (Weight: 25%) ────────────────────────────────

export interface IdentityData {
  idVerificationScore: number;     // 0-100: ID matched, name DOB correct
  licenseScore: number;            // 0-100: driver's license validity
  biometricScore: number;          // 0-100: liveness + face match
  phoneVerified: boolean;
  recentSimSwap: boolean;          // true if recent SIM swap detected
  addressVerified: boolean;
  addressDocumentMatch: boolean;   // true if proof of address matches
}

export function calculateIdentityScore(data: IdentityData): number {
  const idVer = data.idVerificationScore;
  const license = data.licenseScore;
  const biometric = data.biometricScore;
  const phone = (data.phoneVerified && !data.recentSimSwap) ? 100
    : data.phoneVerified ? 50 : 0;
  const address = data.addressDocumentMatch ? 100
    : data.addressVerified ? 50 : 0;

  let score = (idVer * 0.30) + (license * 0.25) + (biometric * 0.25) + (phone * 0.10) + (address * 0.10);

  // Business rules
  if (idVer < 50) {
    score = Math.min(score, 25);  // Capped at 25 without verified ID
  }

  return Math.round(score);
}

// ─── Financial Score Calculator (Weight: 25%) ───────────────────────────────

export interface FinancialData {
  creditScore: number;           // SA bureau score 300-850, or 0 if no bureau
  hasAdverseRecords: boolean;
  adverseRecordSeverity: 'none' | 'minor_resolved' | 'minor_unresolved' | 'major'; // major = >ZAR5k unresolved
  bankAccountVerified: boolean;
  bankAccountHasBalance: boolean;
  onTimePayments: number;        // Count of on-time payments on WDR
  totalPayments: number;         // Total payment count on WDR
  completedTrips: number;
}

export function calculateFinancialScore(data: FinancialData): number {
  // Credit score mapping (SA bureau 300-850 → 0-100)
  let creditMapped = 50; // neutral default if no data
  if (data.creditScore > 0) {
    if (data.creditScore >= 720) creditMapped = 100;
    else if (data.creditScore >= 620) creditMapped = 75;
    else if (data.creditScore >= 580) creditMapped = 50;
    else if (data.creditScore >= 500) creditMapped = 25;
    else creditMapped = 10;
  }

  // Adverse records
  let adverseScore = 100;
  if (data.hasAdverseRecords) {
    switch (data.adverseRecordSeverity) {
      case 'minor_resolved': adverseScore = 50; break;
      case 'minor_unresolved': adverseScore = 25; break;
      case 'major': adverseScore = 0; break;
    }
  }

  // Bank account
  const bankScore = data.bankAccountHasBalance ? 100
    : data.bankAccountVerified ? 50 : 0;

  // Payment history (WDR internal)
  let paymentHistory: number;
  if (data.totalPayments === 0) {
    paymentHistory = 60; // new user baseline
  } else {
    paymentHistory = Math.min(100,
      (data.onTimePayments / data.totalPayments) * 70 +
      Math.min(30, data.completedTrips * 2)
    );
  }

  let score = (creditMapped * 0.35) + (adverseScore * 0.25) + (bankScore * 0.15) + (paymentHistory * 0.25);

  // Business rules
  if (data.creditScore > 0 && data.creditScore < 500) {
    score = Math.min(score, 30); // High risk override
  }
  if (data.hasAdverseRecords && data.adverseRecordSeverity === 'major') {
    score = Math.min(score, 30); // Capped at 30 with major adverse
  }

  return Math.round(score);
}

// ─── Behavioral Score Calculator (Weight: 20%) ──────────────────────────────

export interface BehavioralData {
  completedTrips: number;
  cancelledByRenter: number;
  lateReturns: number;
  totalTrips: number;           // completed + cancelled
  damageClaims: number;
  majorDamageClaims: number;
  appEngagement: 'daily' | 'weekly' | 'monthly' | 'rare' | 'never';
  referralTrustScores: number[]; // trust scores of users this user referred
  daysSinceLastActivity: number; // for decay calculation
}

export function calculateBehavioralScore(data: BehavioralData): number {
  // New user baseline
  if (data.completedTrips === 0) {
    return applyDecay(50, data.daysSinceLastActivity);
  }

  // Trip completion rate
  let completionScore = 0;
  if (data.totalTrips > 0) {
    const rate = (data.completedTrips / data.totalTrips) * 100;
    if (rate > 95) completionScore = 100;
    else if (rate > 85) completionScore = 75;
    else if (rate > 70) completionScore = 50;
    else completionScore = 0;
  }

  // Late return frequency
  let lateReturnScore = 100;
  if (data.completedTrips > 0) {
    const lateRate = (data.lateReturns / data.completedTrips) * 100;
    if (lateRate === 0) lateReturnScore = 100;
    else if (lateRate < 5) lateReturnScore = 75;
    else if (lateRate < 15) lateReturnScore = 50;
    else if (lateRate < 30) lateReturnScore = 25;
    else lateReturnScore = 0;
  }

  // Damage claims history
  let damageScore = 100;
  if (data.damageClaims > 0) {
    if (data.damageClaims === 1 && data.majorDamageClaims === 0) damageScore = 75;
    else if (data.damageClaims <= 2) damageScore = 50;
    else damageScore = 0;
  }

  // App engagement
  const engagementMap: Record<string, number> = {
    daily: 100, weekly: 75, monthly: 50, rare: 25, never: 0,
  };
  const appScore = engagementMap[data.appEngagement] || 0;

  // Referral quality
  let referralScore = 50; // neutral baseline
  if (data.referralTrustScores.length > 0) {
    const avg = data.referralTrustScores.reduce((a, b) => a + b, 0) / data.referralTrustScores.length;
    if (avg > 750) referralScore = 100;
    else if (avg >= 650) referralScore = 75;
    else if (avg >= 500) referralScore = 50;
    else referralScore = 25;
  }

  let score = (completionScore * 0.30) + (lateReturnScore * 0.20) + (damageScore * 0.25) + (appScore * 0.10) + (referralScore * 0.15);

  // Apply score decay for inactivity
  score = applyDecay(score, data.daysSinceLastActivity);

  return Math.round(score);
}

// ─── Telematics Score Calculator (Weight: 30%) ──────────────────────────────

export interface TelematicsData {
  tripScores: number[];          // Per-trip smoothness scores (0-100), max 15 recent
  speedCompliancePct: number;    // % of time within speed limit (0-100)
  nightDrivingPct: number;       // % of driving at night (0-100)
  geofenceBreaches: number;
  majorGeofenceBreaches: number;
  avgTripDistanceKm: number;
  totalDistanceKm: number;       // Total telematics data in km
  hasCollisionEvent: boolean;
}

export function calculateTelematicsScore(data: TelematicsData): number {
  // Check if sufficient data
  if (data.totalDistanceKm < 50) {
    return 50; // Neutral default until 50km data
  }

  // Driving smoothness - best 10 of last 15 trips
  const smoothnessTrips = [...data.tripScores].sort((a, b) => b - a).slice(0, 10);
  const smoothnessScore = smoothnessTrips.length > 0
    ? smoothnessTrips.reduce((a, b) => a + b, 0) / smoothnessTrips.length
    : 0;

  // Speed compliance
  let speedScore: number;
  if (data.speedCompliancePct > 98) speedScore = 100;
  else if (data.speedCompliancePct > 90) speedScore = 75;
  else if (data.speedCompliancePct > 80) speedScore = 50;
  else speedScore = 0;

  // Night driving ratio
  let nightScore: number;
  if (data.nightDrivingPct < 10) nightScore = 100;
  else if (data.nightDrivingPct < 20) nightScore = 75;
  else if (data.nightDrivingPct < 40) nightScore = 50;
  else if (data.nightDrivingPct < 60) nightScore = 25;
  else nightScore = 0;

  // Geolocation compliance
  let geoScore = 100;
  if (data.majorGeofenceBreaches > 1) geoScore = 0;
  else if (data.majorGeofenceBreaches === 1) geoScore = 25;
  else if (data.geofenceBreaches > 2) geoScore = 25;
  else if (data.geofenceBreaches >= 1) geoScore = 50;
  else geoScore = 100;

  // Average trip distance
  let tripDistScore: number;
  if (data.avgTripDistanceKm >= 50 && data.avgTripDistanceKm <= 150) tripDistScore = 100;
  else if (data.avgTripDistanceKm <= 300) tripDistScore = 75;
  else if (data.avgTripDistanceKm <= 500) tripDistScore = 50;
  else tripDistScore = 25;

  let score = (smoothnessScore * 0.35) + (speedScore * 0.25) + (nightScore * 0.15) + (geoScore * 0.15) + (tripDistScore * 0.10);

  // Collision event override
  if (data.hasCollisionEvent) {
    score = Math.min(score, 25); // Reset to 25 pending investigation
  }

  return Math.round(score);
}

// ─── Score Decay Helpers ────────────────────────────────────────────────────

function applyDecay(score: number, daysSinceLastActivity: number): number {
  if (daysSinceLastActivity <= 90) return score;
  const decayFactor = Math.min(1, (daysSinceLastActivity - 90) * 0.001); // 10% per 90 days
  return Math.max(50, Math.round(score * (1 - decayFactor)));
}

// ─── Tier Classification ────────────────────────────────────────────────────

export function classifyTier(overallScore: number): TrustTier {
  const tiers: [number, TrustTier][] = [
    [800, 'diamond'],
    [700, 'platinum'],
    [600, 'gold'],
    [500, 'silver'],
    [300, 'bronze'],
    [0, 'restricted'],
  ];
  for (const [min, tier] of tiers) {
    if (overallScore >= min) return tier;
  }
  return 'restricted';
}

// ─── Waiver Engine ──────────────────────────────────────────────────────────

export interface WaiverEvaluationInput {
  userId: string;
  tier: TrustTier;
  bookingDepositZar: number;
  completedTrips: number;
  hasZeroClaims: boolean;
  isNewDiamond: boolean; // Diamond with < 3 trips
}

export interface WaiverEvaluationResult {
  eligible: boolean;
  maxWaiverAmount: number;
  waiverFeeZar: number;
  requiresReview: boolean;
  reason?: string;
}

export function evaluateWaiver(input: WaiverEvaluationInput): WaiverEvaluationResult {
  const tierConfig = TIER_CONFIGS[input.tier];

  if (!tierConfig.waiverEligible) {
    return {
      eligible: false,
      maxWaiverAmount: 0,
      waiverFeeZar: 0,
      requiresReview: false,
      reason: `Tier ${input.tier} is not eligible for deposit waiver`,
    };
  }

  let maxWaiver = tierConfig.maxWaiverAmount;
  let requiresReview = false;

  // Override rules
  if (input.tier === 'diamond' && input.completedTrips >= 20 && input.hasZeroClaims) {
    maxWaiver = Infinity; // Unlimited waivers
  }
  if (input.tier === 'diamond' && input.isNewDiamond) {
    maxWaiver = Math.min(maxWaiver, 25000); // Capped at ZAR 25k for first 3 bookings
  }
  if (input.tier === 'silver') {
    requiresReview = true; // Conditional — requires review
  }

  const waiverAmount = Math.min(input.bookingDepositZar, maxWaiver);
  const feePercent = tierConfig.waiverFeePercent / 100;
  const waiverFeeZar = Math.min(Math.round(waiverAmount * feePercent), 5000); // Capped at ZAR 5,000

  return {
    eligible: true,
    maxWaiverAmount: maxWaiver === Infinity ? waiverAmount : maxWaiver,
    waiverFeeZar,
    requiresReview,
  };
}

// ─── Vehicle Access Control ─────────────────────────────────────────────────

export interface VehicleAccessInput {
  tier: TrustTier;
  vehicleValue: number;
  dailyRate: number;
}

export interface VehicleAccessResult {
  allowed: boolean;
  reason?: string;
}

export function checkVehicleAccess(input: VehicleAccessInput): VehicleAccessResult {
  const tierConfig = TIER_CONFIGS[input.tier];

  if (tierConfig.bookingSpeed === 'manual') {
    return { allowed: false, reason: 'Restricted tier — no vehicle access' };
  }

  if (input.vehicleValue > tierConfig.maxVehicleValue) {
    return { allowed: false, reason: `Vehicle value exceeds tier limit of ZAR ${tierConfig.maxVehicleValue.toLocaleString()}` };
  }

  if (input.dailyRate > tierConfig.maxDailyRate) {
    return { allowed: false, reason: `Daily rate exceeds tier limit of ZAR ${tierConfig.maxDailyRate.toLocaleString()}` };
  }

  return { allowed: true };
}

// ─── Aggregate Score Calculator ─────────────────────────────────────────────

export interface CalculationInput {
  identityData: IdentityData;
  financialData: FinancialData;
  behavioralData: BehavioralData;
  telematicsData: TelematicsData;
}

export function calculateTrustScore(input: CalculationInput): TrustScoreResult {
  // Calculate sub-scores
  const identityScore = calculateIdentityScore(input.identityData);
  const financialScore = calculateFinancialScore(input.financialData);
  const behavioralScore = calculateBehavioralScore(input.behavioralData);
  const telematicsScore = calculateTelematicsScore(input.telematicsData);

  // Apply cross-component business rules
  let adjustedFinancial = financialScore;
  if (identityScore < 50) {
    adjustedFinancial = Math.min(adjustedFinancial, 50);
  }

  // Composite score (0-100 scale)
  const rawScore = (
    identityScore * 0.25 +
    adjustedFinancial * 0.25 +
    behavioralScore * 0.20 +
    telematicsScore * 0.30
  );

  // Scale to 0-1000
  const overallScore = Math.round(rawScore * 10);

  // Clamp
  const clampedScore = Math.max(0, Math.min(1000, overallScore));

  // Classify tier
  const tier = classifyTier(clampedScore);
  const tierConfig = TIER_CONFIGS[tier];

  return {
    overallScore: clampedScore,
    tier,
    components: {
      identityScore,
      financialScore: adjustedFinancial,
      behavioralScore,
      telematicsScore,
    },
    waiverEligible: tierConfig.waiverEligible,
    maxWaiverAmount: tierConfig.maxWaiverAmount,
    waiverFeePercent: tierConfig.waiverFeePercent,
    maxVehicleValue: tierConfig.maxVehicleValue,
    maxDailyRate: tierConfig.maxDailyRate,
    insuranceAdjustment: tierConfig.insuranceAdjustment,
    subscriptionDiscount: tierConfig.subscriptionDiscount,
    bookingSpeed: tierConfig.bookingSpeed,
  };
}

// ─── Score Explanation Generator ────────────────────────────────────────────

export function generateExplanation(result: TrustScoreResult): string {
  const tierIcons: Record<TrustTier, string> = {
    diamond: '💎', platinum: '⭐', gold: '🥇', silver: '🥈', bronze: '🥉', restricted: '⚠️',
  };

  const tierLabels: Record<TrustTier, string> = {
    diamond: 'Elite Trust', platinum: 'High Trust', gold: 'Verified',
    silver: 'Standard', bronze: 'Basic', restricted: 'High Risk',
  };

  const c = result.components;

  const lines: string[] = [
    `Your WDR Trust Alpha Score is ${result.overallScore} (${tierIcons[result.tier]} ${tierLabels[result.tier]} tier).`,
    '',
    'Breakdown:',
    `${c.identityScore >= 70 ? '✅' : '⚠️'} Identity: ${c.identityScore}/100`,
    `${c.financialScore >= 70 ? '✅' : '⚠️'} Financial: ${c.financialScore}/100`,
    `${c.behavioralScore >= 70 ? '✅' : '⚠️'} Behavioral: ${c.behavioralScore}/100`,
    `${c.telematicsScore >= 70 ? '✅' : '⚠️'} Telematics: ${c.telematicsScore}/100`,
    '',
  ];

  if (result.waiverEligible) {
    lines.push(`Current benefit: Deposit waiver up to ZAR ${result.maxWaiverAmount.toLocaleString()} at ${result.waiverFeePercent}% fee.`);
  } else {
    lines.push('Current benefit: Full deposit required for bookings.');
  }

  // Next milestone
  const nextTier: Record<TrustTier, string> = {
    restricted: 'Complete KYC verification to start building your score.',
    bronze: 'Complete 3+ on-time bookings to reach Silver.',
    silver: 'Maintain good behavior to reach Gold (600 points).',
    gold: 'Achieve 700+ points for Platinum benefits.',
    platinum: 'Reach 800+ points for Diamond — zero-fee waivers up to ZAR 50,000.',
    diamond: 'You\'re at the top tier! Maintain your record to keep unlimited waivers.',
  };
  lines.push('', nextTier[result.tier]);

  return lines.join('\n');
}

export function getTierConfig(tier: TrustTier): TierConfig {
  return TIER_CONFIGS[tier];
}

export { TIER_CONFIGS };
export type { TierConfig };