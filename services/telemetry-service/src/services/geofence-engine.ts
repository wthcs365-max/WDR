// ============================================================================
// Telemetry Service — Geofence Engine
// Point-in-polygon checks, zone definitions, breach detection
// ============================================================================

interface Point {
  lat: number;
  lng: number;
}

interface GeofenceZone {
  type: 'home' | 'pickup' | 'return' | 'operating' | 'restricted' | 'speed_zone';
  name: string;
  polygon?: Point[];  // For polygon zones
  center?: Point;     // For circular zones
  radiusM?: number;   // For circular zones
  speedLimit?: number; // For speed zones
}

export interface GeofenceCheckResult {
  inZone: boolean;
  zoneType?: string;
  zoneName?: string;
  distanceM?: number;
}

function toRadians(deg: number): number {
  return deg * Math.PI / 180;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(p1: Point, p2: Point): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(p2.lat - p1.lat);
  const dLng = toRadians(p2.lng - p1.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(p1.lat)) * Math.cos(toRadians(p2.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Ray-casting algorithm for point-in-polygon check
 */
function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  let j = n - 1;

  for (let i = 0; i < n; i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if ((pi.lng > point.lng) !== (pj.lng > point.lng)
      && point.lat < ((pj.lat - pi.lat) * (point.lng - pi.lng)) / (pj.lng - pi.lng) + pi.lat) {
      inside = !inside;
    }
    j = i;
  }

  return inside;
}

export const geofenceEngine = {
  /**
   * Check if a point is within a circular zone
   */
  checkCircularZone(point: Point, zone: GeofenceZone): GeofenceCheckResult {
    if (!zone.center || !zone.radiusM) {
      return { inZone: true }; // No zone defined = always in zone
    }

    const distance = haversineDistance(point, zone.center);
    return {
      inZone: distance <= zone.radiusM,
      zoneType: zone.type,
      zoneName: zone.name,
      distanceM: Math.round(distance),
    };
  },

  /**
   * Check if a point is within a polygon zone
   */
  checkPolygonZone(point: Point, zone: GeofenceZone): GeofenceCheckResult {
    if (!zone.polygon || zone.polygon.length < 3) {
      return { inZone: true }; // Invalid polygon = always in zone
    }

    const inZone = pointInPolygon(point, zone.polygon);

    // Calculate distance to zone center if available
    let distance: number | undefined;
    if (zone.center) {
      distance = Math.round(haversineDistance(point, zone.center));
    }

    return {
      inZone,
      zoneType: zone.type,
      zoneName: zone.name,
      distanceM: distance,
    };
  },

  /**
   * Check all geofence zones for a vehicle
   */
  checkAllZones(
    point: Point,
    zones: GeofenceZone[],
    isInActiveBooking: boolean
  ): GeofenceCheckResult[] {
    const results: GeofenceCheckResult[] = [];

    for (const zone of zones) {
      if (zone.polygon) {
        results.push(this.checkPolygonZone(point, zone));
      } else if (zone.center) {
        results.push(this.checkCircularZone(point, zone));
      }
    }

    return results;
  },

  /**
   * Determine if a geofence result constitutes a breach
   */
  isBreach(result: GeofenceCheckResult, isInActiveBooking: boolean): boolean {
    if (result.inZone) return false;

    // Home zone: always monitored
    if (result.zoneType === 'home') return true;

    // Only check certain zones during active booking
    if (!isInActiveBooking) return false;

    return ['operating', 'restricted'].includes(result.zoneType || '');
  },

  /**
   * Get breach severity based on zone type
   */
  getBreachSeverity(zoneType: string): 'medium' | 'high' | 'critical' {
    switch (zoneType) {
      case 'restricted': return 'critical';
      case 'operating': return 'high';
      default: return 'medium';
    }
  },
};