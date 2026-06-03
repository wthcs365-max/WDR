# WTH Drive Rentals — Ledger & Subscription Service Architecture

**Version:** 1.0  
**Owner:** Architect  
**Status:** Draft for Review  
**Last Updated:** 2025-07-15  
**Related Tasks:** ID `5f47805c-f8af-4175-9681-f54c78687c0c`

---

## 1. Overview

This document details the architecture for two critical financial services in the WDR ecosystem:

### Ledger Service
Manages all monetary flows: digital wallets, transaction processing, double-entry bookkeeping, merchant payouts, commission calculations, invoice generation, and reconciliation. This is the financial backbone of the platform.

### Subscription Service (VaaS)
Manages the complete lifecycle of Vehicle-as-a-Service subscriptions: plan definitions, subscriber management, billing cycles, usage tracking, and trust-based pricing adjustments.

Both services are designed for **modular fintech integration** — allowing future embedding of insurance underwriting, rent-to-own financing, and open banking payment rails without core schema changes.

---

## 2. Ledger Service Architecture

### 2.1 Service Boundary & Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                       LEDGER SERVICE                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Wallet Mgmt  │  │ Payment      │  │ Commission Engine   │  │
│  │ ──────────── │  │ Processing   │  │ ─────────────────── │  │
│  │ • Balances   │  │ ──────────── │  │ • Rate calculation  │  │
│  │ • Holds      │  │ • Capture    │  │ • Tiered splits     │  │
│  │ • Freeze/thaw│  │ • Refund     │  │ • Dealer vs P2P     │  │
│  │ • Statements │  │ • Retry      │  │ • Referral rewards  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Payout Engine │  │ Invoice Gen  │  │ Reconciliation Hub  │  │
│  │ ──────────── │  │ ──────────── │  │ ─────────────────── │  │
│  │ • Owner       │  │ • VAT calc   │  │ • Ledger entries    │  │
│  │   settlements │  │ • PDF gen    │  │ • Batch matching    │  │
│  │ • Bulk batch  │  │ • Credit     │  │ • Dispute tracking  │  │
│  │ • Instant vs  │  │   notes      │  │ • Audit trail       │  │
│  │   scheduled   │  │ • Email send │  │ • Report generation │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Domain Model (from schema.sql)

The Ledger Service owns these database tables:

| Table | Schema | Purpose |
|-------|--------|---------|
| `ledger.wallets` | Per-user wallet with balances, holds, freeze status | Central balance tracking |
| `ledger.transactions` | Immutable transaction log | All monetary movements |
| `ledger.ledger_entries` | Double-entry accounting entries | Auditability & reconciliation |
| `ledger.commissions` | Commission calculations per booking | Revenue tracking |
| `ledger.invoices` | Invoicing records with line items | Tax compliance |

### 2.3 Payment Flow — Sequence Diagram

```
Renter                 Booking Service          Payment Gateway        Ledger Service          Wallet
  │                         │                       │                     │                    │
  │  Create Booking         │                       │                     │                    │
  │────────────────────────>│                       │                     │                    │
  │                         │                       │                     │                    │
  │                         │ Calculate Total       │                     │                    │
  │                         │ (Rate + Insurance     │                     │                    │
  │                         │  + Deposit Waiver)    │                     │                    │
  │                         │                       │                     │                    │
  │                         │ Request Payment       │                     │                    │
  │                         │───────────────────────│                     │                    │
  │                         │                       │                     │                    │
  │                         │ Tokenize + Capture    │                     │                    │
  │                         │───────────────────────│                     │                    │
  │                         │                       │                     │                    │
  │                         │    Auth Response      │                     │                    │
  │                         │<──────────────────────│                     │                    │
  │                         │                       │                     │                    │
  │                         │ Create Transaction    │                     │                    │
  │                         │─────────────────────────────────────────────│                    │
  │                         │                       │                     │  Debit Renter Wallet │
  │                         │                       │                     │──────────────────────│
  │                         │                       │                     │  Credit Platform Escrow│
  │                         │                       │                     │──────────────────────│
  │                         │                       │                     │  Hold Deposit (if any)│
  │                         │                       │                     │──────────────────────│
  │                         │                       │                     │                    │
  │  Trip Completed         │                       │                     │                    │
  │────────────────────────>│                       │                     │                    │
  │                         │ Create Commission     │                     │                    │
  │                         │─────────────────────────────────────────────│                    │
  │                         │                       │                     │  Calculate Payout   │
  │                         │                       │                     │  (Gross - Commission │
  │                         │                       │                     │   - Platform Fee)   │
  │                         │                       │                     │                    │
  │                         │                       │                     │  Release Deposit    │
  │                         │                       │                     │──────────────────────│
  │                         │                       │                     │  Credit Owner Wallet │
  │                         │                       │                     │──────────────────────│
  │                         │                       │                     │  Generate Invoice   │
  │                         │                       │                     │──────────────────────│
  │                         │                       │                     │                    │
  │  Booking Complete        │                       │                     │                    │
  │<────────────────────────│                       │                     │                    │
```

