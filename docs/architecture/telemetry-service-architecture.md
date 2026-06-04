# WTH Drive Rentals — Telemetry Ingestion Engine Architecture

**Version:** 1.0  
**Owner:** Architect  
**Status:** Draft for Review  
**Last Updated:** 2025-07-15  

---

## 1. Service Overview

The Telemetry Service is the real-time data backbone of WDR. It ingests high-velocity GPS, sensor, and vehicle diagnostic data from multiple sources (OBD-II dongles, smartphone SDK, hardwired telematics units) and transforms it into actionable insights: driving behavior scores, geofence alerts, collision detection, and trip analytics. It directly feeds the **Trust Scoring Engine** with driving behavior data.

### 1.1 Service Boundary

```
┌──────────────────────────────────────────────────────────────────────┐
│                       TELEMETRY SERVICE                               │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Ingestion     │  │ Stream       │  │ Event Detection Engine  │   │
│  │ Gateway      │  │ Processor    │  │ ─────────────────────── │   │
│  │ ────────────  │  │ ───────────  │  │ • Harsh braking          │   │
│  │ • REST ingest │  │ • Dedup      │  │ • Harsh acceleration     │   │
│  │ • WebSocket   │  │ • Validation │  │ • Sharp cornering        │   │
│  │ • Batch       │  │ • Enrichment │  │ • Collision detection    │   │
│  │ • Auth verify │  │ • Rate limit │  │ • Speeding               │   │
│  └──────────────┘  └──────────────┘  │ • Fuel theft detection    │   │
│                                        │ • Tamper detection        │   │
│  ┌──────────────┐  ┌──────────────┐  └──────────────────────────┘   │
│  │ Trip Manager  │  │ Geofence     │  ┌──────────────────────────┐   │
│  │ ────────────  │  │ Engine      │  │ Scoring Engine           │   │
│  │ • Trip start  │  │ ───────────  │  │ ─────────────────────── │   │
│  │ • Trip end    │  │ • Zone defs │  │ • Trip score (0-100)     │   │
│  │ • Segment     │  │ • Enter/exit │  │ • Smoothness metric     │   │
│  │   aggregation │  │ • Breach     │  │ • Speed compliance      │   │
│  │ • Distance    │  │ • Speed zone │  │ • Night driving ratio   │   │
│  │   calculation │  │ • Alert pub  │  │ • Geofence compliance   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘

Inter-Service Dependencies:
  → Booking Service:  GET /internal/bookings/active/{vehicleId} (validate trip)
  → Trust Service:   POST /internal/trust/event (score events)
  → Notification:    PUB telemetry.{alert_type} (alerts)
  → Vehicle Service: GET /vehicles/{id} (device config, geofence zones)
```

---

## 2. Data Ingestion Architecture

### 2.1 Ingestion Pipeline

```
┌───────────────────┐   ┌──────────────────┐   ┌────────────────────────┐
│   DATA SOURCES    │   │  INGESTION GATEWAY│   │   STREAM PROCESSING    │
│                   │   │                   │   │                        │
│ Smartphone SDK    │──▶│  REST /ws/telemetry│──▶│  Redis Streams         │
│ (10s interval)    │   │  POST /v1/telemetry│   │  wdr:telemetry:raw    │
│                   │   │                   │   │  (partitioned by       │
│ OBD-II Dongle     │──▶│  Auth: device      │   │   device_id % 10)     │
│ (15s interval)    │   │  API key + JWT     │   │                        │
│                   │   │                   │   │  Consumer Groups:      │
│ GPS Tracker       │──▶│  Rate Limit:       │   │  ├─ persister         │
│ (30s interval)    │   │  100 msg/s/device  │   │  ├─ realtime-scorer   │
│                   │   │  10000 msg/s total │   │  ├─ geofence-checker  │
│ Batch Upload      │──▶│                   │   │  └─ alert-detector    │
│ (hourly for       │   │  Validation:       │   │                        │
│  offline devices) │   │  • Device active   │   │  ┌──────────────────┐ │
│                   │   │  • Vehicle in trip │   │  │  PERSISTENCE LAYER│ │
│                   │   │  • Timestamp range │   │  │                  │ │
└───────────────────┘   │  • Geo bounds      │   │  │ TimescaleDB      │ │
                        └──────────────────┘   │  │ (partitioned     │ │
                                               │  │  by month)       │ │
                                               │  │                  │ │
                                               │  │ Redis (hot cache │ │
                                               │  │  last known pos) │ │
                                               │  └──────────────────┘ │
                                               └────────────────────────┘
```

