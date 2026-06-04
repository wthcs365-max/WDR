# WTH Drive Rentals — Booking Service Architecture

**Version:** 1.0  
**Owner:** Architect  
**Status:** Draft for Review  
**Last Updated:** 2025-07-15  

---

## 1. Service Overview

The Booking Service is the central orchestrator of the WDR rental marketplace. It manages the complete lifecycle of a rental booking — from initial quote through booking confirmation, active trip, check-in/out, and final settlement. It integrates with the **Trust Service** (deposit waivers), **Ledger Service** (payments, holds, payouts), **Telemetry Service** (GPS tracking), and **Notification Service** (alerts).

### 1.1 Service Boundary

```
┌──────────────────────────────────────────────────────────────────────┐
│                          BOOKING SERVICE                              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Quote Engine  │  │ Reservation  │  │ Check-in/out Orchestrator│   │
│  │ ────────────  │  │ Manager     │  │ ─────────────────────── │   │
│  │ • Price calc  │  │ ───────────  │  │ • Selfie verification    │   │
│  │ • Fee calc    │  │ • Vehicle    │  │ • Odometer capture       │   │
│  │ • Trust adj.  │  │   hold      │  │ • Fuel level check       │   │
│  │ • Avail check │  │ • Owner notif│  │ • Damage photo evidence  │   │
│  │ • Promo apply │  │ • Confirm    │  │ • Key handover flow      │   │
│  └──────────────┘  │ • Cancel     │  └──────────────────────────┘   │
│                    └──────────────┘                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Extension    │  │ Dispute      │  │ Insurance Integration    │   │
│  │ Manager      │  │ Manager     │  │ ─────────────────────── │   │
│  │ ──────────── │  │ ───────────  │  │ • Trip-based policy      │   │
│  │ • Avail check│  │ • Claim ref  │  │ • Policy issuance        │   │
│  │ • Fee calc   │  │ • Telemetry  │  │ • Claims evidence        │   │
│  │ • Approval   │  │   evidence   │  │ • Partner API            │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘

Inter-Service Dependencies:
  → Trust Service:    GET /internal/trust/score/{userId}  (waiver eligibility)
  → Trust Service:    POST /internal/trust/event          (score events)
  → Ledger Service:   POST /internal/ledger/transactions  (payment capture)
  → Ledger Service:   POST /internal/ledger/commissions   (payout calc)
  → Vehicle Service:  GET /vehicles/{id}/availability     (conflict check)
  → Telemetry Service: POST /internal/telemetry/trip      (start/end trip)
  → Notification:     PUB event.{type}                    (user alerts)
```

---

## 2. Booking State Machine

### 2.1 Complete State Diagram

```
                    ┌─────────┐
                    │ QUOTE   │  (No commitment, price estimate)
                    └────┬────┘
                         │ User submits booking
                         ▼
              ┌──────────────────────┐
         ┌───│ PENDING_CONFIRMATION  │───┐
         │   │ (Payment held, owner  │   │ Owner rejects
         │   │  notified to accept)  │   │ (timeout)
         │   └──────────┬───────────┘   │
         │              │ Owner accepts │
         │              ▼               │
         │   ┌──────────────────────┐   │
         │   │      CONFIRMED       │   │
         │   │ (Booking locked,     │   │
         │   │  insurance issued,   │   │
         │   │  deposit held)       │   │
         │   └──────────┬───────────┘   │
         │              │ Check-in      │
         │              ▼               │
         │   ┌──────────────────────┐   │
         │   │       ACTIVE         │   │
         │   │ (Trip in progress,   │   │
         │   │  telemetry active,   │   │
         │   │  GPS tracking on)    │   │
         │   └──────────┬───────────┘   │
         │         ┌────┴────┐         │
         │         │         │         │
         │         ▼         ▼         │
         │   ┌────────┐ ┌──────────┐   │
         │   │EXTENDED│ │COMPLETED │   │
         │   │(New    │ │(Check-out│   │
         │   │ end    │ │ done,    │   │
         │   │ time)  │ │payments  │   │
         │   └────────┘ │ settled) │   │
         │              └────┬─────┘   │
         │                   │         │
         │              ┌────┴─────┐   │
         │              │ DISPUTED │   │
         │              │ (Claim   │   │
         │              │  filed)  │   │
         │              └──────────┘   │
         │                             │
         └── CANCELLED ◄───────────────┘
             (Refund processed
              based on policy)
```