### 2.4 Payout Strategy

#### 2.4.1 Payout Schedule

| Type | Timing | Method | Notes |
|------|--------|--------|-------|
| **P2P Owner** | 48h post trip completion | EFT to bank or wallet transfer | Net of WDR commission (20-25%) |
| **Dealer** | Weekly settlement (Monday) | Batch EFT with statement | Net of reduced commission (12-15%) |
| **VaaS Payouts** | Monthly (after billing cycle) | Net settlement | Dedicated vehicle owner |
| **Referral Bonuses** | Within 72h of referral trip completion | Wallet credit | ZAR 500/referral |
| **Deposit Claims** | Within 24h of claim approval | EFT to claimant | From deposit or insurance |

#### 2.4.2 Commission Structure

| Segment | Commission | Platform Fee | Owner Net |
|---------|-----------|--------------|-----------|
| P2P Standard | 20% | +2.5% processing | 77.5% |
| P2P Diamond Owner | 15% | +2.5% processing | 82.5% |
| Dealer Standard | 12% | +2.5% processing | 85.5% |
| Dealer Volume (10+ cars) | 10% | +2.5% processing | 87.5% |
| VaaS Flex | 18% | Included in subscription | Varies |
| WDR Shield Fee | 100% to WDR | N/A | Risk product |

#### 2.4.3 Payout Engine Pseudocode

```
function processPayout(bookingId):
    booking = getBooking(bookingId)
    vehicle = getVehicle(booking.vehicleId)
    grossAmount = booking.actualTotal
    
    // Determine commission rate
    if vehicle.ownershipType == PRIVATE_OWNER:
        if owner.trustTier == DIAMOND:
            rate = 0.15
        else:
            rate = 0.20
    elif vehicle.ownershipType == DEALER:
        dealerVehicles = countDealerVehicles(vehicle.ownerId)
        rate = dealerVehicles >= 10 ? 0.10 : 0.12
    
    processingFee = grossAmount * 0.025
    commissionAmount = grossAmount * rate
    ownerPayout = grossAmount - commissionAmount - processingFee
    
    // Deduct WDR Shield fee if waiver used
    if booking.wdrShieldFeeZar > 0:
        ownerPayout -= booking.wdrShieldFeeZar
    
    // Create commission record (double-entry)
    createDebit(PLATFORM_REVENUE_ACCOUNT, commissionAmount)
    createCredit(OWNER_PAYABLE_ACCOUNT, ownerPayout)
    createCredit(PROCESSING_FEE_ACCOUNT, processingFee)
    
    // Schedule payout
    schedulePayout(vehicle.ownerId, ownerPayout, '+48h')
    
    return { grossAmount, commissionAmount, processingFee, ownerPayout }
```

### 2.5 Double-Entry Accounting Model

Every financial event generates balanced ledger entries:

| Event | Debit Account | Credit Account | Description |
|-------|--------------|----------------|-------------|
| Booking payment | Renter's wallet | Platform escrow | Rental amount collected |
| Deposit hold | Renter's wallet | Deposit hold account | Security deposit |
| Commission earned | Platform escrow | Platform revenue | WDR margin |
| Owner payout | Owner payable | Owner's wallet | Net settlement |
| Deposit release | Deposit hold | Renter's wallet | Full refund |
| Deposit claim | Deposit hold | Claimant wallet | Damage payout |
| WDR Shield fee | Renter's wallet | Platform revenue | Waiver premium |
| Refund | Platform escrow | Renter's wallet | Cancellation refund |
| Late fee | Renter's wallet | Platform revenue | Penalty income |
| Referral bonus | Marketing expense | Referrer wallet | Acquisition cost |

