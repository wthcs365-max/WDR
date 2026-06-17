// ============================================================================
// Telemetry Service — Ingestion Service
// Handles telemetry event ingestion, validation, dedup, and batching
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TelemetryEventInput {
  deviceId: string;
  vehicleId?: string;
  eventType: string;
  lat?: number;
  lng?: number;
  altitudeM?: number;
  headingDeg?: number;
  speedKmh?: number;
  odometerKm?: number;
  fuelLevelPct?: number;
  engineRpm?: number;
  batteryVoltage?: number;
  evChargePct?: number;
  engineTempC?: number;
  tirePressurePsi?: Record<string, number>;
  dtcCodes?: string[];
  deviceBatteryPct?: number;
  signalStrength?: number;
  accuracyM?: number;
  recordedAt: string;
  metadata?: Record<string, any>;
}

export const ingestionService = {
  /**
   * Validate a telemetry event
   */
  validate(input: TelemetryEventInput): string | null {
    if (!input.deviceId) return 'deviceId is required';
    if (!input.eventType) return 'eventType is required';
    if (!input.recordedAt) return 'recordedAt is required';

    const recorded = new Date(input.recordedAt);
    if (isNaN(recorded.getTime())) return 'Invalid recordedAt timestamp';
    if (recorded > new Date()) return 'recordedAt cannot be in the future';
    if (recorded < new Date(Date.now() - 24 * 60 * 60 * 1000)) return 'recordedAt too old (>24h)';

    if (input.lat !== undefined && (input.lat < -90 || input.lat > 90)) return 'Invalid latitude';
    if (input.lng !== undefined && (input.lng < -180 || input.lng > 180)) return 'Invalid longitude';

    return null;
  },

  /**
   * Process a single telemetry event
   */
  async ingest(input: TelemetryEventInput): Promise<any> {
    const error = this.validate(input);
    if (error) throw new Error(error);

    const device = await prisma.vehicleDevice.findUnique({
      where: { deviceImei: input.deviceId },
      include: { vehicle: true },
    });

    if (!device) throw new Error('Device not found');
    if (!device.isActive) throw new Error('Device is not active');

    const vehicleId = input.vehicleId || device.vehicleId;

    // Update device last ping
    await prisma.vehicleDevice.update({
      where: { id: device.id },
      data: { lastPingAt: new Date(), batteryLevel: input.deviceBatteryPct },
    });

    // Create telemetry event
    return prisma.telemetryEvent.create({
      data: {
        deviceId: device.id,
        vehicleId,
        eventType: input.eventType,
        lat: input.lat,
        lng: input.lng,
        altitudeM: input.altitudeM,
        headingDeg: input.headingDeg,
        speedKmh: input.speedKmh,
        odometerKm: input.odometerKm,
        fuelLevelPct: input.fuelLevelPct,
        engineRpm: input.engineRpm,
        batteryVoltage: input.batteryVoltage,
        evChargePct: input.evChargePct,
        engineTempC: input.engineTempC,
        tirePressurePsi: input.tirePressurePsi || {},
        dtcCodes: input.dtcCodes || [],
        deviceBatteryPct: input.deviceBatteryPct,
        signalStrength: input.signalStrength,
        accuracyM: input.accuracyM,
        recordedAt: new Date(input.recordedAt),
      },
    });
  },

  /**
   * Batch ingest multiple events
   */
  async ingestBatch(inputs: TelemetryEventInput[]): Promise<{ ingested: number; errors: string[] }> {
    const errors: string[] = [];
    let ingested = 0;

    for (const input of inputs) {
      try {
        await this.ingest(input);
        ingested++;
      } catch (err: any) {
        errors.push(`Event ${input.eventType}@${input.recordedAt}: ${err.message}`);
      }
    }

    return { ingested, errors };
  },

  /**
   * Get last known position for a vehicle
   */
  async getLastPosition(vehicleId: string): Promise<any> {
    const event = await prisma.telemetryEvent.findFirst({
      where: {
        vehicleId,
        eventType: { in: ['gps_location', 'ignition_on', 'ignition_off'] },
      },
      orderBy: { recordedAt: 'desc' },
    });

    if (!event) return null;

    return {
      lat: event.lat ? Number(event.lat) : null,
      lng: event.lng ? Number(event.lng) : null,
      speedKmh: event.speedKmh ? Number(event.speedKmh) : null,
      headingDeg: event.headingDeg ? Number(event.headingDeg) : null,
      recordedAt: event.recordedAt.toISOString(),
    };
  },

  /**
   * Get recent events for a vehicle
   */
  async getRecentEvents(vehicleId: string, limit: number = 50): Promise<any[]> {
    return prisma.telemetryEvent.findMany({
      where: { vehicleId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  },
};