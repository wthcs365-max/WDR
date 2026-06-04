// ============================================================================
// Ledger Service — Commission Service
// Implements the commission structure from the architecture doc
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { CommissionResponse, OwnershipType } from '@wdr/shared-types';
import { config } from '../config';

const prisma = new PrismaClient();

function toCommissionResponse(c: any): CommissionResponse {
  return {
    id: c.id,
    bookingId: c.bookingId,
    grossAmountZar: Number(c.grossAmountZar),
    commissionRatePct: Number(c.commissionRatePct),
    commissionAmountZar: Number(c.commissionAmountZar),
    platformFeeZar: Number(c.platformFeeZar || 0),
    ownerPayoutZar: Number(c.ownerPayoutZar),
    status: c.status,
  };
}

export const commissionService = {
  /**
   * Calculate commission for a booking
   * Implements the tiered commission structure from the architecture doc
   */
  async calculateCommission(
    bookingId: string,
    ownerId: string,
    grossAmountZar: number,
    ownershipType: string,
    ownerTrustTier?: string,
    ownerVehicleCount?: number
  ): Promise<CommissionResponse> {
    // Determine commission rate
    let commissionRate: number;
    let segment: string;

    if (ownershipType === OwnershipType.PRIVATE_OWNER) {
      if (ownerTrustTier === 'diamond') {
        commissionRate = config.diamondOwnerP2PRate; // 15%
        segment = 'P2P Diamond';
      } else {
        commissionRate = config.defaultOwnerP2PRate; // 20%
        segment = 'P2P Standard';
      }
    } else if (ownershipType === OwnershipType.DEALER) {
      const vehicleCount = ownerVehicleCount || 0;
      if (vehicleCount >= config.dealerVolumeThreshold) {
        commissionRate = config.dealerVolumeRate; // 10%
        segment = 'Dealer Volume (10+)';
      } else {
        commissionRate = config.dealerStandardRate; // 12%
        segment = 'Dealer Standard';
      }
    } else {
      commissionRate = config.defaultOwnerP2PRate;
      segment = 'Standard';
    }

    const processingFee = Math.round(grossAmountZar * config.platformProcessingFee * 100) / 100;
    const commissionAmount = Math.round(grossAmountZar * commissionRate * 100) / 100;
    const ownerPayout = Math.round((grossAmountZar - commissionAmount - processingFee) * 100) / 100;

    // Check if existing commission record
    const existing = await prisma.commission.findUnique({ where: { bookingId } });
    if (existing) {
      return toCommissionResponse(existing);
    }

    const commission = await prisma.commission.create({
      data: {
        bookingId,
        ownerId,
        grossAmountZar,
        commissionRatePct: commissionRate * 100,
        commissionAmountZar: commissionAmount,
        platformFeeZar: processingFee,
        ownerPayoutZar: ownerPayout,
        status: 'calculated',
      },
    });

    return toCommissionResponse(commission);
  },

  /**
   * Get commission by booking ID
   */
  async getByBookingId(bookingId: string): Promise<CommissionResponse> {
    const commission = await prisma.commission.findUnique({ where: { bookingId } });
    if (!commission) throw new Error('Commission not found for this booking');
    return toCommissionResponse(commission);
  },

  /**
   * Get commission summary for an owner
   */
  async getOwnerSummary(ownerId: string): Promise<{
    totalEarned: number;
    totalCommission: number;
    pendingPayouts: number;
    paidPayouts: number;
  }> {
    const commissions = await prisma.commission.findMany({ where: { ownerId } });

    return {
      totalEarned: commissions.reduce((s, c) => s + Number(c.ownerPayoutZar), 0),
      totalCommission: commissions.reduce((s, c) => s + Number(c.commissionAmountZar), 0),
      pendingPayouts: commissions.filter(c => c.status === 'calculated' || c.status === 'invoice')
        .reduce((s, c) => s + Number(c.ownerPayoutZar), 0),
      paidPayouts: commissions.filter(c => c.status === 'paid')
        .reduce((s, c) => s + Number(c.ownerPayoutZar), 0),
    };
  },

  /**
   * Mark commission as paid
   */
  async markAsPaid(id: string): Promise<CommissionResponse> {
    const commission = await prisma.commission.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
    });
    return toCommissionResponse(commission);
  },
};