### 2.6 Reconciliation Process

```
Daily Reconciliation Job:
    1. Sum all today's transactions by account
    2. Compare against payment gateway settlement report
    3. Flag discrepancies for manual review
    4. Generate reconciliation report

Thresholds:
    - Auto-resolve: discrepancy < ZAR 100
    - Flag for review: discrepancy ZAR 100-1000
    - Escalate: discrepancy > ZAR 1000
```

### 2.7 Error Handling & Retry Logic

| Failure | Retry | Fallback |
|---------|-------|----------|
| Payment gateway timeout | 3 retries, exponential backoff | Fail booking; notify user |
| Wallet balance insufficient | N/A | Use payment method on file |
| Payout EFT fails | 2 retries, 24h apart | Credit wallet; manual payout |
| Invoice generation fails | 3 retries, 5min apart | Queue; manual generation |
| Gateway webhook lost | Idempotency key dedup | Webhook polling every 15min |

---

## 3. Subscription Service (VaaS) Architecture

### 3.1 Service Boundary & Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION SERVICE                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Plan Manager  │  │ Subscriber   │  │ Billing Engine      │  │
│  │ ──────────── │  │ Lifecycle    │  │ ─────────────────── │  │
│  │ • Define      │  │ ──────────── │  │ • Cycle creation    │  │
│  │ • Pricing    │  │ • Subscribe  │  │ • Invoice generation │  │
│  │ • Features   │  │ • Pause/Res  │  │ • Payment capture    │  │
│  │ • Vehicle    │  │ • Upgrade    │  │ • Dunning (retry)    │  │
│  │   eligibility│  │ • Cancel     │  │ • Proration         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Usage Tracker │  │ Trust Pricing│  │ Fleet Allocator     │  │
│  │ ──────────── │  │ ──────────── │  │ ─────────────────── │  │
│  │ • KM counter  │  │ • Score-based│  │ • Vehicle pool mgmt │  │
│  │ • Days used  │  │   adjustment │  │ • Dedicated assign. │  │
│  │ • Excess calc│  │ • Loading %  │  │ • Swap handling     │  │
│  │ • Overage    │  │ • Discount   │  │ • Maintenance track │  │
│  │   billing    │  │   eligibility│  │ • Availability sync │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 VaaS Plan Definitions

| Plan Type | Monthly Price | Included KM | Included Days | Excess KM Rate | Vehicle Access | Min Trust Tier |
|-----------|--------------|-------------|---------------|----------------|----------------|----------------|
| **VaaS Flex** | R2,500-R5,000 | 1,000 km | Unlimited | R2.50/km | Pool (switch anytime) | Silver (Gold preferred) |
| **VaaS Plus** | R5,000-R15,000 | 2,000 km | Unlimited | R2.00/km | Dedicated vehicle | Gold |
| **VaaS Business** | R4,000-R12,000/vehicle | 1,500 km/vehicle | Unlimited | R2.50/km (pooled) | Fleet allocation (1-50) | Company underwriting |
| **WDR Plus** | R99-R199/mo | N/A (membership) | N/A | N/A | Perks & discounts | Any |

### 3.3 Subscription Lifecycle — Sequence Diagram

