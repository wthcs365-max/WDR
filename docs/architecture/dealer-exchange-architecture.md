# WTH Drive Rentals — Dealer Exchange & TBYB Technical Architecture

**Version:** 1.0  
**Owner:** Architect  
**Status:** Draft for Review  

---

## 1. Overview

The Dealer Exchange extends WDR for automotive dealerships to monetize idle inventory and generate purchase leads via "Try Before You Buy" (TBYB). This document covers: inventory sync API, TBYB conversion flow, and fleet service integration.

---

## 2. Dealer Inventory Sync — 3 Options

| Option | Method | Protocol | Use Case |
|--------|--------|----------|----------|
| **A** | Dealer pushes | REST/JSON | Real-time sync from DMS |
| **B** | CSV Upload | multipart/form-data | Manual via dashboard |
| **C** | WDR pulls | REST/JSON/CSV | Scheduled job (hourly) |

### 2.1 API Endpoint (Option A)
```http
POST /api/v1/partner/inventory/sync
Authorization: Bearer <dealer_api_key>
```
Syncs vehicles via JSON array. VIN auto-decodes specs. Returns: `{ synced, created, updated, removed, errors[] }`.

### 2.2 CSV Upload (Option B)
```http
POST /api/v1/partner/inventory/upload
Content-Type: multipart/form-data
```
Columns: dealer_vehicle_ref, vin, make, model, year, color, mileage_km, daily_rate, retail_price, tbyb_enabled, tbyb_conv_pct, status

### 2.3 VIN Decoder
All sync paths call VIN decoder API to auto-populate: make, model, year, transmission, fuel_type, doors, seats. Dealer data overrides decoder data.

---

## 3. Try Before You Buy (TBYB) Funnel

### 3.1 Flow
```
Renter books dealer vehicle (1-7 day rental)
  → TBYB eligibility checked (enabled, trust tier, max days)
  → Rental completed normally
  → TBYB credit calculated: rental_total × conversion_pct + trust_bonus
  → Lead created (30-day window)
  → Lead pushed to dealer CRM
  → Renter notified of credit amount
  → If purchase within 30 days: credit applied, WDR commission earned
  → If no purchase: lead expires
```

### 3.2 Credit Calculation
```typescript
baseCredit = bookingTotal × (conversionPct / 100)
trustBonus = baseCredit × trustTierBonus  // Diamond: +15%, Platinum: +10%, Gold: +5%
finalCredit = min(baseCredit + trustBonus, dealerMaxCredit)
```

### 3.3 Lead States
```
ACTIVE → CONTACTED → NEGOTIATING → CONVERTED (purchase complete)
ACTIVE → EXPIRED (30 days) | LOST (renter declined)
```

---

## 4. Fleet Service Integration

The existing `fleet.vehicles` table uses `ownership_type = 'dealer'` + new columns:
- `dealer_id`, `dealer_vehicle_ref`, `retail_price_zar`
- `tbyb_enabled`, `tbyb_conversion_pct`, `tbyb_max_days`
- `verification_badge` (verified/pending/rejected)
- `insurance_provider`, `insurance_policy_ref`
- `last_inventory_sync_at`

Re-uses booking-service, trust-service, ledger-service. No new services needed.

### 4.1 Dealer Dashboard API (via partner-service:4010)
| Endpoint Group | Key Endpoints |
|---------------|---------------|
| Profile | GET/PATCH /partner/dealer/profile |
| Inventory | GET/POST/PATCH /partner/inventory |
| Sync | POST /partner/inventory/sync, POST /partner/inventory/upload |
| Bookings | GET /partner/bookings, PATCH /partner/bookings/{id}/approve |
| TBYB | GET/PATCH /partner/tbyb/leads, POST /partner/tbyb/leads/{id}/convert |
| Analytics | GET /partner/analytics/overview, /tbyb, /fleet |

---

## 5. Verification Badge

| Status | Badge | Search Boost | Condition |
|--------|-------|-------------|-----------|
| verified | 🟢 Green "Dealer Verified" | +30% ranking | FICA done + 5+ clean rentals |
| pending | 🟡 Yellow | Neutral | New dealer or new listing |
| rejected | 🔴 Hidden | Not shown | Document failed verification |

---

## 6. New Database Tables

```sql
-- Dealer profiles (extends iam.users for 'dealer' role)
CREATE TABLE dealer.dealer_profiles (
    id UUID PK, user_id UUID FK→users, business_name, registration_number,
    vat_number, fica_status, fica_documents JSONB,
    default_commission_pct, default_tbyb_pct, default_max_tbyb_days,
    min_trust_tier, insurance_mode, auto_approve_bookings,
    api_key_hash, webhook_url, weekly_payout_day,
    inventory_feed_url, last_inventory_sync
);

-- TBYB leads
CREATE TABLE dealer.tbyb_leads (
    id UUID PK, dealer_id FK, renter_id FK, booking_id FK, vehicle_id FK,
    rental_total_zar, conversion_pct, credit_amount_zar, trust_bonus_zar,
    status (active/contacted/negotiating/converted/expired/lost),
    dealer_lead_ref, expiry_date (30 days),
    purchase_price_zar, wdr_commission_zar
);
```

---

## 7. Error Handling

| Error | Recovery |
|-------|----------|
| INVALID_VIN | Skip vehicle, log, continue sync |
| DUPLICATE_VIN | Return conflict, dealer to resolve |
| VIN_DECODE_FAILED | Accept dealer specs, flag for review |
| API_AUTH_FAILED | Stop sync, notify dealer |
| RATE_LIMITED | Queue remaining, retry in 1h |

---

*Full document: `/home/team/shared/architecture/dealer-exchange-architecture.md`*