// ============================================================================
// Telemetry Service — Trip Manager
// Manages trip lifecycle: start, end, segment tracking
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { DetectedEvent, eventDetector } from './event-detector';

const prisma = new PrismaClient();

export const tripManager = {
  /**
   * Start a trip (called by Booking Service)
   */
  async startTrip(bookingId: string, vehicleId: string, deviceId: string): Promise<any> {
    const existing = await prisma.tripSegment.findFirst({
      where: { bookingId, endTime: null },
    });
    if (existing) return existing;

    return prisma.tripSegment.create({
      data: {
        bookingId,
        vehicleId,
        deviceId,
        startTime: new Date(),
      },
    });
  },

  /**
   * End a trip, calculate score, return summary
   */
  async endTrip(tripId: string): Promise<any> {
    const trip = await prisma.tripSegment.findUnique({
      where: { id: tripId },
      include: { booking: true },
    });
    if (!trip) throw new Error('Trip not found');

    const endTime = new Date();
    const durationHours = (endTime.getTime() - trip.startTime.getTime()) / (1000 * 60 * 60);

    // Get telemetry events for this trip to calculate stats
    const events = await prisma.telemetryEvent.findMany({
      where: {
        vehicleId: trip.vehicleId,
        recordedAt: { gte: trip.startTime, lte: endTime },
      },
      orderBy: { recordedAt: 'asc' },
    });

    // Calculate trip stats
    const harshBrakes = events.filter(e => e.eventType === 'harsh_brake' || e.eventType === 'harsh_brake').length;
    const harshAccels = events.filter(e => e.eventType === 'harsh_acceleration').length;
    const sharpTurns = events.filter(e => e.eventType === 'sharp_turn').length;

    const speeds = events.filter(e => e.speedKmh).map(e => Number(e.speedKmh));
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const totalDistance = trip.distanceKm ? Number(trip.distanceKm) : 0;

    // Calculate driving score
    const harshEvents = harshBrakes + harshAccels + sharpTurns;
    const distance100km = Math.max(totalDistance / 100, 0.1);
    const eventsPer100km = harshEvents / distance100km;

    let score = 100;
    if (eventsPer100km > 0) score -= eventsPer100km * 10;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const hasCollision = events.some(e => e.eventType === 'collision');
    if (hasCollision) score = 0;

    // Update trip segment
    const updated = await prisma.tripSegment.update({
      where: { id: tripId },
      data: {
        endTime,
        distanceKm: totalDistance,
        maxSpeedKmh: maxSpeed,
        avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
        harshEventsCount: harshEvents,
        score,
      },
    });

    return {
      id: updated.id,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime?.toISOString(),
      durationHours: Math.round(durationHours * 10) / 10,
      distanceKm: totalDistance,
      maxSpeedKmh: maxSpeed,
      avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
      harshEvents: { brakes: harshBrakes, accelerations: harshAccels, turns: sharpTurns },
      score,
      collision: hasCollision,
    };
  },

  /**
   * Get current active trip for a vehicle
   */
  async getCurrentTrip(vehicleId: string): Promise<any> {
    const trip = await prisma.tripSegment.findFirst({
      where: { vehicleId, endTime: null },
      include: { booking: { include: { renter: { select: { id: true, fullName: true } } } } },
    });

    if (!trip) return null;

    return {
      id: trip.id,
      bookingId: trip.bookingId,
      startTime: trip.startTime.toISOString(),
      renter: trip.booking?.renter,
      status: 'active',
    };
  },

  /**
   * Get trip history for a vehicle
   */
  async getTripHistory(vehicleId: string, page: number = 1, pageSize: number = 20): Promise<any> {
    const [trips, total] = await Promise.all([
      prisma.tripSegment.findMany({
        where: { vehicleId, endTime: { not: null } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startTime: 'desc' },
      }),
      prisma.tripSegment.count({ where: { vehicleId, endTime: { not: null } } }),
    ]);

    return {
      trips: trips.map(t => ({
        id: t.id,
        startTime: t.startTime.toISOString(),
        endTime: t.endTime?.toISOString(),
        distanceKm: Number(t.distanceKm || 0),
        maxSpeedKmh: Number(t.maxSpeedKmh || 0),
        avgSpeedKmh: Number(t.avgSpeedKmh || 0),
        score: t.score,
        harshEvents: t.harshEventsCount,
      })),
      total,
      page,
      pageSize,
    };
  },

  /**
   * Get trip detail with full data
   */
  async getTripDetail(tripId: string): Promise<any> {
    const trip = await prisma.tripSegment.findUnique({
      where: { id: tripId },
      include: {
        booking: {
          include: { renter: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!trip) throw new Error('Trip not found');

    // Get associated telemetry events
    const events = trip.startTime && trip.endTime ? await prisma.telemetryEvent.findMany({
      where: {
        vehicleId: trip.vehicleId,
        recordedAt: { gte: trip.startTime, lte: trip.endTime },
      },
      orderBy: { recordedAt: 'asc' },
      take: 1000,
    }) : [];

    return {
      id: trip.id,
      bookingId: trip.bookingId,
      startTime: trip.startTime.toISOString(),
      endTime: trip.endTime?.toISOString(),
      distanceKm: Number(trip.distanceKm || 0),
      maxSpeedKmh: Number(trip.maxSpeedKmh || 0),
      avgSpeedKmh: Number(trip.avgSpeedKmh || 0),
      score: trip.score,
      harshEvents: trip.harshEventsCount,
      renter: trip.booking?.renter,
      events: events.length,
    };
  },
};