```
User                    Subscription Service       Trust Service       Ledger Service        Vehicle Pool
  │                            │                       │                    │                    │
  │  Browse Plans             │                       │                    │                    │
  │──────────────────────────>│                       │                    │                    │
  │                            │                       │                    │                    │
  │  Select Plan + Subscribe  │                       │                    │                    │
  │──────────────────────────>│                       │                    │                    │
  │                            │ Check Trust Score    │                    │                    │
  │                            │──────────────────────│                    │                    │
  │                            │  Tier: Diamond (-15%)│                    │                    │
  │                            │<─────────────────────│                    │                    │
  │                            │                       │                    │                    │
  │                            │ Calculate Price      │                    │                    │
  │                            │ (Base + Trust Adj.)  │                    │                    │
  │                            │                       │                    │                    │
  │                            │ Reserve Vehicle      │                    │                    │
  │                            │──────────────────────────────────────────────────────────────│
  │                            │                       │                    │                    │
  │                            │ Create Subscription  │                    │                    │
  │                            │ (status: active)     │                    │                    │
  │                            │                       │                    │                    │
  │                            │ Create Billing Cycle │                    │                    │
  │                            │───────────────────────────────────────────│                    │
  │                            │                       │                    │  Capture Payment   │
  │                            │                       │                    │  (Auto-pay)        │
  │                            │                       │                    │                    │
  │  Confirmed + Vehicle      │                       │                    │                    │
  │<──────────────────────────│                       │                    │                    │
  │                            │                       │                    │                    │
  │  ─── (Monthly Billing Cycles) ───                 │                    │                    │
  │                            │                       │                    │                    │
  │  Use Vehicle (KM tracked) │                       │                    │                    │
  │──────────────────────────>│                       │                    │                    │
  │                            │                       │                    │                    │
  │  ─── (Cycle End) ───      │                       │                    │                    │
  │                            │ Calculate Usage      │                    │                    │
  │                            │ (KM used - Included) │                    │                    │
  │                            │                       │                    │                    │
  │                            │ Apply Excess KM      │                    │                    │
  │                            │                       │                    │                    │
  │                            │ Generate Invoice     │                    │                    │
  │                            │───────────────────────────────────────────│                    │
  │                            │                       │                    │  Capture Payment   │
  │                            │                       │                    │  (Monthly + Excess)│
  │                            │                       │                    │                    │
  │  Invoice Available        │                       │                    │                    │
  │<──────────────────────────│                       │                    │                    │
```

### 3.4 Billing Cycle Management

#### 3.4.1 Billing Schedule

| Plan | Billing Day | Payment Method | Proration |
|------|-------------|----------------|-----------|
| VaaS Flex | Subscription anniversary | Auto-pay (card/EFT) | Daily proration on upgrade/downgrade |
| VaaS Plus | 1st of month | Auto-pay (card/EFT) | Not prorated (full months) |
| VaaS Business | 1st of month | Invoice (EFT/credit) | Per-vehicle proration |
| WDR Plus | Subscription anniversary | Auto-pay (card) | Not prorated |

#### 3.4.2 Dunning (Failed Payment) Flow

```
Payment Due → Auto-charge (D+0)
    ├── Success → Cycle marked 'paid'
    └── Failure → Retry D+1, D+3, D+7
        ├── Success → Resume normal billing
        └── All fail → Notify user
            ├── User updates payment → Retry
            └── 14 days overdue → Subscription paused
                ├── User resolves → Resume + catch-up payment
                └── 30 days overdue → Subscription cancelled + debt collection
```

#### 3.4.3 Usage Tracking & Excess Calculation

```
function calculateUsage(subscriptionId, periodStart, periodEnd):
    subscription = getSubscription(subscriptionId)
    plan = getPlan(subscription.planId)
    
    // Sum all trip KMs in period
    totalKm = sumTripsKm(subscription.userId, periodStart, periodEnd)
    includedKm = plan.includedKm
    
    excessKm = max(0, totalKm - includedKm)
    excessCharge = excessKm * plan.excessKmRateZar
    
    // Apply trust tier discount on excess
    trustTier = getTrustTier(subscription.userId)
    if trustTier == DIAMOND:
        excessCharge *= 0.85   // 15% discount
    elif trustTier == PLATINUM:
        excessCharge *= 0.90   // 10% discount
    
    return { totalKm, includedKm, excessKm, excessCharge }
```

### 3.5 Trust Score Pricing Integration

| Trust Tier | Flex Discount | Plus Discount | Business Loading |
|------------|--------------|---------------|------------------|
| Diamond | -15% | -10% | -10% (preferred fleet rate) |
| Platinum | -10% | -5% | Standard |
| Gold | -5% | Standard | Standard |
| Silver | Standard | +10% | +5% |
| Bronze | +15% | Not eligible | +10% (manual approval) |
| Restricted | Not eligible | Not eligible | Not eligible |