### 2.2 State Transitions & Business Rules

| From | To | Trigger | Validations | Actions |
|------|-----|---------|-------------|---------|
| QUOTE | PENDING_CONFIRMATION | User submits booking | Vehicle available? Renter trust ≥ min? Payment method valid? | Hold vehicle (10min TTL), initiate payment auth, notify owner |
| PENDING_CONFIRMATION | CONFIRMED | Owner accepts OR instant-book | Payment captured? Owner responded within 1h? | Lock booking, hold deposit, issue insurance policy, confirm to both parties |
| PENDING_CONFIRMATION | CANCELLED | Owner rejects OR auto-timeout | Timeout after 1h for manual mode | Release vehicle hold, void payment auth, notify renter |
| CONFIRMED | ACTIVE | Check-in completed | Selfie matched? Odometer captured? Damage photos taken? | Start telemetry tracking, update vehicle status to 'booked' |
| CONFIRMED | CANCELLED | Renter cancels (pre-check-in) | Check cancellation policy tier | Calculate refund %, process cancellation fee |
| ACTIVE | EXTENDED | Extension approved | Vehicle available for new end time? Same-day extension? | Additional payment hold, update insurance coverage |
| ACTIVE | COMPLETED | Check-out completed | Damage flagged? Odometer/fuel captured? | Calculate final total, process payout, release deposit, update trust score |
| ACTIVE | CANCELLED | Emergency cancellation (admin) | Admin override only | Penalty fees, insurance claim if needed |
| COMPLETED | DISPUTED | Owner files claim OR damage detected | Within 48h of checkout | Hold payout, gather telemetry evidence, notify both parties |
| EXTENDED | COMPLETED | Check-out at new end time | Same as ACTIVE → COMPLETED | Same settlement flow |

### 2.3 Cancellation Policy (Tiered)

| Timing | Refund % | Fee | Notes |
|--------|---------|-----|-------|
| >48h before start | 100% refund | R0 | Free cancellation |
| 24-48h before start | 75% refund | 25% of total | Standard fee |
| 12-24h before start | 50% refund | 50% of total | Late notice |
| <12h before start | 25% refund | 75% of total | Penalty tier |
| No-show (no check-in) | 0% refund | 100% of total | Plus late return fee |

**Waiver exceptions:** Diamond & Platinum tiers get one free late-cancel per quarter.

---

## 3. Booking Lifecycle — Detailed Flows

### 3.1 Quote Flow

```
Renter                Booking Service          Vehicle Service        Trust Service
  │                         │                       │                     │
  │  GET /quote            │                       │                     │
  │  {dates, vehicleId}    │                       │                     │
  │────────────────────────>│                       │                     │
  │                         │ Check Availability   │                     │
  │                         │──────────────────────│                     │
  │                         │  Available: true     │                     │
  │                         │<─────────────────────│                     │
  │                         │                       │                     │
  │                         │ Calculate Base Price │                     │
  │                         │ (rate × days)        │                     │
  │                         │                       │                     │
  │                         │ Check Trust Score    │                     │
  │                         │───────────────────────────────────────────│
  │                         │  Tier: Gold          │                     │
  │                         │  Waiver Eligible:    │                     │
  │                         │  R15k at 20% fee     │                     │
  │                         │<───────────────────────────────────────────│
  │                         │                       │                     │
  │                         │ Calculate All Fees:  │                     │
  │                         │  Subtotal: R2,400    │                     │
  │                         │  Insurance: R240     │                     │
  │                         │  WDR Shield: R0      │                     │
  │                         │  (waiver selected)   │                     │
  │                         │  Booking Fee: R120   │                     │
  │                         │  Total: R2,760       │                     │
  │                         │                       │                     │
  │  Quote Response         │                       │                     │
  │<────────────────────────│                       │                     │
```

### 3.2 Booking Creation (PENDING_CONFIRMATION → CONFIRMED)

