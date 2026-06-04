// ============================================================================
// Subscription Service — Fleet Allocator
// Manages vehicle pool for Flex subscribers
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const fleetAllocator = {
  /**
   * Get available vehicles for Flex subscribers
   */
  async getAvailablePool(): Promise<any[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'available',
        isVaasEnabled: true,
        isActive: true,
      },
      include: {
        model: { include: { make: true } },
      },
      take: 20,
    });

    return vehicles.map(v => ({
      id: v.id,
      name: `${v.model.make.name} ${v.model.name}`,
      year: v.year,
      color: v.color,
      transmission: v.transmission,
      fuelType: v.fuelType,
      seats: v.seats,
      location: v.city ? `${v.city}, ${v.province || ''}` : null,
      dailyRate: Number(v.dailyRateZar),
      features: v.features,
    }));
  },
};