**Implementation:**
```
function applyTrustPricing(planPrice, trustTier, planType):
    adjustments = {
        DIAMOND:  { flex: 0.85, plus: 0.90, business: 0.90 },
        PLATINUM: { flex: 0.90, plus: 0.95, business: 1.00 },
        GOLD:     { flex: 0.95, plus: 1.00, business: 1.00 },
        SILVER:   { flex: 1.00, plus: 1.10, business: 1.05 },
        BRONZE:   { flex: 1.15, plus: null, business: 1.10 },
        RESTRICTED: null  // Not eligible
    }
    
    multiplier = adjustments[trustTier][planType]
    if multiplier == null: return { eligible: false }
    return { eligible: true, adjustedPrice: round(planPrice * multiplier, 2) }
```

### 3.6 VaaS Business — Fleet Management Dashboard API

```
GET  /subscriptions/business/{id}/fleet           → Fleet overview
GET  /subscriptions/business/{id}/drivers          → Driver roster
POST /subscriptions/business/{id}/drivers          → Add driver
DELETE /subscriptions/business/{id}/drivers/{uid}  → Remove driver
PATCH /subscriptions/business/{id}/drivers/{uid}   → Update limits
GET  /subscriptions/business/{id}/usage            → Pooled usage summary
GET  /subscriptions/business/{id}/invoices         → Consolidated invoices
POST /subscriptions/business/{id}/swap-vehicle     → Reassign vehicle between drivers
```

---

## 4. API Specifications

### 4.1 Ledger Service API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/wallet` | Get current user's wallet balance and holds |
| GET | `/wallet/transactions` | List paginated transactions |
| POST | `/wallet/top-up` | Top up wallet from payment method |
| POST | `/wallet/withdraw` | Withdraw to linked bank account |
| GET | `/wallets/{id}` | Admin: get any wallet |
| POST | `/wallets/{id}/freeze` | Admin: freeze wallet for investigation |
| POST | `/wallets/{id}/unfreeze` | Admin: unfreeze wallet |
| GET | `/transactions/{id}` | Get transaction detail |
| POST | `/transactions/{id}/retry` | Retry failed transaction |
| POST | `/transactions/{id}/reverse` | Reverse erroneous transaction |
| GET | `/payments/methods` | List saved payment methods |
| POST | `/payments/methods` | Add payment method |
| DELETE | `/payments/methods/{id}` | Remove payment method |
| POST | `/payments/capture` | Capture payment (internal) |
| POST | `/payments/refund` | Issue refund (internal) |
| GET | `/commissions/booking/{bookingId}` | Get commission breakdown |
| GET | `/commissions/owner/{ownerId}` | Owner commission summary |
| GET | `/payouts/owner/{ownerId}` | Payout history for owner |
| POST | `/payouts/batch` | Admin: trigger batch payout run |
| GET | `/invoices` | List current user's invoices |
| GET | `/invoices/{id}` | Get invoice detail with line items |
| GET | `/invoices/{id}/pdf` | Download invoice PDF |
| GET | `/reconciliation/daily` | Admin: daily reconciliation report |
| GET | `/reconciliation/discrepancies` | Admin: unreconciled items |