```
Renter            Booking Service         Vehicle Svc    Trust Svc    Ledger Svc    Owner
  │                     │                     │             │            │            │
  │ POST /bookings      │                     │             │            │            │
  │ {vehicleId, dates}  │                     │             │            │            │
  │────────────────────>│                     │             │            │            │
  │                     │ Lock Vehicle (10min)│             │            │            │
  │                     │────────────────────>│             │            │            │
  │                     │  Vehicle Locked ✓   │             │            │            │
  │                     │<────────────────────│             │            │            │
  │                     │                     │             │            │            │
  │                     │ Calculate Quote     │             │            │            │
  │                     │ (reuse quote logic) │             │            │            │
  │                     │                     │             │            │            │
  │                     │ Check Trust Score   │             │            │            │
  │                     │─────────────────────────────────>│            │            │
  │                     │  Tier: Gold, Waiver: R15k        │            │            │
  │                     │<─────────────────────────────────│            │            │
  │                     │                     │             │            │            │
  │                     │ Initiate Payment    │             │            │            │
  │                     │────────────────────────────────────────────>│            │
  │                     │  Auth: R2,760       │             │            │            │
  │                     │  Hold: R0 (waived)  │             │            │            │
  │                     │<────────────────────────────────────────────│            │
  │                     │                     │             │            │            │
  │                     │ Determine Flow:     │             │            │            │
  │                     │  Owner mode =       │             │            │            │
  │                     │  instant-book       │             │            │            │
  │                     │ → Auto-Approve      │             │            │            │
  │                     │                     │             │            │            │
  │                     │ Issue Insurance     │             │            │            │
  │                     │ (trip-based policy) │             │            │            │
  │                     │                     │             │            │            │
  │                     │ Lock Booking (GiST) │             │            │            │
  │                     │ INSERT booking      │             │            │            │
  │                     │ status=confirmed    │             │            │            │
  │                     │                     │             │            │            │
  │                     │ Notify Owner        │             │            │            │
  │                     │─────────────────────────────────────────────────────────>│
  │                     │                     │             │            │            │
  │                     │ Publish Event       │             │            │            │
  │                     │ booking.confirmed   │             │            │            │
  │                     │                     │             │            │            │
  │  Booking Confirmed  │                     │             │            │            │
  │<────────────────────│                     │             │            │            │
```

### 3.3 Check-in Flow (CONFIRMED → ACTIVE)

```
Renter (App)         Booking Service       Trust Svc       Vehicle Svc    Telemetry Svc
  │                        │                  │               │               │
  │ POST /bookings/{id}/checkin               │               │               │
  │───────────────────────>│                  │               │               │
  │                        │                  │               │               │
  │ Step 1: Selfie Capture │                  │               │               │
  │<─────── Request ──────│                  │               │               │
  │──── selfie + liveness ───────────────────>│               │               │
  │                        │  Verify Biometric │               │               │
  │                        │──────────────────>│               │               │
  │                        │  Match >90% ✓    │               │               │
  │                        │<──────────────────│               │               │
  │                        │                  │               │               │
  │ Step 2: Odometer + Fuel                   │               │               │
  │<─────── Request ──────│                  │               │               │
  │──── odometer: 45230 ─────────────────────│               │               │
  │──── fuel: 85% ──────────────────────────│               │               │
  │                        │                  │               │               │
  │ Step 3: Damage Photos  │                  │               │               │
  │<─────── Request ──────│                  │               │               │
  │──── photos[] ────────────────────────────│               │               │
  │                        │                  │               │               │
  │ Step 4: Device Pairing │                  │               │               │
  │<─────── Pair request ──│                 │               │               │
  │──── BLE paired ───────────────────────────────────────────────────────>│
  │                        │                  │               │               │
  │                        │ INSERT check_in_event           │               │
  │                        │ status→active    │               │               │
  │                        │                  │               │               │
  │                        │ Update Vehicle   │               │               │
  │                        │─────────────────────────────────>│               │
  │                        │  status=booked   │               │               │
  │                        │                  │               │               │
  │                        │ Start Telemetry  │               │               │
  │                        │──────────────────────────────────────────────>│
  │                        │  Trip started    │               │               │
  │                        │                  │               │               │
  │                        │ Publish Event    │               │               │
  │                        │ booking.active   │               │               │
  │                        │                  │               │               │
  │ Check-in Complete ✓    │                  │               │               │
  │<───────────────────────│                  │               │               │
```