### 2.2 Telemetry Message Format

```json
{
  "device_id": "dev_abc123",
  "vehicle_id": "veh_xyz789",
  "event_type": "gps_location",
  "lat": -33.9249,
  "lng": 18.4241,
  "altitude_m": 42.5,
  "heading_deg": 180.0,
  "speed_kmh": 65.2,
  "odometer_km": 45230,
  "fuel_level_pct": 78.5,
  "engine_rpm": 2200,
  "battery_voltage": 12.4,
  "ev_charge_pct": null,
  "engine_temp_c": 91.2,
  "tire_pressure_psi": {"front_left": 32, "front_right": 31, "rear_left": 30, "rear_right": 31},
  "dtc_codes": [],
  "device_battery_pct": 85,
  "signal_strength": -78,
  "accuracy_m": 3.2,
  "recorded_at": "2025-07-15T14:30:00Z"
}
```

### 2.3 High-Volume Strategy

| Strategy | Detail |
|----------|--------|
| **Partitioning** | Telemetry table partitioned by month (`PARTITION BY RANGE (recorded_at)`) |
| **TimescaleDB** | PostgreSQL extension for automatic partitioning, continuous aggregates |
| **Batch inserts** | Micro-batch every 5s (buffer up to 500 events) for write efficiency |
| **Data retention** | Raw: 90 days; 1-min aggregates: 12 months; 5-min aggregates: 24 months |
| **Redis hot cache** | Last known position per vehicle (keyed by `wdr:telemetry:last:{vehicleId}`, TTL 5min) |
| **Deduplication** | Dedup by `device_id + recorded_at` within 5s window (Redis bloom filter) |

### 2.4 Data Flow Throughput Estimates

| Metric | Target |
|--------|--------|
| Peak ingestion rate | 10,000 events/second |
| Average event size | ~400 bytes |
| Daily volume (10k vehicles, 15s interval) | ~57.6M events (~23 GB/day) |
| Redis stream capacity | 100k events per partition (10 partitions = 1M events buffer) |
| Consumer processing latency P50 | <100ms per event |
| Consumer processing latency P99 | <500ms per event |

---

## 3. Real-Time Event Detection

### 3.1 Event Detection Engine

The stream processor evaluates each telemetry event and emits derived events when thresholds are crossed.

#### Harsh Driving Detection

```typescript
interface HarshEventThresholds {
    harshBrake: number;         // m/s² deceleration (default: -3.0)
    harshAcceleration: number;  // m/s² acceleration (default: 2.5)
    sharpTurn: number;          // m/s² lateral (default: 4.0)
    speedThreshold: number;     // km/h over limit (default: 20)
}

function detectEvents(current: TelemetryEvent, previous: TelemetryEvent, thresholds: HarshEventThresholds) {
    if (!previous || !current.speed_kmh || !previous.speed_kmh) return [];
    
    const deltaTime = (new Date(current.recorded_at).getTime() - new Date(previous.recorded_at).getTime()) / 1000;
    if (deltaTime <= 0) return [];
    
    const speedDelta = (current.speed_kmh - previous.speed_kmh) / 3.6;  // km/h → m/s
    const acceleration = speedDelta / deltaTime;
    
    const events: DetectedEvent[] = [];
    
    if (acceleration < thresholds.harshBrake) {
        events.push({ type: 'harsh_brake', severity: 'medium', value: acceleration });
    }
    if (acceleration > thresholds.harshAcceleration) {
        events.push({ type: 'harsh_acceleration', severity: 'low', value: acceleration });
    }
    
    // Detect sharp turn via heading change
    if (previous.heading_deg && current.heading_deg) {
        const headingDelta = Math.abs(current.heading_deg - previous.heading_deg);
        if (headingDelta > 45 && speedDelta > 0) {
            events.push({ type: 'sharp_turn', severity: 'low', value: headingDelta });
        }
    }
    
    return events;
}
```