### 4.2 Subscription Service API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/subscriptions/plans` | List all active plans |
| GET | `/subscriptions/plans/{id}` | Get plan detail (features, pricing, eligibility) |
| POST | `/subscriptions` | Create new subscription |
| GET | `/subscriptions/{id}` | Get subscription with current status |
| PATCH | `/subscriptions/{id}` | Update (change plan, vehicle, auto-renew) |
| POST | `/subscriptions/{id}/pause` | Pause subscription |
| POST | `/subscriptions/{id}/resume` | Resume paused subscription |
| POST | `/subscriptions/{id}/cancel` | Cancel subscription |
| POST | `/subscriptions/{id}/upgrade` | Upgrade to higher plan |
| POST | `/subscriptions/{id}/downgrade` | Downgrade to lower plan |
| POST | `/subscriptions/{id}/swap-vehicle` | Change assigned vehicle (Plus/Business) |
| GET | `/subscriptions/{id}/billing-cycles` | List billing cycles |
| GET | `/subscriptions/{id}/billing-cycles/{cycleId}` | Get cycle detail |
| GET | `/subscriptions/{id}/usage` | Current period usage (km, days) |
| GET | `/subscriptions/{id}/usage/history` | Historical usage |
| GET | `/subscriptions/vehicle-pool` | Available vehicles for Flex subscribers |
| POST | `/subscriptions/vehicle-pool/{vehicleId}/reserve` | Reserve vehicle from pool |
| GET | `/subscriptions/business/{id}/fleet` | Business fleet dashboard |
| POST | `/subscriptions/business/{id}/drivers` | Add driver to business fleet |
| DELETE | `/subscriptions/business/{id}/drivers/{userId}` | Remove driver |
| PATCH | `/subscriptions/business/{id}/drivers/{userId}` | Update driver limits |

### 4.3 Internal Service Endpoints (gRPC/REST inter-service)

```
POST /internal/ledger/transactions     → Booking service: create payment tx
POST /internal/ledger/commissions      → Booking service: create commission
POST /internal/ledger/payouts/process  → Scheduler: batch payout run
POST /internal/ledger/refund           → Booking service: issue refund

POST /internal/subscriptions/check-eligibility  → Booking: is user eligible?
GET  /internal/subscriptions/user/{userId}      → Booking: get user's subscription
POST /internal/subscriptions/record-usage       → Telemetry: record KM for billing
POST /internal/subscriptions/trigger-billing    → Scheduler: run monthly billing
```

---

## 5. Database Dependencies

### 5.1 Ledger Service Owns

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `ledger.wallets` | `user_id`, `balance_zar`, `hold_balance`, `is_frozen` | 1:1 with users |
| `ledger.transactions` | `wallet_id`, `type`, `amount`, `direction`, `status`, `reference` | Immutable |
| `ledger.ledger_entries` | `transaction_id`, `account`, `direction`, `amount` | Double-entry |
| `ledger.commissions` | `booking_id`, `owner_id`, `rate`, `amount`, `status` | Per-booking |
| `ledger.invoices` | `user_id`, `type`, `number`, `line_items`, `total`, `status` | VAT-compliant |

### 5.2 Subscription Service Owns

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `subs.subscription_plans` | `plan_type`, `name`, `price_zar`, `included_km`, `features` | Read-only catalog |
| `subs.subscriptions` | `user_id`, `plan_id`, `vehicle_id`, `status`, `period` | Active subscriptions |
| `subs.billing_cycles` | `subscription_id`, `period`, `amount`, `status`, `usage_data` | Monthly cycles |

### 5.3 External Dependencies

The Subscription Service reads from:
- `fleet.vehicles` — For vehicle pool management and allocation
- `trust.trust_scores` — For trust-tier pricing adjustments
- `iam.user_payment_methods` — For auto-pay setup

The Ledger Service reads from:
- `booking.bookings` — For booking amounts and status
- `booking.check_in_events` / `check_out_events` — For trip validation
- `trust.deposits` — For deposit holds and releases

---

## 6. Event-Driven Communication

### 6.1 Published Events (Ledger Service)

| Event | Payload | Consumers |
|-------|---------|-----------|
| `payment.completed` | `{ bookingId, transactionId, amount }` | Booking (confirm), Notification |
| `payment.failed` | `{ bookingId, reason }` | Booking (retry), Notification |
| `payment.refunded` | `{ bookingId, amount }` | Booking (cancel status), Notification |
| `payout.processed` | `{ ownerId, bookingId, amount }` | Notification, Analytics |
| `wallet.updated` | `{ userId, balance, change }` | Notification, Analytics |
| `invoice.generated` | `{ invoiceId, userId, total }` | Notification, Document service |

### 6.2 Published Events (Subscription Service)

