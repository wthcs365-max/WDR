// ============================================================================
// Fleet Service — Vehicle Service
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { CreateVehicleInput, VehicleSearchParams, VehicleResponse } from '@wdr/shared-types';

const prisma = new PrismaClient();

function toVehicleResponse(vehicle: any): VehicleResponse {
  return {
    id: vehicle.id,
    ownerId: vehicle.ownerId,
    ownershipType: vehicle.ownershipType,
    make: vehicle.model?.make?.name || '',
    model: vehicle.model?.name || '',
    year: vehicle.year,
    color: vehicle.color,
    transmission: vehicle.transmission,
    seats: vehicle.seats,
    doors: vehicle.doors,
    fuelType: vehicle.fuelType,
    features: vehicle.features || [],
    photos: vehicle.photos || [],
    status: vehicle.status,
    dailyRateZar: Number(vehicle.dailyRateZar),
    weeklyRateZar: vehicle.weeklyRateZar ? Number(vehicle.weeklyRateZar) : null,
    monthlyRateZar: vehicle.monthlyRateZar ? Number(vehicle.monthlyRateZar) : null,
    depositZar: vehicle.depositZar ? Number(vehicle.depositZar) : null,
    location: vehicle.locationLat && vehicle.locationLng
      ? {
          lat: Number(vehicle.locationLat),
          lng: Number(vehicle.locationLng),
          address: vehicle.locationAddress,
          city: vehicle.city,
          province: vehicle.province,
        }
      : null,
    isP2pEnabled: vehicle.isP2pEnabled,
    isVaasEnabled: vehicle.isVaasEnabled,
    insuranceTier: vehicle.insuranceTier,
  };
}

export const vehicleService = {
  /**
   * Search vehicles with filters
   */
  async search(params: VehicleSearchParams): Promise<{ vehicles: VehicleResponse[]; total: number }> {
    const where: any = {
      isActive: true,
      status: 'available',
    };

    // Filter by makes
    if (params.makes) {
      const makeNames = params.makes.split(',').map((m: string) => m.trim());
      where.model = {
        make: {
          name: { in: makeNames },
        },
      };
    }

    // Filter by transmission
    if (params.transmission) {
      where.transmission = params.transmission;
    }

    // Filter by fuel type
    if (params.fuelType) {
      const fuelTypes = params.fuelType.split(',').map((f: string) => f.trim());
      where.fuelType = { in: fuelTypes };
    }

    // Filter by minimum seats
    if (params.minSeats) {
      where.seats = { gte: params.minSeats };
    }

    // Filter by price range
    if (params.minRate || params.maxRate) {
      where.dailyRateZar = {};
      if (params.minRate) where.dailyRateZar.gte = params.minRate;
      if (params.maxRate) where.dailyRateZar.lte = params.maxRate;
    }

    // Filter by ownership type
    if (params.ownershipType) {
      where.ownershipType = params.ownershipType;
    }

    // P2P / VaaS filters
    if (params.p2pEnabled) where.isP2pEnabled = true;
    if (params.vaasEnabled) where.isVaasEnabled = true;

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          model: {
            include: { make: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: params.sort === 'price_asc'
          ? { dailyRateZar: 'asc' }
          : params.sort === 'price_desc'
          ? { dailyRateZar: 'desc' }
          : { createdAt: 'desc' },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return {
      vehicles: vehicles.map(toVehicleResponse),
      total,
    };
  },

  /**
   * Get vehicle by ID
   */
  async getById(id: string): Promise<VehicleResponse> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        model: { include: { make: true } },
        device: true,
      },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return toVehicleResponse(vehicle);
  },

  /**
   * Create a vehicle listing
   */
  async create(ownerId: string, input: CreateVehicleInput): Promise<VehicleResponse> {
    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId,
        ownershipType: input.ownershipType,
        modelId: input.modelId,
        year: input.year,
        color: input.color,
        vin: input.vin,
        registrationPlate: input.registrationPlate,
        mileageKm: input.mileageKm,
        fuelType: input.fuelType,
        transmission: input.transmission,
        seats: input.seats,
        doors: input.doors,
        dailyRateZar: input.dailyRateZar,
        weeklyRateZar: input.weeklyRateZar,
        monthlyRateZar: input.monthlyRateZar,
        depositZar: input.depositZar,
        features: input.features || [],
        insuranceTier: input.insuranceTier || 'standard',
        isP2pEnabled: input.isP2pEnabled || false,
        isVaasEnabled: input.isVaasEnabled || false,
        city: input.city,
        province: input.province,
      },
      include: {
        model: { include: { make: true } },
      },
    });

    return toVehicleResponse(vehicle);
  },

  /**
   * Update a vehicle listing
   */
  async update(id: string, ownerId: string, input: Partial<CreateVehicleInput>): Promise<VehicleResponse> {
    // Verify ownership
    const existing = await prisma.vehicle.findFirst({ where: { id, ownerId } });
    if (!existing) {
      throw new Error('Vehicle not found or not owned by you');
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...input,
        features: input.features as any,
      },
      include: {
        model: { include: { make: true } },
      },
    });

    return toVehicleResponse(vehicle);
  },

  /**
   * Delete/remove a vehicle listing
   */
  async remove(id: string, ownerId: string): Promise<void> {
    const existing = await prisma.vehicle.findFirst({ where: { id, ownerId } });
    if (!existing) {
      throw new Error('Vehicle not found or not owned by you');
    }
    await prisma.vehicle.update({
      where: { id },
      data: { isActive: false, status: 'unavailable' },
    });
  },

  /**
   * Get owner's vehicles
   */
  async listByOwner(ownerId: string): Promise<VehicleResponse[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { ownerId },
      include: {
        model: { include: { make: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map(toVehicleResponse);
  },

  /**
   * Get vehicle availability calendar
   */
  async getAvailability(vehicleId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const where: any = { vehicleId };
    if (startDate) {
      where.date = { ...(where.date || {}), gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...(where.date || {}), lte: new Date(endDate) };
    }

    return prisma.vehicleAvailability.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  },
};