#### Collision Detection

```
Collision Signature:
  • Speed drops from >20 km/h to 0 in <1 second
  • Engine_temp_c or battery_voltage anomaly post-event
  • DTC codes appear (airbag deployment, impact sensor trigger)
  
Detection:
  if prev_speed > 20 AND curr_speed < 2 AND delta_time < 1.5 seconds:
    → COLLISION event (severity: high/critical)
    → Automatic notification to renter + owner + emergency
    → Trip segment ended
    → Trust score: -200 pending investigation
```

#### Fuel Theft Detection

```
Fuel Theft Signature:
  • Fuel level drops >15% while ignition OFF
  • No odometer change
  • Occurs outside geofence home zone (parked elsewhere)
  
Detection:
  if ignition == OFF AND fuel_drop > 15% AND odometer_unchanged:
    → FUEL_THEFT alert (severity: high)
    → Notify owner + admin
    → Cross-reference with geofence check
```

### 3.2 Event Severity Classification

| Severity | Color | Response | Examples |
|----------|-------|----------|----------|
| Low | 🟢 Green | Logged, no alert | Harsh acceleration, minor speeding (<10 over) |
| Medium | 🟡 Yellow | App notification, score impact | Harsh brake, geofence exit, speeding 10-20 over |
| High | 🟠 Orange | Push notification + SMS owner | Geofence breach >1km, fuel theft, tamper detected |
| Critical | 🔴 Red | Phone call + emergency services | Collision, vehicle theft (no GPS), immobilization trigger |

---

## 4. Geofencing Logic

### 4.1 Zone Definitions

Each vehicle has configurable geofence zones:

| Zone Type | Purpose | Radius | Evaluated During |
|-----------|---------|--------|------------------|
| **Home** | Vehicle's registered parking location | 200m (configurable) | All times |
| **Pickup** | Renter pickup location (may differ from home) | 500m | Check-in window |
| **Return** | Expected return location | 500m | Check-out window |
| **Operating** | Allowed operating area (city/metro boundary) | Custom polygon | Active booking |
| **Restricted** | Prohibited zones (border crossings, high-theft areas) | Custom polygon | Active booking |
| **Speed Zone** | Areas with enforced speed limits | Road segment | Active booking |

### 4.2 Geofence Check Flow

```
Telemetry Event (lat, lng)
    ↓
Is vehicle in an active booking?
    ├── No → Check Home zone only
    │        ├── Within home zone → OK
    │        └── Outside home zone → Alert (movement while unbooked)
    │
    └── Yes → Check all applicable zones
             ├── Within Operating zone?
             │    ├── Yes → Continue
             │    └── No  → BREACH event (high severity)
             │              → Notify owner + renter
             │              → Log trust score event (-30 pts)
             │
             ├── Entering Restricted zone?
             │    ├── No → Continue
             │    └── Yes → BREACH event (critical severity)
             │              → Notify admin + owner
             │              → Consider remote immobilization
             │              → Log trust score event (-50 pts)
             │
             ├── At Return zone (check-out window)?
             │    ├── Within 500m of return location → Ready for checkout
             │    └── Not nearby → Reminder to return
             │
             └── Speed Zone check
                  ├── Speed ≤ zone limit → OK
                  └── Speed > zone limit → Speeding event (medium severity)
```

### 4.3 Geofence Polygon Format

```json
{
  "vehicle_id": "veh_xyz789",
  "zones": [
    {
      "type": "operating",
      "name": "Cape Town Metro",
      "polygon": [
        [-33.9900, 18.3500],
        [-33.9800, 18.5000],
        [-33.9100, 18.6300],
        [-33.8700, 18.4400],
        [-33.9200, 18.3300],
        [-33.9900, 18.3500]
      ]
    },
    {
      "type": "restricted",
      "name": "Cape Town International Airport (long-term)",
      "polygon": [
        [-33.9750, 18.5950],
        [-33.9650, 18.6050],
        [-33.9700, 18.6100],
        [-33.9800, 18.6000],
        [-33.9750, 18.5950]
      ]
    }
  ]
}
```