| Event | Payload | Consumers |
|-------|---------|-----------|
| `subscription.created` | `{ subscriptionId, userId, plan, price }` | Notification, Analytics |
| `subscription.paused` | `{ subscriptionId, userId, until }` | Fleet (release vehicle), Notification |
| `subscription.resumed` | `{ subscriptionId, userId, vehicleId }` | Fleet (reserve vehicle), Notification |
| `subscription.cancelled` | `{ subscriptionId, userId, reason }` | Fleet (release vehicle), Ledger (final bill), Analytics |
| `billing.cycle.completed` | `{ subscriptionId, period, amount, usage }` | Notification (invoice), Analytics |
| `billing.cycle.failed` | `{ subscriptionId, period, reason }` | Dunning process, Notification |
| `usage.exceeded` | `{ subscriptionId, usage, limit }` | Notification (alert user) |

### 6.3 Consumed Events

| Service Listens For | Source Service | Action |
|--------------------|---------------|--------|
| `booking.confirmed` | Booking → Ledger | Create payment capture |
| `booking.completed` | Booking → Ledger | Calculate commission, release deposit, schedule payout |
| `booking.cancelled` | Booking → Ledger | Process refund (if applicable) |
| `booking.extended` | Booking → Ledger | Additional payment capture |
| `trust.score_updated` | Trust → Subscription | Recalculate monthly pricing for next cycle |
| `telemetry.trip_ended` | Telemetry → Subscription | Update usage counters |
| `user.registered` | IAM → Subscription | Send onboarding (WDR Plus upsell) |

---

## 7. Scheduled Jobs

| Job | Service | Schedule | Description |
|-----|---------|----------|-------------|
| `batch-payout` | Ledger | Every 2 hours | Process pending payouts due |
| `generate-invoices` | Ledger | Daily at 02:00 | Generate any pending invoices |
| `reconciliation` | Ledger | Daily at 04:00 | Reconcile with payment gateway |
| `retry-failed-payments` | Ledger | Every hour | Retry failed transactions |
| `monthly-billing` | Subscription | 1st of month 00:00 | Generate billing cycles |
| `dunning-check` | Subscription | Daily | Check for overdue payments |
| `usage-aggregation` | Subscription | Daily | Aggregate daily KM/days usage |
| `subscription-renewal` | Subscription | Daily | Auto-renew subscriptions ending soon |
| `freeze-expired-subs` | Subscription | Daily | Freeze 14+ days overdue |

---

## 8. Error Handling & Recovery

### 8.1 Idempotency

All payment and subscription mutation endpoints accept `X-Idempotency-Key` header:
- Key stored in Redis with 24h TTL
- Same key + same payload → return cached response
- Same key + different payload → return `409 Conflict`

### 8.2 Saga Pattern for Multi-Service Operations

```
Payment Saga (Booking → Payment → Commission → Payout):
    1. Booking completed event emitted
    2. Ledger creates commission record
    3. If commission fails → emit compensation event
    4. Ledger releases deposit (compensation path)
    5. If all successful → schedule payout
```

### 8.3 Recovery Scenarios

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Payment capture failed | Booking status 'pending' | Retry 3x exponential backoff |
| Gateway timeout | No auth response | Idempotency check → retry |
| Wallet balance incorrect | Reconciliation mismatch | Auto-correct if <R100; escalate |
| Subscription billing missed | Scheduler check | Catch-up on next run |
| Payout EFT bounced | Bank return code | Retry with notification |
| Invoice generation failed | Queue monitoring | Manual regenerate |

---

## 9. Performance Targets

| Metric | Ledger Service | Subscription Service |
|--------|---------------|---------------------|
| P50 payment capture | <2s | <1s |
| P99 payment capture | <5s | <3s |
| Wallet balance query | <50ms | N/A |
| Transaction history query | <200ms | N/A |
| Commission calculation | <300ms | N/A |
| Batch payout run (1000 payouts) | <5min | N/A |
| Subscription creation | <1s | <800ms |
| Billing cycle generation (10k) | N/A | <10min |
| Usage query | N/A | <100ms |
| Plan listing | N/A | <50ms (cached) |

---

## 10. Code Structure

### 10.1 Repo Layout (Monorepo)

