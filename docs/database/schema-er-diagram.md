# WTH Drive Rentals — Entity-Relationship Diagram & Schema Documentation

## Core Entities & Relationships

### 1. Identity & Access (iam)

```
users (1) ────── (N) kyc_verifications
users (1) ────── (1) biometric_credentials (per type)
users (1) ────── (N) user_addresses
users (1) ────── (N) user_payment_methods
users (1) ────referral── (N) users (self-referencing via referred_by)
```

### 2. Vehicle Fleet (fleet)

```
vehicle_makes (1) ── (N) vehicle_models (1) ── (N) vehicles (1) ── (1) vehicle_device
vehicles (1) ── (N) vehicle_availability
vehicles (1) ── (N) vehicle_documents
users/owner (1) ── (N) vehicles
```

### 3. Bookings (booking) — Central Domain

```
users/renter (1) ── (N) bookings (N) ── (1) vehicles/owner
bookings (1) ── (1) booking_insurance
bookings (1) ── (1) check_in_events
bookings (1) ── (1) check_out_events
bookings (1) ── (N) booking_extensions
```

**Exclusion Constraint:** Prevents double-booking at DB level using GiST index over timestamp ranges:
```sql
EXCLUDE USING gist (vehicle_id WITH =, tstzrange(start_time, end_time) WITH &&)
```

### 4. Trust System (trust) — Core IP

```
users (1) ── (1) trust_scores
users (1) ── (N) trust_score_events
bookings (1) ── (1) deposits
deposits (N) ── (1) waiver_approvals
bookings (1) ── (N) claims
```

### 5. Financial Ledger (ledger)

```
users (1) ── (1) wallets
wallets (1) ── (N) transactions
transactions (1) ── (N) ledger_entries (double-entry)
transactions (N) ── (1) invoices
bookings (1) ── (N) commissions
```

### 6. Subscriptions & VaaS (subs)

```
subscription_plans (1) ── (N) subscriptions (N) ── (1) users
subscriptions (1) ── (N) billing_cycles
vehicles (0..1) ── (0..1) subscriptions
```

### 7. Telematics (telemetry)

```
vehicle_device (1) ── (N) telemetry_events (N) ── (1) vehicles - Partitioned by month
vehicle_device (1) ── (N) trip_segments
booking (0..1) ── (N) trip_segments
vehicles (1) ── (N) geofence_events
```

### 8. Domain Events (events) — Async Backbone

```
domain_events: aggregate_type + aggregate_id + event_type + event_data
```
All domain aggregates publish events here. CDC pipeline (Debezium) forwards to message broker.

## Full ER Diagram

```
┌────────────────────────────────────────────────────────────┐
│                        iam.users                           │
│  ↑                         ↑                               │
│  │ [owner_id]              │ [renter_id]                   │
│  ┌──────────┐              │  ┌──────────────────┐        │
│  │ vehicles ├──[vehicle_id]┼──┤    bookings       │        │
│  └──────────┘              │  └────────┬─────────┘        │
│       ↑                    │           │                   │
│       │ [device_id]        │           │ [booking_id]      │
│  ┌──────────────┐         │   ┌──────────────────┐        │
│  │vehicle_device│         │   │ check_in/out     │        │
│  └──────┬───────┘         │   ├──────────────────┤        │
│         │                 │   │ deposits/claims  │        │
│         │ [device_id]     │   ├──────────────────┤        │
│  ┌──────────────┐         │   │booking_insurance │        │
│  │telemetry_events│       │   └──────────────────┘        │
│  └──────────────┘         ↓                               │
│                    ┌──────────────┐                       │
│                    │ trust_scores │                       │
│                    └──────────────┘                       │
└───────────────────────────────────────────────────────────┘
```