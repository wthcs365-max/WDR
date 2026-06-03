// ============================================================================
// Fleet Service — Vehicle Make & Model Service
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const makeModelService = {
  /**
   * Get all vehicle makes
   */
  async getMakes(): Promise<any[]> {
    return prisma.vehicleMake.findMany({
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Get models for a make
   */
  async getModels(makeId: number): Promise<any[]> {
    return prisma.vehicleModel.findMany({
      where: { makeId },
      orderBy: { name: 'asc' },
    });
  },
};