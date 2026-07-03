// ============================================================================
// Partner Service — TBYB Lead Engine
// Try Before You Buy — Lead lifecycle, scoring, and credit calculation
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

export type TbybLeadStatus = 'ACTIVE' | 'CONTACTED' | 'NEGOTIATING' | 'CONVERTED' | 'EXPIRED' | 'LOST';

export interface TbybLeadData {
  id: string;
  renterId: string;
  dealerId: string;
  vehicleId: string;
  bookingId: string;
  status: TbybLeadStatus;
  score: number;
  isHotLead: boolean;
  consentGranted: boolean;
  conversionNotes?: string;
  creditAmount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Lead Scoring Engine (from Dealer Exchange GTM Section 6.2) ─────────────

export interface LeadScoringInput {
  tripDurationDays: number;
  renterTrustScore: number;
  vehicleViewCount: number;
  extendedTrip: boolean;
  priorPurchaseHistory: boolean;
}

export function calculateLeadScore(input: LeadScoringInput): number {
  const weights = {
    tripDuration: 0.30,
    trustScore: 0.25,
    viewCount: 0.20,
    extendedTrip: 0.15,
    priorPurchase: 0.10,
  };

  // Trip duration score (0-100): >3 days = 100, 1-3 days = 50, <1 day = 0
  const tripDurationScore = input.tripDurationDays > 3 ? 100
    : input.tripDurationDays >= 1 ? 50 : 0;

  // Trust score score (0-100): >700 = 100, 600-700 = 50, <600 = 0
  const trustScoreScore = input.renterTrustScore > 700 ? 100
    : input.renterTrustScore >= 600 ? 50 : 0;

  // View count score (0-100): >3 = 100, 1-3 = 50, 0 = 0
  const viewCountScore = input.vehicleViewCount > 3 ? 100
    : input.vehicleViewCount >= 1 ? 50 : 0;

  // Extended trip (0 or 100)
  const extendedTripScore = input.extendedTrip ? 100 : 0;

  // Prior purchase history (0 or 100)
  const priorPurchaseScore = input.priorPurchaseHistory ? 100 : 0;

  const score = Math.round(
    tripDurationScore * weights.tripDuration +
    trustScoreScore * weights.trustScore +
    viewCountScore * weights.viewCount +
    extendedTripScore * weights.extendedTrip +
    priorPurchaseScore * weights.priorPurchase
  );

  return Math.max(0, Math.min(100, score));
}

// ─── Lead Lifecycle Validator ───────────────────────────────────────────────

const VALID_TRANSITIONS: Record<TbybLeadStatus, TbybLeadStatus[]> = {
  ACTIVE: ['CONTACTED', 'EXPIRED'],
  CONTACTED: ['NEGOTIATING', 'LOST', 'EXPIRED'],
  NEGOTIATING: ['CONVERTED', 'LOST', 'EXPIRED'],
  CONVERTED: [],
  EXPIRED: [],
  LOST: [],
};

export function validateTransition(current: TbybLeadStatus, next: TbybLeadStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) || false;
}

// ─── Credit Calculation (base = bookingTotal * conversionPct + trustBonus) ──

export function calculateCredit(bookingTotal: number, trustScore: number): number {
  const base = bookingTotal * config.tbybConversionPct;
  const trustBonus = trustScore >= 700 ? 500 : trustScore >= 500 ? 200 : 0;
  return Math.round((base + trustBonus) * 100) / 100;
}

// ─── Service Methods ────────────────────────────────────────────────────────

