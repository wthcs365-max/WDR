// ============================================================================
// Telemetry Service — Trust Scoring Integration
// Feeds driving behavior data into the Trust Scoring Engine
// ============================================================================

export const trustIntegration = {
  /**
   * Calculate the trust score impact for a completed trip
   * Maps trip score (0-100) to trust score delta
   */
  calculateScoreDelta(tripScore: number): { delta: number; description: string } {
    if (tripScore > 80) {
      const delta = Math.min(15, Math.round((tripScore - 80) * 0.3));
      return { delta, description: `Trip completed with score ${tripScore} (good driving)` };
    } else if (tripScore >= 50) {
      const delta = Math.round((tripScore - 50) * 0.1);
      return { delta, description: `Trip completed with score ${tripScore} (average driving)` };
    } else {
      const delta = Math.max(-15, Math.round((tripScore - 50) * 0.3));
      return { delta, description: `Trip completed with score ${tripScore} (poor driving)` };
    }
  },

  /**
   * Get the trust score impact description for a detected event
   */
  getEventTrustImpact(eventType: string): { delta: number; description: string } {
    switch (eventType) {
      case 'collision':
        return { delta: -200, description: 'Collision detected — score frozen pending investigation' };
      case 'geofence_breach':
        return { delta: -30, description: 'Geofence breach (operating zone)' };
      case 'geofence_breach_restricted':
        return { delta: -50, description: 'Geofence breach (restricted zone)' };
      case 'speeding':
        return { delta: -15, description: 'Speeding violation detected' };
      case 'fuel_theft':
        return { delta: -100, description: 'Fuel theft detected — pending claim' };
      case 'tamper_detected':
        return { delta: -75, description: 'Device tamper detected' };
      case 'harsh_events':
        return { delta: -5, description: 'Aggregated harsh driving events on trip' };
      default:
        return { delta: 0, description: `Telemetry event: ${eventType}` };
    }
  },

  /**
   * Build the trust service event payload
   */
  buildTrustEvent(
    userId: string,
    eventType: string,
    scoreDelta: number,
    description: string,
    referenceId?: string,
    metadata?: Record<string, any>
  ): any {
    return {
      userId,
      eventType,
      reason: description,
      referenceId,
      metadata,
    };
  },
};
