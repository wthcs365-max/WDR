// ============================================================================
// Analytics Service — Analytics Engine
// Fleet utilization, top vehicles, revenue reports, dealer payouts
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyticsEngine = {
  /**
   * Fleet Utilization: booking frequency, revenue, and idle rates
   */
  async getFleetUtilization(ownerId?: string, days: number = 30): Promise<any> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const whereVehicle: any = {};
    if (ownerId) whereVehicle.ownerId = ownerId;

    const vehicles = await prisma.vehicle.findMany({
      where: whereVehicle,
      include: {
        bookings: {
          where: { createdAt: { gte: since } },
          select: { id: true, status: true, estimatedTotal: true, actualTotal: true, startTime: true, endTime: true },
        },
      },
    });

    const totalVehicles = vehicles.length;
    let totalBookings = 0;
    let totalRevenue = 0;
    let activeBookings = 0;

    for (const v of vehicles) {
      totalBookings += v.bookings.length;
      for (const b of v.bookings) {
        totalRevenue += Number(b.actualTotal || b.estimatedTotal || 0);
        if (b.status === 'active' || b.status === 'confirmed') activeBookings++;
      }
    }

    const utilizationRate = totalVehicles > 0
      ? Math.round((vehicles.filter(v => v.bookings.length > 0).length / totalVehicles) * 100)
      : 0;

    const avgRevenuePerVehicle = totalVehicles > 0 ? Math.round(totalRevenue / totalVehicles) : 0;

    return {
      period: { days, since: since.toISOString() },
      totalVehicles,
      totalBookings,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeBookings,
      utilizationRate,
      avgRevenuePerVehicle,
    };
  },

  /**
   * Top-Performing Vehicles by revenue and booking frequency
   */
  async getTopVehicles(ownerId?: string, limit: number = 10): Promise<any[]> {
    const where: any = {};
    if (ownerId) where.ownerId = ownerId;

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        model: { include: { make: true } },
        bookings: {
          where: { status: 'completed' },
          select: { actualTotal: true, estimatedTotal: true },
        },
      },
    });

    const ranked = vehicles.map(v => {
      const revenue = v.bookings.reduce((s, b) => s + Number(b.actualTotal || b.estimatedTotal || 0), 0);
      const bookingCount = v.bookings.length;
      return {
        id: v.id,
        name: `${v.model.make.name} ${v.model.name}`,
        year: v.year,
        color: v.color,
        dailyRate: Number(v.dailyRateZar),
        bookingCount,
        totalRevenue: Math.round(revenue * 100) / 100,
        avgRevenuePerBooking: bookingCount > 0 ? Math.round(revenue / bookingCount) : 0,
      };
    });

    return ranked
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  },

  /**
   * Fleet utilization over time (daily breakdown)
   */
  async getUtilizationOverTime(ownerId?: string, days: number = 30): Promise<any[]> {
    const dailyData: any[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const whereVehicle: any = {};
      if (ownerId) whereVehicle.ownerId = ownerId;

      const vehicleCount = await prisma.vehicle.count({ where: whereVehicle });

      const bookingCount = await prisma.booking.count({
        where: {
          vehicle: whereVehicle,
          startTime: { lte: dayEnd },
          endTime: { gte: dayStart },
          status: { in: ['confirmed', 'active', 'completed'] },
        },
      });

      const revenue = await prisma.booking.aggregate({
        where: {
          vehicle: whereVehicle,
          createdAt: { gte: dayStart, lte: dayEnd },
          status: { in: ['completed', 'active'] },
        },
        _sum: { actualTotal: true },
      });

      dailyData.push({
        date: date.toISOString().split('T')[0],
        vehiclesAvailable: vehicleCount,
        bookingsOnDay: bookingCount,
        utilizationRate: vehicleCount > 0 ? Math.round((bookingCount / vehicleCount) * 100) : 0,
        revenue: Math.round(Number(revenue._sum.actualTotal || 0) * 100) / 100,
      });
    }

    return dailyData;
  },

  /**
   * Revenue breakdown by vehicle
   */
  async getRevenueByVehicle(ownerId?: string): Promise<any[]> {
    const where: any = {};
    if (ownerId) where.ownerId = ownerId;

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        model: { include: { make: true } },
        bookings: {
          where: { status: { in: ['completed', 'active'] } },
          select: { actualTotal: true, estimatedTotal: true },
        },
      },
    });

    return vehicles.map(v => {
      const revenue = v.bookings.reduce((s, b) => s + Number(b.actualTotal || b.estimatedTotal || 0), 0);
      return {
        id: v.id,
        name: `${v.model.make.name} ${v.model.name}`,
        year: v.year,
        revenue: Math.round(revenue * 100) / 100,
        bookingCount: v.bookings.length,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Generate monthly payout report for a dealer/owner
   */
  async getMonthlyPayoutReport(ownerId: string, year: number, month: number): Promise<any> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const commissions = await prisma.commission.findMany({
      where: {
        ownerId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      include: { booking: { include: { vehicle: { include: { model: { include: { make: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalGross = commissions.reduce((s, c) => s + Number(c.grossAmountZar), 0);
    const totalCommission = commissions.reduce((s, c) => s + Number(c.commissionAmountZar), 0);
    const totalPayout = commissions.reduce((s, c) => s + Number(c.ownerPayoutZar), 0);
    const pendingCount = commissions.filter(c => c.status === 'calculated' || c.status === 'invoice').length;

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      ownerId,
      summary: {
        totalBookings: commissions.length,
        totalGrossRevenue: Math.round(totalGross * 100) / 100,
        totalCommissionDeducted: Math.round(totalCommission * 100) / 100,
        totalPayout: Math.round(totalPayout * 100) / 100,
        pendingPayouts: pendingCount,
        payoutStatus: pendingCount > 0 ? 'partial' : 'all_paid',
      },
      bookings: commissions.map(c => ({
        bookingId: c.bookingId,
        vehicleName: c.booking?.vehicle
          ? `${c.booking.vehicle.model.make.name} ${c.booking.vehicle.model.name}`
          : 'Unknown',
        grossAmount: Number(c.grossAmountZar),
        commissionRate: Number(c.commissionRatePct),
        commissionAmount: Number(c.commissionAmountZar),
        platformFee: Number(c.platformFeeZar || 0),
        payoutAmount: Number(c.ownerPayoutZar),
        status: c.status,
        date: c.createdAt.toISOString().split('T')[0],
      })),
    };
  },

  /**
   * Overall analytics summary for a dealer/owner dashboard
   */
  async getDashboardSummary(ownerId: string): Promise<any> {
    const [utilization, topVehicles, revenueByVehicle] = await Promise.all([
      this.getFleetUtilization(ownerId, 30),
      this.getTopVehicles(ownerId, 5),
      this.getRevenueByVehicle(ownerId),
    ]);

    const totalRevenue = revenueByVehicle.reduce((s, v) => s + v.revenue, 0);
    const totalBookings = revenueByVehicle.reduce((s, v) => s + v.bookingCount, 0);

    return {
      ownerId,
      fleetOverview: utilization,
      performance: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        avgRevenuePerBooking: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
        topVehicles: topVehicles.slice(0, 3),
      },
    };
  },

  /**
   * Trust score distribution analytics (admin)
   */
  async getTrustScoreDistribution(): Promise<any> {
    const scores = await prisma.trustScore.findMany({
      select: { tier: true, overallScore: true },
    });

    const distribution: Record<string, number> = {
      diamond: 0, platinum: 0, gold: 0, silver: 0, bronze: 0, restricted: 0,
    };
    let totalScore = 0;

    for (const s of scores) {
      distribution[s.tier] = (distribution[s.tier] || 0) + 1;
      totalScore += s.overallScore;
    }

    const total = scores.length;

    return {
      totalUsers: total,
      averageScore: total > 0 ? Math.round(totalScore / total) : 0,
      distribution: Object.entries(distribution).map(([tier, count]) => ({
        tier,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      })),
    };
  },
};