### 3.4 Check-out Flow (ACTIVE → COMPLETED)

```
Renter (App)         Booking Service       Telemetry Svc    Ledger Svc     Owner
  │                        │                  │               │               │
  │ POST /bookings/{id}/checkout              │               │               │
  │───────────────────────>│                  │               │               │
  │                        │                  │               │               │
  │ Step 1: Odometer + Fuel                   │               │               │
  │<─────── Request ──────│                  │               │               │
  │──── odometer: 45620 ─────────────────────│               │               │
  │──── fuel: 60% ──────────────────────────│               │               │
  │                        │                  │               │               │
  │ Step 2: Damage Photos  │                  │               │               │
  │<─────── Request ──────│                  │               │               │
  │──── photos[] ────────────────────────────│               │               │
  │──── is_damaged: false ───────────────────│               │               │
  │                        │                  │               │               │
  │                        │ Stop Telemetry   │               │               │
  │                        │────────────────────────────────>│               │
  │                        │  Trip ended      │               │               │
  │                        │  Get trip summary│               │               │
  │                        │<────────────────────────────────│               │
  │                        │  distance: 390km │               │               │
  │                        │  events: 2 harsh │               │               │
  │                        │                  │               │               │
  │                        │ Calculate Final   │               │               │
  │                        │ Total:           │               │               │
  │                        │  Base: R2,400    │               │               │
  │                        │  Extra km: R0    │               │               │
  │                        │  Late fee: R0    │               │               │
  │                        │  Damage fee: R0  │               │               │
  │                        │  Actual: R2,400  │               │               │
  │                        │                  │               │               │
  │                        │ Process Settlement               │               │
  │                        │────────────────────────────────>│               │
  │                        │  Release deposit  │               │               │
  │                        │  Calculate payout │               │               │
  │                        │  Schedule payout  │               │               │
  │                        │  (+48h to owner)  │               │               │
  │                        │<────────────────────────────────│               │
  │                        │                  │               │               │
  │                        │ Update Trust Score              │               │
  │                        │ (trip completed, no damage)     │               │
  │                        │                  │               │               │
  │                        │ INSERT check_out_event          │               │
  │                        │ status→completed  │               │               │
  │                        │                  │               │               │
  │                        │ Update Vehicle   │               │               │
  │                        │ status→available │               │               │
  │                        │                  │               │               │
  │                        │ Publish Events   │               │               │
  │                        │ booking.completed│               │               │
  │                        │ trust.score_     │               │               │
  │                        │   updated        │               │               │
  │                        │                  │               │               │
  │                        │ Notify Owner     │               │               │
  │                        │──────────────────────────────────────────────>│
  │                        │  Payout scheduled│               │               │
  │                        │                  │               │               │
  │ Check-out Complete ✓   │                  │               │               │
  │<───────────────────────│                  │               │               │
```

### 3.5 Extension Flow

```
Renter                  Booking Service          Vehicle Service
  │                            │                      │
  │ POST /bookings/{id}/extend│                      │
  │ {newEndTime}              │                      │
  │──────────────────────────>│                      │
  │                            │ Check Availability  │
  │                            │ (new time slot)     │
  │                            │─────────────────────│
  │                            │  Available ✓        │
  │                            │<────────────────────│
  │                            │                      │
  │                            │ Calculate Fee:      │
  │                            │  R800 additional    │
  │                            │  (2 extra days)     │
  │                            │                      │
  │                            │ Hold Payment        │
  │                            │ (via Ledger Svc)    │
  │                            │                      │
  │                            │ Update Booking      │
  │                            │ INSERT extension ↓ │
  │                            │ Update end_time     │
  │                            │                      │
  │                            │ Update Insurance    │
  │                            │ (extend coverage)   │
  │                            │                      │
  │  Extension Confirmed ✓    │                      │
  │<──────────────────────────│                      │
```

---

## 4. Vehicle Availability & Overlap Prevention

### 4.1 Database-Level Enforcement (GiST Exclusion)

The primary mechanism to prevent double-booking is a PostgreSQL exclusion constraint:

