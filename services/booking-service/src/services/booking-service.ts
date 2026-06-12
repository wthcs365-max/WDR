import { PrismaClient, Prisma } from '@prisma/client';
import { BookingStatus, TransactionType, LedgerDirection, TransactionStatus, TrustTier, InsuranceTier } from '@wdr/shared-types';
import { isValidTransition } from './state-machine';
import { differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

export interface BookingQuote {
  days: number;
  baseRate: number;
  insuranceFee: number;
  bookingFee: number;
  deliveryFee: number;
  plusDiscount: number;
  promoDiscount: number;
  subtotal: number;
  total: number;
  depositRequired: number;
  waiverAvailable: boolean;
  waiverAmount: number;
  waiverFee: number;
}

export const bookingService = {
  /**
   * Calculate a quote for a booking
   */
  async createQuote(params: {
    userId: string;
    vehicleId: string;
    startTime: Date;
    endTime: Date;
    insuranceTier: InsuranceTier;
    isDelivery: boolean;
    promoCode?: string;
  }): Promise<BookingQuote> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.vehicleId },
    });
    if (!vehicle) throw new Error('Vehicle not found');

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { trustScore: true },
    });
    if (!user) throw new Error('User not found');

    const days = Math.max(1, differenceInDays(params.endTime, params.startTime));
    const baseRate = Number(vehicle.dailyRateZar) * days;

    // Insurance fee
    const insuranceMultipliers: Record<string, number> = { basic: 0.05, standard: 0.10, premium: 0.15 };
    const insuranceFee = baseRate * (insuranceMultipliers[params.insuranceTier] || 0.10);

    // Booking fee
    const bookingFee = baseRate * 0.05;

    // WDR Plus discount
    const trustTier = user.trustScore?.tier || TrustTier.BRONZE;
    const plusDiscountMap: Record<string, number> = {
      diamond: 0.15,
      platinum: 0.10,
      gold: 0.05,
      silver: 0,
      bronze: 0,
    };
    const plusDiscountPct = plusDiscountMap[trustTier] || 0;
    const plusDiscount = baseRate * plusDiscountPct;

    // Delivery fee
    const deliveryFee = params.isDelivery ? 150 : 0;

    // Promo code (simplified)
    const promoDiscount = 0; 

    const subtotal = baseRate + insuranceFee + bookingFee + deliveryFee;
    const total = Math.max(0, subtotal - plusDiscount - promoDiscount);

    // Deposit waiver logic
    const vehicleDeposit = Number(vehicle.depositZar) || baseRate * 0.5;
    let depositRequired = vehicleDeposit;
    let waiverAvailable = false;
    let waiverAmount = 0;
    let waiverFee = 0;

    if (user.trustScore?.depositWaiverEligible) {
      const maxWaiver = Number(user.trustScore.maxWaiverAmountZar) || 0;
      waiverAmount = Math.min(maxWaiver, vehicleDeposit);
      waiverAvailable = true;
      // Simplified waiver fee calculation: 10% of waiver amount
      waiverFee = waiverAmount * 0.1;
      depositRequired = vehicleDeposit - waiverAmount;
    }

    return {
      days,
      baseRate,
      insuranceFee,
      bookingFee,
      deliveryFee,
      plusDiscount,
      promoDiscount,
      subtotal,
      total: total + waiverFee,
      depositRequired,
      waiverAvailable,
      waiverAmount,
      waiverFee,
    };
  },

  /**
   * Create a new booking (PENDING_CONFIRMATION)
   */
  async createBooking(params: {
    userId: string;
    vehicleId: string;
    startTime: Date;
    endTime: Date;
    insuranceTier: InsuranceTier;
    isDelivery: boolean;
    promoCode?: string;
  }) {
    // 1. Check for overlaps (soft check)
    const conflict = await prisma.booking.findFirst({
      where: {
        vehicleId: params.vehicleId,
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED] },
        OR: [
          {
            startTime: { lte: params.startTime },
            endTime: { gte: params.startTime },
          },
          {
            startTime: { lte: params.endTime },
            endTime: { gte: params.endTime },
          },
        ],
      },
    });

    if (conflict) {
      throw new Error('Vehicle is already booked for these dates');
    }

    // 2. Calculate quote
    const quote = await this.createQuote(params);

    // 3. Create booking in DB
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.create({
        data: {
          renterId: params.userId,
          vehicleId: params.vehicleId,
          status: BookingStatus.PENDING_CONFIRMATION,
          startTime: params.startTime,
          endTime: params.endTime,
          isDelivery: params.isDelivery,
          dailyRateApplied: quote.baseRate / quote.days,
          estimatedTotal: quote.total,
          insuranceTier: params.insuranceTier,
          insuranceFeeZar: quote.insuranceFee,
          wdrShieldFeeZar: quote.waiverFee,
          depositHoldZar: quote.depositRequired,
          deliveryFeeZar: quote.deliveryFee,
          discountZar: quote.plusDiscount + quote.promoDiscount,
          promoCode: params.promoCode,
        },
      });

      // 4. Record deposit if waiver used
      if (quote.waiverAvailable) {
        await tx.deposit.create({
          data: {
            bookingId: booking.id,
            renterId: params.userId,
            amountZar: quote.depositRequired,
            holdMethod: quote.depositRequired === 0 ? 'wdr_shield_waiver' : 'card_hold',
            waiverUsed: true,
            status: 'pending',
          },
        });
      }

      return booking;
    });
  },

  /**
   * Confirm booking (CONFIRMED)
   */
  async confirmBooking(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error('Booking not found');
    if (!isValidTransition(booking.status as BookingStatus, BookingStatus.CONFIRMED)) {
      throw new Error(`Invalid transition from ${booking.status} to CONFIRMED`);
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      // Integrate with Ledger (simplified)
      // In a real scenario, this would call Ledger Service internal API
      const wallet = await tx.wallet.findUnique({ where: { userId: booking.renterId } });
      if (wallet) {
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            transactionType: TransactionType.RENTAL_PAYMENT,
            direction: LedgerDirection.DEBIT,
            amountZar: booking.estimatedTotal,
            balanceBefore: wallet.balanceZar,
            balanceAfter: Number(wallet.balanceZar) - Number(booking.estimatedTotal),
            status: TransactionStatus.COMPLETED,
            referenceType: 'booking',
            referenceId: booking.id,
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceZar: { decrement: booking.estimatedTotal } },
        });
      }

      return updatedBooking;
    });
  },

  /**
   * Check-in (ACTIVE)
   */
  async checkIn(bookingId: string, data: {
    selfieUrl: string;
    odometerReading: number;
    fuelLevel: number;
    damagePhotos: string[];
    devicePaired: boolean;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error('Booking not found');
    if (!isValidTransition(booking.status as BookingStatus, BookingStatus.ACTIVE)) {
      throw new Error(`Invalid transition from ${booking.status} to ACTIVE`);
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create check-in event
      await tx.checkInEvent.create({
        data: {
          bookingId,
          checkinType: 'digital',
          driverSelfieUrl: data.selfieUrl,
          odometerReading: data.odometerReading,
          fuelLevel: data.fuelLevel,
          damagePhotos: data.damagePhotos,
          devicePaired: data.devicePaired,
        },
      });

      // 2. Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: BookingStatus.ACTIVE,
          actualStartTime: new Date(),
        },
      });

      // 3. Update vehicle status
      await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'booked' },
      });

      return updatedBooking;
    });
  },

  /**
   * Check-out (COMPLETED)
   */
  async checkOut(bookingId: string, data: {
    odometerReading: number;
    fuelLevel: number;
    damagePhotos: string[];
    isDamaged: boolean;
    damageNotes?: string;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { checkIn: true },
    });

    if (!booking) throw new Error('Booking not found');
    if (!isValidTransition(booking.status as BookingStatus, BookingStatus.COMPLETED)) {
      throw new Error(`Invalid transition from ${booking.status} to COMPLETED`);
    }

    const kmDriven = data.odometerReading - (booking.checkIn?.odometerReading || 0);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create check-out event
      await tx.checkOutEvent.create({
        data: {
          bookingId,
          odometerReading: data.odometerReading,
          fuelLevel: data.fuelLevel,
          damagePhotos: data.damagePhotos,
          isDamaged: data.isDamaged,
          damageNotes: data.damageNotes,
        },
      });

      // 2. Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: BookingStatus.COMPLETED,
          actualEndTime: new Date(),
          actualKmDriven: kmDriven,
          actualTotal: booking.estimatedTotal, // Simplified
        },
      });

      // 3. Update vehicle status
      await tx.vehicle.update({
        where: { id: booking.vehicleId },
        data: { 
          status: 'available',
          mileageKm: data.odometerReading,
        },
      });

      // 4. Trigger trust score update (simplified)
      if (booking.renterId) {
        await tx.trustScoreEvent.create({
          data: {
            userId: booking.renterId,
            eventType: 'trip_completed',
            scoreDelta: 10,
            reason: `Completed booking ${bookingId} successfully`,
            referenceId: bookingId,
          },
        });
      }

      return updatedBooking;
    });
  },

  /**
   * Extend booking (EXTENDED)
   */
  async extendBooking(bookingId: string, newEndTime: Date) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error('Booking not found');
    if (!isValidTransition(booking.status as BookingStatus, BookingStatus.EXTENDED)) {
      throw new Error(`Invalid transition from ${booking.status} to EXTENDED`);
    }

    // Check for overlaps with new end time
    const conflict = await prisma.booking.findFirst({
      where: {
        vehicleId: booking.vehicleId,
        id: { not: bookingId },
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED] },
        OR: [
          {
            startTime: { lte: booking.endTime },
            endTime: { gte: newEndTime },
          },
        ],
      },
    });

    if (conflict) {
      throw new Error('Vehicle is already booked for the extension period');
    }

    // Simplified extension fee
    const days = Math.max(1, differenceInDays(newEndTime, booking.endTime));
    const additionalFee = Number(booking.dailyRateApplied) * days;

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.bookingExtension.create({
        data: {
          bookingId,
          originalEndTime: booking.endTime,
          newEndTime,
          additionalFeeZar: additionalFee,
          status: 'approved',
        },
      });

      return tx.booking.update({
        where: { id: bookingId },
        data: { 
          endTime: newEndTime,
          estimatedTotal: { increment: additionalFee },
        },
      });
    });
  },

  /**
   * Cancel booking (CANCELLED)
   */
  async cancelBooking(bookingId: string, reason: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error('Booking not found');
    if (!isValidTransition(booking.status as BookingStatus, BookingStatus.CANCELLED)) {
      throw new Error(`Invalid transition from ${booking.status} to CANCELLED`);
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
        cancellationAt: new Date(),
      },
    });
  },
};
