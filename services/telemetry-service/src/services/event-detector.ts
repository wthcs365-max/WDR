// ============================================================================
// Telemetry Service — Event Detection Engine
// Detects harsh driving, collisions, fuel theft, and tamper events
// ============================================================================

import { config } from '../config';

export interface TelemetrySnapshot {
  speedKmh: number | null;
  headingDeg: number | null;
  lat: number | null;
  lng: number | null;
  fuelLevelPct: number | null;
  odometerKm: number | null;
  engineTempC: number | null;
  batteryVoltage: number | null;
  dtcCodes: string[];
  recordedAt: string;
}

export interface DetectedEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  description: string;
}

export const eventDetector = {
  /**
   * Detect harsh driving events by comparing consecutive telemetry snapshots
   */
  detectHarshEvents(current: TelemetrySnapshot, previous: TelemetrySnapshot): DetectedEvent[] {
    if (!previous || !current.speedKmh || !previous.speedKmh) return [];

    const deltaTime = (new Date(current.recordedAt).getTime() - new Date(previous.recordedAt).getTime()) / 1000;
    if (deltaTime <= 0) return [];

    const speedDelta = (current.speedKmh - previous.speedKmh) / 3.6; // km/h → m/s
    const acceleration = speedDelta / deltaTime;

    const events: DetectedEvent[] = [];

    // Harsh braking
    if (acceleration < config.harshBrakeThreshold) {
      events.push({
        type: 'harsh_brake',
        severity: 'medium',
        value: acceleration,
        description: `Harsh brake detected: ${acceleration.toFixed(2)} m/s²`,
      });
    }

    // Harsh acceleration
    if (acceleration > config.harshAccelThreshold) {
      events.push({
        type: 'harsh_acceleration',
        severity: 'low',
        value: acceleration,
        description: `Harsh acceleration detected: ${acceleration.toFixed(2)} m/s²`,
      });
    }

    // Sharp turn via heading change
    if (previous.headingDeg && current.headingDeg) {
      const headingDelta = Math.abs(current.headingDeg - previous.headingDeg);
      // Normalize to 0-180
      const normalizedDelta = headingDelta > 180 ? 360 - headingDelta : headingDelta;
      if (normalizedDelta > 45 && speedDelta > 0) {
        events.push({
          type: 'sharp_turn',
          severity: 'low',
          value: normalizedDelta,
          description: `Sharp turn detected: ${normalizedDelta.toFixed(1)}° heading change`,
        });
      }
    }

    return events;
  },

  /**
   * Detect collision events
   * Signature: Speed drops from >20 km/h to <2 km/h in <1.5s
   */
  detectCollision(current: TelemetrySnapshot, previous: TelemetrySnapshot): DetectedEvent | null {
    if (!previous || !current) return null;

    const prevSpeed = previous.speedKmh || 0;
    const currSpeed = current.speedKmh || 0;
    const deltaTime = (new Date(current.recordedAt).getTime() - new Date(previous.recordedAt).getTime()) / 1000;

    if (prevSpeed > config.collisionSpeedDropThreshold && currSpeed < 2 && deltaTime < config.collisionTimeWindowSec) {
      // Check for additional collision indicators
      const hasDTCs = current.dtcCodes.length > 0;
      const hasTempAnomaly = current.engineTempC && previous.engineTempC
        && Math.abs(current.engineTempC - previous.engineTempC) > 20;

      return {
        type: 'collision',
        severity: hasDTCs ? 'critical' : 'high',
        value: prevSpeed - currSpeed,
        description: `Collision detected! Speed dropped from ${prevSpeed} to ${currSpeed} km/h in ${deltaTime.toFixed(1)}s`
          + (hasDTCs ? ' (DTC codes present)' : '')
          + (hasTempAnomaly ? ' (temperature anomaly)' : ''),
      };
    }

    return null;
  },

  /**
   * Detect fuel theft
   * Signature: Fuel drops >15% while ignition OFF, no odometer change
   */
  detectFuelTheft(current: TelemetrySnapshot, previous: TelemetrySnapshot, ignitionOn: boolean): DetectedEvent | null {
    if (ignitionOn) return null;
    if (!previous || !current.fuelLevelPct || !previous.fuelLevelPct) return null;

    const fuelDrop = previous.fuelLevelPct - current.fuelLevelPct;
    const odometerUnchanged = current.odometerKm === previous.odometerKm;

    if (fuelDrop > config.fuelTheftDropPct && odometerUnchanged) {
      return {
        type: 'fuel_theft',
        severity: 'high',
        value: fuelDrop,
        description: `Fuel theft detected! ${fuelDrop.toFixed(1)}% fuel drop without odometer change`,
      };
    }

    return null;
  },

  /**
   * Detect tamper events
   */
  detectTamper(eventType: string): DetectedEvent | null {
    if (eventType === 'tamper_detected' || eventType === 'device_disconnected') {
      return {
        type: 'tamper_detected',
        severity: 'high',
        value: 1,
        description: 'Device tamper detected',
      };
    }
    return null;
  },

  /**
   * Detect speeding based on speed vs limit
   */
  detectSpeeding(speedKmh: number, speedLimit?: number): DetectedEvent | null {
    if (!speedLimit) return null;
    const overLimit = speedKmh - speedLimit;

    if (overLimit > config.speedOverLimitThreshold) {
      return {
        type: 'speeding',
        severity: overLimit > 30 ? 'medium' : 'low',
        value: overLimit,
        description: `Speeding: ${overLimit.toFixed(0)} km/h over limit`,
      };
    }

    return null;
  },
};