```sql
CONSTRAINT booking_no_overlap EXCLUDE USING gist (
    vehicle_id WITH =,
    tstzrange(start_time, end_time) WITH &&
)
```

This ensures no two bookings can exist for the same vehicle with overlapping time ranges. The `btree_gist` extension enables GiST indexes on scalar types combined with range types.

### 4.2 Application-Level Reservation

Before the exclusive constraint runs, the application uses a **temporary reservation** system:

```typescript
async function reserveVehicle(vehicleId: string, startTime: Date, endTime: Date, ttlMinutes = 10) {
    const lockKey = `wdr:lock:booking:${vehicleId}:${startTime.toISOString()}`;
    
    // 1. Check if lock exists
    const existingLock = await redis.exists(lockKey);
    if (existingLock) return { available: false, reason: 'IN_LOCK' };
    
    // 2. Check database for conflicts
    const conflictingRows = await prisma.$queryRaw`
        SELECT id FROM booking.bookings
        WHERE vehicle_id = ${vehicleId}
        AND tstzrange(${startTime}, ${endTime}) && tstzrange(start_time, end_time)
        AND status NOT IN ('cancelled', 'completed')
        LIMIT 1
    `;
    if (conflictingRows.length > 0) return { available: false, reason: 'CONFLICT' };
    
    // 3. Check availability calendar
    const datesUnavailable = await prisma.vehicleAvailability.findMany({
        where: { vehicleId, isAvailable: false, date: { gte: startDate, lte: endDate } }
    });
    if (datesUnavailable.length > 0) return { available: false, reason: 'BLOCKED' };
    
    // 4. Acquire lock (prevents race conditions during payment capture)
    await redis.set(lockKey, 'reserved', 'EX', ttlMinutes * 60);
    
    return { available: true, lockKey };
}
```

### 4.3 Availability Check Flow

```
User Requests → Check Availability Calendar → GiST Exclusion Check → Lock & Reserve → Confirm
   Dates        (blocked dates, maintenance)   (active bookings)      (10min TTL)    (INSERT booking)
```

### 4.4 Key Scenarios Handled

| Scenario | Mechanism | Outcome |
|----------|-----------|---------|
| Two users book the same slot simultaneously | Redis distributed lock (first wins) | Second user gets "vehicle no longer available" |
| User abandons during payment | Lock auto-expires after 10min | Vehicle becomes available again |
| Owner blocks dates mid-booking | Availability calendar checked at booking creation | Conflict rejected |
| Extension overlaps another booking | GiST check with new end_time | Extension denied |
| Booking overlaps maintenance slot | Availability calendar rows set to unavailable | Booking blocked |

---

## 5. Trust Service Integration

### 5.1 Deposit Waiver Decision Points

| Booking Stage | Trust Check | Action |
|---------------|------------|--------|
| Quote | GET /internal/trust/score/{userId} | Read cached score; calculate waiver eligibility + fee |
| Booking creation | GET /internal/trust/score/{userId} (fresh) | Confirm eligibility hasn't changed; apply waiver or hold |
| Check-in | GET /internal/trust/score/{userId} (fast check) | Verify renter is same person (biometric) |
| Check-out | POST /internal/trust/event | Emit trip completion event for score recalculation |
| Damage claim | POST /internal/trust/event | Emit negative score event (-50 to -200 pts) |
| Late return | POST /internal/trust/event | Emit negative score event (-20 to -75 pts) |

### 5.2 Waiver Calculation at Quote Time

```typescript
async function calculateDeposit(bookingId: string, userId: string, vehicleId: string) {
    const trustScore = await trustService.getScore(userId);
    const vehicle = await vehicleService.getVehicle(vehicleId);
    const vehicleDeposit = vehicle.depositZar || vehicle.dailyRateZar * 5;  // fallback: 5x daily
    
    if (!trustScore.depositWaiverEligible) {
        // Full deposit required
        return {
            depositRequired: vehicleDeposit,
            waiverAvailable: false,
            waiverFee: 0,
            holdMethod: 'card_hold'
        };
    }
    
    // Calculate waiver
    const maxWaiver = trustScore.maxWaiverAmountZar;
    const waiverAmount = Math.min(maxWaiver, vehicleDeposit);
    const waiverFee = calculateWaiverFee(trustScore.tier, waiverAmount);
    
    return {
        depositRequired: vehicleDeposit - waiverAmount,
        waiverAvailable: true,
        waiverAmount,
        waiverFee,
        holdMethod: waiverAmount >= vehicleDeposit ? 'wdr_shield_waiver' : 'card_hold'
    };
}
```