```
services/
├── payment-service/          # → Ledger Service
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic
│   │   │   ├── wallet-service.ts
│   │   │   ├── transaction-service.ts
│   │   │   ├── commission-service.ts
│   │   │   ├── payout-service.ts
│   │   │   ├── invoice-service.ts
│   │   │   └── reconciliation-service.ts
│   │   ├── gateways/         # Payment provider integrations
│   │   │   ├── yoco-gateway.ts
│   │   │   └── ozow-gateway.ts
│   │   ├── events/           # Event handlers
│   │   ├── jobs/             # Scheduled jobs
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── subscription-service/     # → VaaS Service
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── plan-service.ts
│   │   │   ├── subscription-service.ts
│   │   │   ├── billing-service.ts
│   │   │   ├── usage-service.ts
│   │   │   ├── fleet-allocator.ts
│   │   │   └── trust-pricing-service.ts
│   │   ├── events/
│   │   ├── jobs/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
```

### 10.2 Shared Types (to add to `packages/shared-types/src/index.ts`)

```typescript
// ─── Ledger Types ────────────────────────────────────────────────

export interface WalletResponse {
  id: string;
  userId: string;
  balanceZar: number;
  availableBalance: number;
  holdBalance: number;
  currency: string;
  isFrozen: boolean;
}

export interface TransactionResponse {
  id: string;
  walletId: string;
  transactionType: TransactionType;
  direction: LedgerDirection;
  amountZar: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  gatewayReference: string | null;
  feeZar: number;
  createdAt: string;
  settledAt: string | null;
}

export interface CommissionResponse {
  id: string;
  bookingId: string;
  grossAmountZar: number;
  commissionRatePct: number;
  commissionAmountZar: number;
  platformFeeZar: number;
  ownerPayoutZar: number;
  status: 'calculated' | 'invoice' | 'paid' | 'reversed';
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  lineItems: InvoiceLineItem[];
  subtotalZar: number;
  vatZar: number;
  totalZar: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'credited';
  dueDate: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatRate: number;  // 0, 15 (SA VAT)
}

// ─── Subscription Types ──────────────────────────────────────────

export interface SubscriptionPlanResponse {
  id: string;
  planType: SubscriptionPlan;
  name: string;
  description: string | null;
  billingPeriod: BillingPeriod;
  priceZar: number;
  setupFeeZar: number;
  includedHours: number | null;
  includedKm: number | null;
  excessKmRateZar: number | null;
  vehicleCategories: string[];
  maxActiveBookings: number;
  features: string[];
  trustPricing: Record<string, number>;  // tier → multiplier map
}

export interface SubscriptionResponse {
  id: string;
  planId: string;
  planName: string;
  vehicleId: string | null;
  vehicleName: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  priceZar: number;
  trustAdjustedPrice: number;
  usageCurrentPeriod: { km: number; days: number };
  autoRenew: boolean;
  createdAt: string;
}

export interface CreateSubscriptionInput {
  planId: string;
  vehicleId?: string;
  autoRenew?: boolean;
  paymentMethodId: string;
}

export interface BillingCycleResponse {
  id: string;
  periodStart: string;
  periodEnd: string;
  amountZar: number;
  status: 'pending' | 'invoiced' | 'paid' | 'failed' | 'refunded';
  usage: { km: number; excessKm: number; excessCharge: number };
  invoiceId: string | null;
}
```

---

## 11. Security Considerations

| Concern | Ledger Service | Subscription Service |
|---------|---------------|---------------------|
| PCI-DSS | Handled by payment gateway (Yoco/Peach) — raw card never reaches WDR | N/A — auto-pay uses tokens only |
| Fraud detection | Velocity checks: >3 payment attempts/min → block | >2 failed billing cycles → pause sub |
| Payout security | Whitelist bank accounts; 2FA for payout initiation | N/A |
| Data integrity | Immutable transaction log; no soft-deletes | Immutable billing cycle records |
| Internal access | All internal endpoints require service-to-service mTLS | Same |
| Audit trail | All admin wallet actions logged in `events.domain_events` | All subscription status changes logged |

---

*This document references: Database schema (`schema.sql` — `ledger.*` and `subs.*` tables), API Architecture (`api-architecture.md`), Trust Engine Logic (`trust-engine-logic.md`), and Financial Strategy (`/home/team/shared/strategy/financials/GTM_AND_FINANCIALS.md`)*