export const tbybService = {
  /**
   * Create a new TBYB lead (triggered by renter interest)
   */
  async createLead(
    renterId: string,
    dealerId: string,
    vehicleId: string,
    bookingId: string,
    scoringInput: LeadScoringInput
  ): Promise<TbybLeadData> {
    const score = calculateLeadScore(scoringInput);
    const isHotLead = score >= config.tbybHotLeadThreshold;
    const expiresAt = new Date(Date.now() + config.tbybLeadExpiryDays * 24 * 60 * 60 * 1000);

    const lead = await prisma.domainEvent.create({
      data: {
        aggregateType: 'tbyb_lead',
        aggregateId: bookingId,
        eventType: 'tbyb.lead.created',
        eventData: {
          renterId,
          dealerId,
          vehicleId,
          bookingId,
          score,
          isHotLead,
          status: 'ACTIVE',
          expiresAt: expiresAt.toISOString(),
          scoringInput,
        },
        producer: 'partner-service',
      },
    });

    return {
      id: lead.id,
      renterId,
      dealerId,
      vehicleId,
      bookingId,
      status: 'ACTIVE',
      score,
      isHotLead,
      consentGranted: true,
      creditAmount: 0,
      expiresAt: expiresAt.toISOString(),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.createdAt.toISOString(),
    };
  },

  /**
   * Transition lead status with validation
   */
  async transitionLead(
    bookingId: string,
    newStatus: TbybLeadStatus
  ): Promise<TbybLeadData> {
    // Get current lead state from domain events
    const events = await prisma.domainEvent.findMany({
      where: { aggregateId: bookingId, aggregateType: 'tbyb_lead' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (events.length === 0) throw new Error('TBYB lead not found');

    const currentEvent = events[0];
    const currentData = currentEvent.eventData as any;
    const currentStatus = currentData.status as TbybLeadStatus;

    if (!validateTransition(currentStatus, newStatus)) {
      throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }

    // Calculate credit if converting
    let creditAmount = 0;
    if (newStatus === 'CONVERTED') {
      creditAmount = calculateCredit(
        currentData.bookingTotal || 0,
        currentData.renterTrustScore || 0
      );
    }

    const newEvent = await prisma.domainEvent.create({
      data: {
        aggregateType: 'tbyb_lead',
        aggregateId: bookingId,
        eventType: `tbyb.lead.${newStatus.toLowerCase()}`,
        eventData: {
          ...currentData,
          previousStatus: currentStatus,
          status: newStatus,
          creditAmount,
          transitionedAt: new Date().toISOString(),
        },
        producer: 'partner-service',
      },
    });

    return {
      id: newEvent.id,
      renterId: currentData.renterId,
      dealerId: currentData.dealerId,
      vehicleId: currentData.vehicleId,
      bookingId,
      status: newStatus,
      score: currentData.score || 0,
      isHotLead: (currentData.score || 0) >= config.tbybHotLeadThreshold,
      consentGranted: currentData.consentGranted !== false,
      conversionNotes: currentData.conversionNotes,
      creditAmount,
      expiresAt: currentData.expiresAt,
      createdAt: currentData.createdAt,
      updatedAt: newEvent.createdAt.toISOString(),
    };
  },

  /**
   * Get lead details by booking ID
   */
  async getLead(bookingId: string): Promise<TbybLeadData | null> {
    const events = await prisma.domainEvent.findMany({
      where: { aggregateId: bookingId, aggregateType: 'tbyb_lead' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (events.length === 0) return null;

    const event = events[0];
    const data = event.eventData as any;

    return {
      id: event.id,
      renterId: data.renterId,
      dealerId: data.dealerId,
      vehicleId: data.vehicleId,
      bookingId,
      status: data.status || 'ACTIVE',
      score: data.score || 0,
      isHotLead: (data.score || 0) >= config.tbybHotLeadThreshold,
      consentGranted: data.consentGranted !== false,
      conversionNotes: data.conversionNotes,
      creditAmount: data.creditAmount || 0,
      expiresAt: data.expiresAt,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.createdAt.toISOString(),
    };
  },

  /**
   * List leads for a dealer
   */
  async listLeadsForDealer(
    dealerId: string,
    status?: TbybLeadStatus
  ): Promise<TbybLeadData[]> {
    const allEvents = await prisma.domainEvent.findMany({
      where: {
        aggregateType: 'tbyb_lead',
        producer: 'partner-service',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter and deduplicate by aggregateId (get latest event per lead)
    const leadMap = new Map<string, any>();
    for (const event of allEvents) {
      const data = event.eventData as any;
      if (data.dealerId === dealerId) {
        if (!leadMap.has(event.aggregateId)) {
          leadMap.set(event.aggregateId, { event, data });
        }
      }
    }

    let leads = Array.from(leadMap.values()).map(({ event, data }) => ({
      id: event.id,
      renterId: data.renterId,
      dealerId: data.dealerId,
      vehicleId: data.vehicleId,
      bookingId: event.aggregateId,
      status: data.status || 'ACTIVE',
      score: data.score || 0,
      isHotLead: (data.score || 0) >= config.tbybHotLeadThreshold,
      consentGranted: data.consentGranted !== false,
      conversionNotes: data.conversionNotes,
      creditAmount: data.creditAmount || 0,
      expiresAt: data.expiresAt,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.createdAt.toISOString(),
    })) as TbybLeadData[];

    if (status) {
      leads = leads.filter(l => l.status === status);
    }

    return leads.sort((a, b) => b.score - a.score);
  },

  /**
   * Expire leads past the 30-day window (background job)
   */
  async expireStaleLeads(): Promise<number> {
    const cutoff = new Date(Date.now() - config.tbybLeadExpiryDays * 24 * 60 * 60 * 1000);
    let expiredCount = 0;

    const activeLeads = await prisma.domainEvent.findMany({
      where: {
        aggregateType: 'tbyb_lead',
        eventType: { not: { in: ['tbyb.lead.expired', 'tbyb.lead.converted', 'tbyb.lead.lost'] } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Deduplicate by aggregateId
    const leadMap = new Map<string, any>();
    for (const event of activeLeads) {
      if (!leadMap.has(event.aggregateId)) {
        leadMap.set(event.aggregateId, event);
      }
    }

    for (const [bookingId, event] of leadMap) {
      const data = event.eventData as any;
      const expiresAt = new Date(data.expiresAt);
      if (expiresAt < new Date() && data.status !== 'CONVERTED' && data.status !== 'LOST') {
        await this.transitionLead(bookingId, 'EXPIRED');
        expiredCount++;
      }
    }

    return expiredCount;
  },
};