---

## 6. Ledger Service Integration

### 6.1 Payment Events Triggered by Booking Service

| Booking Event | Ledger Action | Amount | Timing |
|--------------|---------------|--------|--------|
| Booking confirmed | Capture rental payment | Total - deposit | Immediate |
| Booking confirmed | Hold deposit (if not waived) | Deposit amount | Immediate |
| Check-out completed | Release deposit (no damage) | Full deposit | Within 24h |
| Check-out completed | Partial deposit release (minor) | Deposit - claim | Within 24h |
| Check-out completed | Create commission record | Commission | Immediate |
| Check-out completed | Schedule owner payout | Net settlement | +48h |
| Extension approved | Additional payment capture | Extension fee | Immediate |
| Booking cancelled | Refund/partial refund | Per policy | Immediate |
| Late return detected | Capture late fee | Late fee | At check-out |
| Damage claimed | Capture damage fee from deposit | Damage amount | On claim approval |

### 6.2 Fee Calculation Engine

```typescript
function calculateBookingTotal(params: {
    dailyRate: number,
    startDate: Date,
    endDate: Date,
    insuranceTier: string,
    trustTier: string,
    promoCode?: string,
    isDelivery?: boolean,
    extraKmRate?: number,
}): BookingQuote {
    const days = differenceInDays(params.endDate, params.startDate);
    const baseRate = params.dailyRate * days;
    
    // Insurance fee
    const insuranceMultipliers = { basic: 0.05, standard: 0.10, premium: 0.15 };
    const insuranceFee = baseRate * (insuranceMultipliers[params.insuranceTier] || 0.10);
    
    // Booking fee
    const bookingFee = baseRate * 0.05;
    
    // WDR Plus discount
    const plusDiscount = params.trustTier === 'diamond' ? 0.15 :
                         params.trustTier === 'platinum' ? 0.10 :
                         params.trustTier === 'gold' ? 0.05 : 0;
    
    // Delivery fee
    const deliveryFee = params.isDelivery ? 150 : 0;
    
    // Promo code
    const promoDiscount = applyPromoCode(params.promoCode, baseRate);
    
    const subtotal = baseRate + insuranceFee + bookingFee + deliveryFee;
    const discount = baseRate * plusDiscount + promoDiscount;
    const total = Math.max(0, subtotal - discount);
    
    return {
        days, baseRate, insuranceFee, bookingFee,
        deliveryFee, plusDiscount: baseRate * plusDiscount,
        promoDiscount, subtotal, total
    };
}
```

---

## 7. Event-Driven Integration

### 7.1 Published Events

| Event | Payload | Consumers |
|-------|---------|-----------|
| `booking.quote_requested` | `{ userId, vehicleId, dates }` | Analytics |
| `booking.created` | `{ bookingId, renterId, vehicleId, total }` | Notification (owner), Analytics |
| `booking.confirmed` | `{ bookingId, renterId, vehicleId, total }` | Ledger (capture), Insurance (issue policy), Notification, Analytics |
| `booking.active` | `{ bookingId, vehicleId }` | Telemetry (start tracking), Notification, Analytics |
| `booking.extended` | `{ bookingId, newEndTime, additionalFee }` | Ledger (capture), Insurance (extend), Notification |
| `booking.completed` | `{ bookingId, actualTotal, actualKm, damageFlag }` | Ledger (payout), Trust (recalc), Insurance (close), Analytics |
| `booking.cancelled` | `{ bookingId, refundAmount, reason }` | Ledger (refund), Insurance (void), Notification, Analytics |
| `booking.disputed` | `{ bookingId, claimId }` | Trust (score freeze), Ledger (hold payout), Analytics |

### 7.2 Consumed Events

