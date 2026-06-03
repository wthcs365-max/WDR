// ============================================================================
// Fleet Service — Telematics Device Service (placeholder)
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { DeviceRegistrationInput } from '@wdr/shared-types';

const prisma = new PrismaClient();

export const deviceService = {
  /**
   * Register a telematics device for a vehicle
   */
  async register(ownerId: string, input: DeviceRegistrationInput): Promise<any> {
    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: input.vehicleId, ownerId },
    });
    if (!vehicle) {
      throw new Error('Vehicle not found or not owned by you');
    }

    return prisma.vehicleDevice.create({
      data: {
        vehicleId: input.vehicleId,
        deviceImei: input.deviceImei,
        deviceType: input.deviceType,
        firmwareVersion: input.firmwareVersion,
      },
    });
  },

  /**
   * Get device info for a vehicle
   */
  async getByVehicle(vehicleId: string): Promise<any> {
    return prisma.vehicleDevice.findUnique({
      where: { vehicleId },
    });
  },

  /**
   * Update device last ping timestamp (called by telemetry ingestion)
   */
  async updatePing(deviceId: string): Promise<void> {
    await prisma.vehicleDevice.update({
      where: { id: deviceId },
      data: { lastPingAt: new Date() },
    });
  },
};