Point-in-polygon check uses the **ray-casting algorithm** (adapted from PostgreSQL's PostGIS or implemented in-memory via Redis geospatial for high throughput).

---

## 5. Trust Score Integration (Driving Behavior)

### 5.1 Trip Score Calculation

After each trip segment ends, the Telemetry Service calculates a **Driving Score** (0-100) that feeds directly into the Trust Scoring Engine's Telematics component (30% weight).

```typescript
function calculateTripScore(trip: TripSegment, events: DetectedEvent[]): number {
    // Base score starts at 100, deduct per event
    let score = 100;
    
    const harshBrakeCount = events.filter(e => e.type === 'harsh_brake').length;
    const harshAccelCount = events.filter(e => e.type === 'harsh_acceleration').length;
    const sharpTurnCount = events.filter(e => e.type === 'sharp_turn').length;
    const speedingCount = events.filter(e => e.type === 'speeding').length;
    const breachCount = events.filter(e => e.type === 'geofence_breach').length;
    
    // Per 100km normalization
    const distance100km = trip.distance_km / 100;
    const eventsPer100km = (harshBrakeCount + harshAccelCount + sharpTurnCount) / Math.max(distance100km, 0.1);
    
    // Deductions
    if (eventsPer100km > 0)         score -= eventsPer100km * 10;   // Harsh events
    if (speedingCount > 0)           score -= speedingCount * 5;    // Speeding
    if (breachCount > 0)             score -= breachCount * 15;    // Geofence breaches
    if (trip.night_driving_pct > 60) score -= (trip.night_driving_pct - 60) * 0.2;  // Night driving
    
    // Collision = automatic 0
    if (events.some(e => e.type === 'collision')) score = 0;
    
    return Math.max(0, Math.min(100, score));
}

// Emit to Trust Service
function onTripEnded(trip: TripSegment) {
    const score = calculateTripScore(trip, trip.events);
    
    // Persist trip score
    await db.tripSegment.update({
        where: { id: trip.id },
        data: { score }
    });
    
    // Create trust score event
    await trustService.emitEvent({
        userId: trip.renterId,      // derived from booking
        eventType: 'trip_completed',
        scoreDelta: Math.round((score - 50) * 0.3),  // 0-100 → ±15 pts
        referenceId: trip.bookingId,
        metadata: { tripId: trip.id, score, distance: trip.distance_km }
    });
}
```

### 5.2 Score Event Triggers

| Telemetry Event | Trust Score Impact | Type |
|----------------|-------------------|------|
| Trip completed (clean, score >80) | +3 to +15 pts | Positive |
| Trip completed (score 50-80) | +0 to +2 pts | Neutral |
| Trip completed (poor, score <50) | -5 to -15 pts | Negative |
| Collision detected | -200 pts (pending investigation) | Negative |
| Geofence breach (operating zone) | -30 pts per incident | Negative |
| Geofence breach (restricted zone) | -50 pts per incident | Negative |
| Speeding violation | -15 pts per incident | Negative |
| Fuel theft detected | -100 pts (pending claim) | Negative |
| Tamper detected | -75 pts | Negative |
| Harsh events (aggregated per trip) | -2 to -10 pts per trip | Negative |

---

## 6. Data Storage Strategy

### 6.1 Partitioning Scheme

```sql
-- Main telemetry table (partitioned by month)
CREATE TABLE telemetry.telemetry_events (
    id                  UUID NOT NULL,
    device_id           UUID NOT NULL,
    vehicle_id          UUID NOT NULL,
    event_type          telemetry.event_type NOT NULL,
    lat                 DECIMAL(10,7),
    lng                 DECIMAL(10,7),
    speed_kmh           DECIMAL(6,2),
    odometer_km         INT,
    fuel_level_pct      DECIMAL(5,2),
    engine_rpm          INT,
    recorded_at         TIMESTAMPTZ NOT NULL,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- ... other fields
) PARTITION BY RANGE (recorded_at);

-- Monthly partitions
CREATE TABLE telemetry.telemetry_2025_07 PARTITION OF telemetry.telemetry_events
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE telemetry.telemetry_2025_08 PARTITION OF telemetry.telemetry_events
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
```

### 6.2 Data Retention Policy

| Data Granularity | Retention | Table |
|-----------------|-----------|-------|
| Raw events (full resolution) | 90 days | `telemetry.telemetry_events` (monthly partitions) |
| 1-minute aggregates | 12 months | `telemetry.telemetry_1m_agg` |
| 5-minute aggregates | 24 months | `telemetry.telemetry_5m_agg` |
| Trip segments (summarized) | 60 months | `telemetry.trip_segments` |
| Geofence events (alerts) | 12 months | `telemetry.geofence_events` |
| Driving scores (per trip) | 60 months | `telemetry.trip_segments.score` |

### 6.3 Continuous Aggregates (TimescaleDB)

```sql
-- 1-minute aggregates
CREATE MATERIALIZED VIEW telemetry.telemetry_1m_agg
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', recorded_at) AS bucket,
    vehicle_id,
    AVG(speed_kmh) AS avg_speed,
    MAX(speed_kmh) AS max_speed,
    MIN(fuel_level_pct) AS min_fuel,
    MAX(fuel_level_pct) AS max_fuel,
    COUNT(*) AS event_count,
    SUM(CASE WHEN event_type = 'harsh_brake' THEN 1 ELSE 0 END) AS harsh_brakes,
    SUM(CASE WHEN event_type = 'harsh_acceleration' THEN 1 ELSE 0 END) AS harsh_accelerations,
    SUM(CASE WHEN event_type = 'sharp_turn' THEN 1 ELSE 0 END) AS sharp_turns
FROM telemetry.telemetry_events
GROUP BY bucket, vehicle_id;
```

### 6.4 Indexing Strategy

```sql
-- Primary query patterns indexed
CREATE INDEX idx_telemetry_vehicle_time ON telemetry.telemetry_events (vehicle_id, recorded_at DESC);
CREATE INDEX idx_telemetry_event_type ON telemetry.telemetry_events (event_type, recorded_at DESC);
CREATE INDEX idx_telemetry_device_time ON telemetry.telemetry_events (device_id, recorded_at DESC);

-- Trip segments
CREATE INDEX idx_trip_segments_booking ON telemetry.trip_segments (booking_id);
CREATE INDEX idx_trip_segments_vehicle ON telemetry.trip_segments (vehicle_id, start_time DESC);

-- Geofence events
CREATE INDEX idx_geofence_events_vehicle ON telemetry.geofence_events (vehicle_id, created_at DESC);
CREATE INDEX idx_geofence_events_booking ON telemetry.geofence_events (booking_id);
```

---

## 7. WebSocket Real-Time Publishing

### 7.1 Live Tracking Channel

```
ws://api.wthdrive.co.za/ws?token={jwt}

Subscribe: tracking:{booking_id}
    → Receives telemetry events every 10-30s during active trip
    → Renter + Owner both subscribed
    → Rate-limited: 1 msg/5s max

Message format:
{
    "type": "tracking",
    "channel": "tracking:bkg_abc123",
    "data": {
        "lat": -33.9249,
        "lng": 18.4241,
        "speed_kmh": 65,
        "heading_deg": 180,
        "fuel_level_pct": 78.5,
        "odometer": 45230,
        "recorded_at": "2025-07-15T14:30:00Z",
        "accuracy_m": 5
    }
}
```

### 7.2 Alert Channels

```
Subscribe: alerts:{vehicle_id}
    → Real-time alerts for owner
    → Geofence breaches, collision, tamper, speeding (configurable)

Message format:
{
    "type": "alert",
    "channel": "alerts:veh_xyz789",
    "data": {
        "alert_type": "geofence_breach",
        "severity": "high",
        "vehicle_id": "veh_xyz789",
        "lat": -33.9900,
        "lng": 18.5000,
        "message": "Vehicle has left the Cape Town operating zone",
        "timestamp": "2025-07-15T14:35:00Z"
    }
}
```

---

## 8. Error Handling & Resilience

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Device goes offline | No telemetry for 5 min | Flag "device offline", notify owner via push |
| GPS signal lost | accuracy_m > 100m | Use last known location, mark as "approximate" |
| Data corruption | Validation fails schema | Drop corrupted event, log error, continue |
| Redis stream full | Write to stream fails | Fall back to direct PG insert (lower throughput) |
| Consumer lag > 30s | Stream monitoring | Scale consumer group, alert engineering |
| TimescaleDB insert failure | Batch insert errors | Retry queue with exponential backoff, alert |

---

## 9. Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `partition-maintenance` | Monthly (1st) | Create next month's partition, drop expired partitions |
| `aggregate-1m` | Every minute | Update 1-minute continuous aggregate |
| `aggregate-5m` | Every 5 minutes | Update 5-minute continuous aggregate |
| `offline-device-check` | Every 5 minutes | Flag vehicles with no telemetry >5min during active booking |
| `trip-timeout` | Every 15 minutes | End trips with no telemetry >2h (assume parked) |
| `data-retention-cleanup` | Daily | Drop raw data partitions older than 90 days |
| `device-health-report` | Daily | Low battery devices, weak signal, firmware versions |

---

## 10. API Specifications

### 10.1 External Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/telemetry/events` | Ingest telemetry event (from device/SDK) |
| POST | `/telemetry/batch` | Ingest batch of events (offline sync) |
| GET | `/telemetry/vehicles/{id}/last` | Get last known position |
| GET | `/telemetry/vehicles/{id}/trip/current` | Get current active trip data |
| GET | `/telemetry/vehicles/{id}/trip/history` | Get trip history (paginated) |
| GET | `/telemetry/vehicles/{id}/events` | Get recent events/alerts |
| GET | `/telemetry/trips/{id}` | Get trip detail with scoring breakdown |
| GET | `/telemetry/devices/{id}/status` | Get device health (battery, signal) |

### 10.2 Internal Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/internal/telemetry/trip/start` | Start trip tracking (called by Booking) |
| POST | `/internal/telemetry/trip/end` | End trip, return summary |
| GET | `/internal/telemetry/trip/{id}` | Get trip raw data for dispute |
| GET | `/internal/telemetry/vehicle/{id}/last` | Last known position (for other services) |
| GET | `/internal/telemetry/driving-score/{userId}` | Aggregate driving score for trust recalculation |
| POST | `/internal/telemetry/geofence/check` | Check if point is within vehicle's geofence |

### 10.3 Device SDK API

```typescript
// POST /telemetry/events — Authentication: device API key
interface TelemetryIngestRequest {
    deviceId: string;
    vehicleId?: string;           // derived from device registration
    events: TelemetryEvent[];
}

interface TelemetryEvent {
    eventType: 'gps_location' | 'ignition_on' | 'ignition_off' | 'engine_start' | 'engine_stop'
              | 'harsh_brake' | 'harsh_acceleration' | 'sharp_turn' | 'collision'
              | 'door_open' | 'door_closed' | 'lock' | 'unlock' | 'tamper_detected'
              | 'fuel_drop' | 'battery_low' | 'dtc_code' | 'maintenance_alert'
              | 'geofence_enter' | 'geofence_exit';
    lat?: number;
    lng?: number;
    speedKmh?: number;
    headingDeg?: number;
    odometerKm?: number;
    fuelLevelPct?: number;
    recordedAt: string;            // ISO 8601
    metadata?: Record<string, any>;
}
```

---

## 11. Trust Score Event Integration Summary

```
Trip End → Telemetry calculates DrivingScore (0-100)
    → Emits to Trust Service: POST /internal/trust/event
    → Trust Service:
        telematicsScore becomes (DrivingScore × 0.30 of overall)
        If score > 80: +positive delta to overall
        If score < 50: -negative delta
        If collision: -200 pending investigation

Geofence Breach → Telemetry alerts
    → Emits to Trust Service: POST /internal/trust/event
    → Trust Service: -30 pts (operating) / -50 pts (restricted)

Speeding → Telemetry detects
    → Emits to Trust Service: POST /internal/trust/event
    → Trust Service: -15 pts per incident
```

---

*This document should be read alongside: Database Schema (`/home/team/shared/database/schema.sql` — telemetry.* tables), Booking Service Architecture (`/home/team/shared/architecture/booking-service-architecture.md`), Trust Engine Logic (`/home/team/shared/architecture/trust-engine-logic.md`), Core Rental PRD (`/home/team/shared/prds/PRD-01-core-rental.md`), P2P PRD (`/home/team/shared/prds/PRD-04-p2p-sharing.md`)*