| Event | Source | Action |
|-------|--------|--------|
| `payment.completed` | Ledger | Confirm booking if held state |
| `payment.failed` | Ledger | Notify user, retry payment, cancel if all fail |
| `trust.score_updated` | Trust | No immediate action (affects next booking) |
| `telemetry.geofence_breach` | Telemetry | Alert owner + admin |
| `telemetry.collision_detected` | Telemetry | Initiate emergency flow + claim prep |
| `user.verified` | IAM | Unlock booking if was blocked pending KYC |

---

## 8. Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `auto-cancel-pending` | Every 15min | Cancel bookings >1h in pending_confirmation (owner didn't respond) |
| `release-expired-locks` | Every 5min | Release Redis vehicle locks >10min old |
| `check-in-reminder` | Every hour | Notify renters of upcoming check-in (4h before) |
| `check-out-reminder` | Every 30min | Notify renters of upcoming check-out (1h before) |
| `late-return-detection` | Every 15min | Check active bookings past end_time → apply late fee + notify |
| `auto-release-deposits` | Every 30min | Release deposits for bookings completed >24h with no claim |
| `no-show-detection` | Every 15min | Check bookings >2h past start with no check-in → mark no-show |
| `insurance-sync` | Daily | Sync insurance policies with partner API |

---

## 9. API Specifications

### 9.1 REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/bookings/quote` | Get price quote (no commitment) |
| POST | `/bookings` | Create booking |
| GET | `/bookings/{id}` | Get booking with full detail |
| PATCH | `/bookings/{id}` | Update booking (pre-confirmation) |
| POST | `/bookings/{id}/cancel` | Cancel with reason |
| POST | `/bookings/{id}/extend` | Request extension |
| POST | `/bookings/{id}/checkin` | Digital check-in |
| POST | `/bookings/{id}/checkout` | Digital check-out |
| GET | `/bookings/{id}/timeline` | Get event timeline |
| GET | `/bookings/{id}/insurance` | Get insurance policy details |
| GET | `/renter/bookings` | List renter's bookings (filterable by status) |
| GET | `/owner/bookings` | List bookings on owner's vehicles |
| GET | `/owner/bookings/{id}/approve` | Approve pending booking |
| POST | `/owner/bookings/{id}/reject` | Reject pending booking |
| GET | `/availability/{vehicleId}` | Get availability calendar |

### 9.2 Internal Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/internal/bookings/active/{vehicleId}` | Check if vehicle has active booking |
| POST | `/internal/bookings/reserve` | Reserve vehicle slot (internal lock) |
| POST | `/internal/bookings/release` | Release vehicle reservation |
| GET | `/internal/bookings/{id}` | Raw booking data for other services |

### 9.3 WebSocket Events

| Event | Channel | Trigger |
|-------|---------|---------|
| `booking.updated` | `booking:{bookingId}` | Any status change |
| `booking.checkin_ready` | `renter:{userId}` | 4h before check-in |
| `booking.checkout_overdue` | `renter:{userId}` | Past end time |
| `booking.owner_action_needed` | `owner:{userId}` | New booking to review |

---

## 10. Error Handling & Recovery

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Payment capture fails during booking | Booking stuck in pending_confirmation | Retry 3x with backoff; if all fail → cancel booking |
| Insurance policy issuance fails | Booking confirmed without insurance | Retry 3x; if fail → hold booking status, alert ops |
| GiST exclusion violation | PostgreSQL constraint error | Return "vehicle no longer available", release lock |
| Check-in times out (>15min per step) | No activity on check-in endpoint | Allow partial check-in (basic info saved); continue later |
| Owner doesn't respond (>1h) | Cron job auto-cancel-pending | Cancel, release lock, notify renter |
| Ledger unreachable during check-out | Circuit breaker triggered | Queue settlement for retry; complete check-out locally |
| Telemetry trip not started | Booking active but no telemetry | Start GPS from app SDK as fallback |

---

*This document should be read alongside: Database Schema (`/home/team/shared/database/schema.sql` — booking.* tables), Ledger Architecture (`/home/team/shared/architecture/ledger-subscription-architecture.md`), Trust Engine Logic (`/home/team/shared/architecture/trust-engine-logic.md`), Core Rental PRD (`/home/team/shared/prds/PRD-01-core-rental.md`)*