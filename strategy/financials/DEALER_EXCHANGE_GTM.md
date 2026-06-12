# WTH Drive Rentals — GTM Strategy: Dealer Exchange & TBYB Funnel

**Version:** 1.0  
**Last Updated:** 2025-07-15  
**Owner:** Strategist (GTM & Partnerships)  
**Status:** Draft for Lead Review  

---

## 1. Executive Summary

The Dealer Exchange is Phase 2 of WDR's GTM rollout and represents the single highest-leverage growth lever for both supply (quality inventory) and demand (brand trust). This document defines:

1. **Dealership Onboarding Process** — How dealerships sign up, list inventory, and integrate with WDR
2. **TBYB (Try Before You Buy) Funnel** — Converting rental leads into vehicle purchase leads; legal/compliance framework
3. **B2B Value Proposition** — Why dealers should join WDR (the pitch)
4. **Design Coordination** — Brand assets needed for dealership-facing touchpoints

**3-Year Target:** 50 dealerships by Month 12, 200+ by Month 36, contributing 40% of total WDR GMV.

---

## 2. Dealer Exchange Value Proposition

### 2.1 The Pitch (Why Dealers Join WDR)

| Pain Point | WDR Solution | Financial Impact |
|---|---|---|
| **Idle demo/used stock** sits on forecourt for 45-90 days | List it on WDR — earn rental revenue while it waits to sell | ZAR 8,000-15,000/month per vehicle at 60% utilization |
| **Test drives don't convert** (industry avg 15-20% close rate) | TBYB turns test drives into paid rentals — renter gets extended experience, dealer gets paid either way | 25-40% higher conversion rate on TBYB leads |
| **Inventory carrying costs** (floorplan interest, depreciation, insurance) | Rental revenue offsets holding costs; vehicles earn their keep | ZAR 3,000-5,000/month carrying cost offset per vehicle |
| **Low foot traffic** on weekdays | WDR demand fills weekday gaps — gig workers, tourists, corporate | 35% utilization increase across entire week |
| **No digital rental channel** for off-hours | 24/7 self-service booking via WDR app — keyless check-in option | Capture after-hours + walk-in overflow |

### 2.2 Dealer Segment Targeting

| Dealer Tier | Description | Target | Onboarding Priority | Commission |
|---|---|---|---|---|
| **Tier 1: Franchised Groups** | Barloworld, McCarthy, Group1, Motus — large multi-brand groups | 10 groups by Month 6 | **Highest** — brand trust, volume inventory | 17% (Enterprise) |
| **Tier 2: Independent Used** | Large independent dealers (40+ units on forecourt) | 20 dealers by Month 9 | High — flexible, quick to onboard | 20% (Standard) |
| **Tier 3: Premium/Niche** | Luxury, performance, EV specialists | 10 dealers by Month 12 | Medium — higher booking values | 18% (Premium) |
| **Tier 4: Regional Independents** | Smaller dealers in Tier 2 cities (Durban, PTA) | 10 dealers by Month 12 | Medium — fills geographic coverage | 22% (Standard) |

### 2.3 Dealer Success Stories (Target Outcomes)

| Metric | Month 1-3 | Month 4-6 | Month 7-12 |
|---|---|---|---|
| Listings per dealer | 3-5 | 5-10 | 10-20 |
| Bookings per dealer/month | 5 | 15 | 30 |
| Revenue per dealer/month (WDR share) | ZAR 2,500 | ZAR 7,500 | ZAR 15,000 |
| Renter → Buyer conversion (TBYB) | 10% | 15% | 20% |

---

## 3. Dealership Onboarding Process

### 3.1 End-to-End Flow

```
Outreach → Qualification → Agreement → Integration → Listing → Activation → Ongoing
 (Week 1)   (Week 1-2)   (Week 2-3)   (Week 3-4)    (Week 4)   (Week 4-5)   (Ongoing)
```

### 3.2 Step 1: Outreach (Week 1)

| Channel | Method | Target per Rep/Week | Expected Conversion |
|---|---|---|---|
| **B2B Cold Outreach** | Email + LinkedIn + call sequence | 20 prospects | 3 qualified meetings |
| **Dealer Network Referrals** | Warm intro via industry contacts (NADA, RMI) | 5 intros | 4 qualified meetings |
| **Trade Events** | NADA Auto Show, RMI Expo, regional dealer days | Quarterly | 10-15 leads per event |
| **Digital Inbound** | LinkedIn ads targeting dealership managers | 5-10 inbound/wk | 2 qualified meetings |

**Sales Script Opener:**
> "Hi [Name], I'm reaching out because WTH Drive Rentals is launching a Dealer Exchange program in [city]. We turn your demo and used inventory into revenue-generating assets — your cars earn rental income while they're waiting to sell. A dealer like [Tier 1 reference dealer] is already doing ZAR 15,000/month per vehicle. Could we schedule 30 minutes to walk through how it works?"

### 3.3 Step 2: Qualification (Week 1-2)

| Requirement | Must-Have | Nice-to-Have |
|---|---|---|
| Min. 10 vehicles on forecourt | ✅ | — |
| Franchised or RMI-registered | ✅ | — |
| FICA-compliant (FSP registration) | ✅ | — |
| Comfortable with OBD-II telematics | — | ✅ |
| Existing digital inventory photos | — | ✅ |
| Willing to offer TBYB on select models | ✅ | — |

### 3.4 Step 3: Agreement & Legal (Week 2-3)

| Document | Purpose | Legal Reference |
|---|---|---|
| **Dealer Exchange Agreement** | Master services agreement — commission, liability, listing terms | CPA Section 49 (consumer rights), POPIA consent |
| **Insurance Addendum** | Clarifies WDR gap cover vs dealer's existing policy | Insurance Act; FSCA disclosure |
| **TBYB Addendum** | Conversion terms — if renter buys vehicle, WDR commission on sale | CPA Section 44 (cooling-off), NCR (if financed) |
| **POPIA Consent Schedule** | Telematics data collection on dealer vehicles; owner consent | POPIA Section 11-14 |
| **Banking Details & FICA** | Payout account verification (PenCheck per Merchant Payout Strategy) | FICA Section 21A |

### 3.5 Step 4: Integration (Week 3-4)

| Integration Component | Technical Lead | Timeline |
|---|---|---|
| **Dealer Dashboard Setup** | WDR ops (web portal) | Day 1 of integration |
| **Inventory API / CSV Load** | Dealer IT + WDR engineer | 3-5 days |
| **Photo Standards Upload** | Dealer marketing (12 photos/vehicle) | 2-3 days |
| **OBD-II Dongle Kitting** | WDR ops ships dongles (5 per dealer to start) | 3 days shipping |
| **Pricing Engine Tuning** | WDR ops sets dynamic pricing band | 1 day |
| **Staff Training (Webinar)** | WDR account manager (45 min session) | Day 5 |

**Dealer Dashboard Features:**
- Inventory management (add/edit/remove listings, set pricing bands)
- Booking calendar (upcoming, active, completed trips)
- Payout tracking (earnings, history, next payout date)
- TBYB lead view (renters who expressed purchase interest)
- Vehicle telemetry (location, mileage, alerts)
- Damage reports (check-in/out photos, claim status)

### 3.6 Step 5: Listing Activation (Week 4-5)

| Checklist | Owner | Status |
|---|---|---|
| Min. 3 vehicles listed with complete photo sets | Dealer | Required |
| Pricing confirmed within WDR recommended band | WDR + Dealer | Required |
| OBD-II dongle installed and transmitting | Dealer | Required |
| Staff trained on check-in/out process | WDR AM | Required |
| Insurance confirmation received | WDR Ops | Required |
| First booking enabled | WDR Platform | Go-Live |

### 3.7 Step 6: Ongoing Management

| Cadence | Activity | Owner |
|---|---|---|
| **Weekly** | Inventory review — add/remove listings, adjust pricing | Dealer (self-serve) + WDR AM alert if stale |
| **Weekly** | Payout statement generated + batch processed | WDR automated |
| **Bi-weekly** | Performance review call (bookings, revenue, TBYB leads) | WDR Account Manager |
| **Monthly** | TBYB lead report + conversion tracking | WDR analytics |
| **Quarterly** | Business review — GMV, utilization, expansion plan | WDR BD + Dealer GM |

---

## 4. Try Before You Buy (TBYB) Funnel

### 4.1 The TBYB Concept

TBYB allows a renter to **extend their rental** and apply the rental fee toward the **purchase price** of the vehicle if they decide to buy. This turns a standard rental into a sales lead for the dealer.

### 4.2 TBYB Funnel Flow

```
Renter books vehicle (standard rental process)
    ↓
During trip, renter receives in-app message:
    "Love this car? Ask the dealer about buying it."
    ↓
Renter taps "I'm interested" → generates TBYB lead in dealer dashboard
    ↓
Dealer contacts renter (call/in-app chat):
    "You've already paid ZAR 2,550 in rental fees. If you buy today,
     we'll credit that toward the purchase price."
    ↓
Renter agrees → Purchase negotiation begins (on dealer lot)
    ↓
Purchase completed?
    ├── YES → Dealer pays WDR: ZAR 1,500 success fee + commission on sale
    └── NO  → Renter continues rental or returns; no fee to dealer
```

### 4.3 Legal & Compliance Framework (CPA/NCR)

| Legal Concern | Risk | Mitigation | Compliance Ref |
|---|---|---|---|
| **Rental fee as deposit toward purchase** | Could be construed as lay-by (CPA Section 53-58) | Frame as "promotional credit" not lay-by; rental fee is for rental service, not a deposit on sale | CPA Section 53(2)(d) — exclusion for promotional offers |
| **Cooling-off rights (CPA Section 44)** | If buyer purchases at dealer lot (not online), cooling-off may not apply | Dealer handles sale directly; WDR is an introducer only | CPA Section 44(2) — face-to-face sales exempt |
| **NCR reclassification** | If TBYB is structured as credit, NCR registration needed | TBYB is not credit — rental fee is for rental, not a loan or advance | NCA Section 4(1) — credit definition |
| **POPIA — sharing renter intent data with dealer** | WDR sharing renter's "interested in buying" signal | Explicit consent at the moment renter taps "I'm interested" | POPIA Section 11(1)(a) |
| **Vehicle warranty implications** | Rental mileage affects warranty | Renter advised mileage is deducted from remaining warranty; disclosed at booking | CPA Section 56 — implied warranty |
| **Finance approval (NCA)** | If buyer uses dealer finance, NCA applies | Dealer's own NCR-registered finance partner handles; WDR is introducer only | NCA Section 40 |

### 4.4 TBYB Pricing & Incentives

| Scenario | Renter Pays | Dealer Pays WDR | WDR Earns |
|---|---|---|---|
| Renter rents, does NOT buy | Standard rental fee | 20% commission on rental | Commission revenue only |
| Renter rents, BUYS through dealer | Agreed sale price (rental fee credited) | ZAR 1,500 success fee + 20% commission on rental | Commission + success fee |
| Renter extends rental → then buys | Extended rental fee + sale price | ZAR 1,500 success fee + commission on both rentals | Higher commission + success fee |
| Renter refers buyer (not renter) | N/A | ZAR 1,000 referral fee | Referral fee |

### 4.5 Dealer TBYB Dashboard Lead View

```json
{
  "tbyb_leads": [
    {
      "lead_id": "uuid",
      "renter_name": "Thabo Nkosi",
      "booking_id": "uuid",
      "vehicle": "2024 Toyota Corolla 1.8 Hybrid",
      "vin": "JTDBR123456789",
      "rental_days": 3,
      "rental_fee_paid": 255000, // cents (ZAR 2,550)
      "interest_level": "high | medium | browsing",
      "renter_phone": "+27 82 555 1234",     // shared with renter consent
      "renter_email": "thabo@email.com",      // shared with renter consent
      "lead_created": "2025-08-03T14:30:00Z",
      "status": "new | contacted | negotiation | sold | lost",
      "conversion_notes": "Renter wants to test highway driving before deciding"
    }
  ]
}
```

### 4.6 Renter In-App TBYB Experience

| Stage | UI/UX | Trigger |
|---|---|---|
| **Mid-trip notification** | Push notification: "Enjoying the drive? This [Model] could be yours. Tap to learn more." | 24 hours into rental (or 50% trip duration) |
| **Interest confirmation** | Bottom sheet: "I'm interested in buying — share my contact with the dealer? (We'll let them know you're interested in purchasing)." | Renter taps notification |
| **Consent granted** | Toast: "Thanks! The dealer will reach out. There's no obligation to buy." | Renter confirms |
| **Lead created** | TBYB lead appears in dealer dashboard | Real-time |
| **Post-return follow-up** | In-app message: "Still thinking about that [Model]? Chat with [Dealer Name] to discuss options." | 24 hours post-return (if not purchased) |
| **Purchase confirmation** | In-app message: "Congratulations on your new [Model]! Thanks for choosing WTH Drive Rentals." | Dealer marks lead as "sold" |

---

## 5. B2B Sales Toolkit

### 5.1 One-Pager: "Why WDR for Dealers?"

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WTH Drive Rentals | Dealer Exchange Program
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE PROBLEM:
    • SA dealers carry ZAR 15B+ in idle inventory annually
    • Average used car sits 55 days before sale
    • Floorplan interest: ZAR 8-12/day per vehicle

THE SOLUTION:
    WDR Dealer Exchange — Your inventory earns revenue
    while waiting to sell. Zero upfront cost.

KEY BENEFITS:
    📈  ZAR 8,000-15,000/month additional revenue per vehicle
    🎯  25-40% higher conversion via Try Before You Buy
    🏢  24/7 digital rental channel — no staffing needed
    🔒  WDR insurance overlay covers rental gap
    📊  Real-time inventory + booking dashboard

FOR DEALERS:
    • List unlimited vehicles at zero cost
    • Set your own pricing (within WDR band)
    • Get paid weekly — T+1 for Premium partners
    • Full control — accept or decline booking requests
    • OBD-II dongle included (ZAR 0 cost to dealer)

TBYB (TRY BEFORE YOU BUY):
    • Renters can extend rental → apply fee toward purchase
    • Dealer gets qualified buyer lead — warm, pre-interested
    • ZAR 1,500 success fee per sale (only if renter buys)
    • No risk: rental revenue already collected

JOIN THE PILOT:
    • Launch cities: Johannesburg, Cape Town
    • Limited to 50 dealers in Phase 1
    • Contact: dealers@wthdrive.co.za | BDbrian@wthdrive.co.za

WTH Drive Rentals — The Infrastructure Layer for Flexible Mobility
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5.2 Dealer Pitch Deck Outline (Slides)

| Slide | Content | Key Visual |
|---|---|---|
| 1 | **Cover** — WDR Dealer Exchange | Logo (Safari Gold on Deep Charcoal) |
| 2 | **The Problem** — Idle inventory costs ZAR 8-12/day/vehicle | Photo of full dealership lot + cost graphic |
| 3 | **The Opportunity** — ZAR 15k/mo additional revenue per vehicle | Bar chart: Without WDR vs With WDR |
| 4 | **How It Works** — Simple 4-step: List → Book → Rent → Get Paid | Flow diagram |
| 5 | **TBYB Funnel** — Rental converts to sale | Conversion funnel graphic |
| 6 | **Insurance & Safety** — WDR gap cover + telematics | Shield icon + Trust Badge |
| 7 | **Pricing & Commission** — 17-22% take rate; weekly payouts | Fee table |
| 8 | **Dealer Dashboard** — Inventory, bookings, earnings | UI mockup (needs designer) |
| 9 | **Success Stories** — Pilot dealer results | Case study quotes |
| 10 | **Next Steps** — 30-min call to start onboarding | CTA + QR code to demo |

### 5.3 Dealer FAQ

| Question | Answer |
|---|---|
| **What does it cost to join?** | Zero. No listing fees, no setup costs. WDR earns commission only when your vehicle is booked. |
| **Who handles insurance?** | Your existing dealership insurance covers the vehicle. WDR adds a trip-based gap overlay for rental-specific risks (renter behaviour, damage while rented). |
| **What if a renter damages the vehicle?** | WDR Shield (deposit waiver) covers excess up to the waiver limit. Claims process: 48-hour assessment, payout within 7 days. |
| **Who handles check-in/check-out?** | Renter uses the WDR app for self-service check-in (selfie + odometer photos). You can also do in-person handovers. |
| **Can I decline a booking?** | Yes. You set availability and can accept/decline per booking — though accepting >90% improves your search ranking. |
| **How do I get paid?** | Weekly EFT to your verified dealership bank account. Premium tier (50+ bookings/month): T+1 business day. |
| **What about vehicle tracking?** | WDR provides OBD-II dongles (free) that enable GPS tracking while the vehicle is rented. Tracking stops when the vehicle is returned. |
| **Can I list vehicles for TBYB only?** | Yes. You can flag specific vehicles as "TBYB eligible" — they appear in search but with a "Try Before You Buy" badge. |

---

## 6. TBYB Funnel — Detailed Lead Conversion Metrics

### 6.1 Conversion Model

```
1,000 rentals on TBYB-eligible vehicles
    ↓
250 (25%) tap "I'm interested" in app
    ↓
200 (80% of interested) consent to share contact with dealer
    ↓
150 (75% of consented) dealer contacts within 24 hours
    ↓
75 (50% of contacted) visit dealer for purchase discussion
    ↓
30 (40% of visitors) agree to purchase
    ↓
20 (67% of purchases) successfully finance & complete sale
    ↓
📈 **2% overall conversion rate** (rental → purchase) — Industry benchmark: 15-20% test drive → purchase
```

> **Why 2% is acceptable:** For every 1,000 rentals on TBYB vehicles, the dealer has already earned ZAR 510,000 in rental revenue (at ZAR 510 avg commission per booking). The 20 vehicle sales through TBYB represent ZAR 30,000 in success fees + potentially ZAR 600,000+ in vehicle sales profit for the dealer. **Rental revenue alone makes it profitable.**

### 6.2 TBYB Lead Quality Scoring

| Signal | Score Weight | Data Source |
|---|---|---|
| Trip duration > 3 days | 30% | booking.stats |
| Renter Trust Score > 700 | 25% | trust.trust_scores |
| Renter viewed vehicle details > 3x | 20% | analytics.events |
| Renter extended trip | 15% | booking_extensions |
| Renter has prior purchase history | 10% | (future feature) |

Leads scored > 70 are flagged as "Hot Lead" in dealer dashboard.

---

## 7. Design Coordination

### 7.1 Brand Assets Required for Dealership Touchpoints

| Asset | Format | Audience | Deadline | Designer Owner |
|---|---|---|---|---|
| **Dealer Exchange Logo** (sub-brand) | SVG + PNG | Dealerships | Week 1 of Phase 2 | Designer |
| **Dealer Dashboard** (web) — Inventory, Bookings, Payouts, TBYB | Figma mockup | Developer implementation | Week 2-4 | Designer + Architect |
| **Dealer One-Pager PDF** | Print-ready (DL flyer) | B2B sales outreach | Week 3 | Designer |
| **Pitch Deck** (10 slides) | PowerPoint/Google Slides | B2B meetings | Week 4 | Designer + Strategist |
| **Dealer Signage Kit** (window decal, showroom standee) | Print-ready | Dealer locations | Week 6 | Designer |
| **TBYB App Screens** — Interest consent, lead notification, purchase confirmation | Figma (mobile) | Developer implementation | Week 2-4 | Designer |
| **"Try Before You Buy" Badge** (vehicle card overlay) | SVG + PNG | App + web UI | Week 1 | Designer |
| **Dealer Onboarding Kit** (welcome email template, setup guide PDF, video tutorial) | Email + PDF + Video | New dealers | Week 5 | Designer + Marketing |

### 7.2 Design Standards (Per WDR Design System)

| Element | Spec | Reference |
|---|---|---|
| Primary Color | Deep Charcoal `#1A2026` | design-tokens.json |
| Accent Color | Safari Gold `#C5A059` | design-tokens.json |
| Font | Inter | STYLE_GUIDE.md |
| Trust Badge | Verified badge component (shield + checkmark) | COMPONENTS.md |
| TBYB Badge | New component: Safari Gold "Try Before You Buy" tag | Needs designer |
| Dealer Dashboard | Web-first (React/Next.js), responsive | Per architect's API schema |

### 7.3 Brand Voice for Dealership Communication

| Channel | Tone | Example |
|---|---|---|
| **Dealer onboarding email** | Professional, partnership-focused | "Welcome to the WDR Dealer Exchange. Here's how we'll grow your revenue together." |
| **Dealer dashboard** | Clean, data-driven, actionable | "Your inventory earned ZAR 12,450 this week. 4 TBYB leads are waiting." |
| **In-app renter TBYB prompt** | Exciting, personal, low-pressure | "Love this [Model]? See if it could be yours. No obligation." |
| **B2B sales call** | Consultative, ROI-focused | "Let's look at your inventory turnover and calculate the revenue opportunity." |

---

## 8. Launch Timeline (Phase 2: Months 7-12)

| Month | Milestone | Owner | KPI |
|---|---|---|---|
| **Month 1** | Sales team hired + trained; Dealer pitch deck + one-pager finalized | BD Lead + Designer | 2 hires, all materials ready |
| **Month 2** | Pilot with 3 Tier 1 dealership groups (JHB); Dealer dashboard live | BD + Engineer | 3 dealers, 30 listings |
| **Month 3** | Expand to 10 dealerships (JHB + CPT); TBYB soft launch | BD + Product | 10 dealers, 100 listings |
| **Month 4** | TBYB public launch; OBD-II program rolled out | Ops + Product | 25 dealers, 300 listings |
| **Month 5** | Scale to Tier 2/3 dealers; Dealer referral program launched | BD + Marketing | 40 dealers, 600 listings |
| **Month 6** | Phase 1 complete — 50 dealerships target; prepare Phase 3 (VaaS) | All | 50 dealers, 1,000 listings |

---

## 9. KPIs & Success Metrics

| KPI | Month 2 (Pilot) | Month 6 (Phase End) | Year 2 Target |
|---|---|---|---|
| Dealers Onboarded | 3 | 50 | 200 |
| Dealer Listings | 30 | 1,000 | 4,000 |
| Dealer Bookings/Month | 15 | 500 | 2,000 |
| Dealer GMV/Month | ZAR 39,000 | ZAR 1.3M | ZAR 5.2M |
| TBYB Leads/Month | 5 | 100 | 500 |
| TBYB Sales/Month | 1 | 10 | 50 |
| Dealer Fleet Utilization | 20% | 30% | 45% |
| Dealer NPS | — | 50+ | 65+ |
| Average Days to First Booking | 14 days | 7 days | 3 days |
| Dealer Churn (Monthly) | — | < 5% | < 3% |

---

## 10. Risk & Mitigation

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| **Dealers slow to list inventory** | Low supply | Medium | Dedicated account manager weekly check-in; "list 3 vehicles to activate" rule |
| **Dealer staff resistance** (reluctant to adopt new system) | Low engagement | Medium | Hands-on training webinar + in-person onboarding; dealer champion program |
| **TBYB cannibalising new car sales** | Low | Low | TBYB is aimed at used/demo stock — new cars excluded |
| **Dealer insurance gap** (existing policy excludes rental) | Claim rejected | Medium | WDR mandatory gap cover + dealer policy review at onboarding |
| **Renter damages, dealer upset** | Churn risk | Medium | WDR Shield covers excess; 48h claims SLA; dispute arbitration |
| **Inventory photo quality inconsistent** | Poor conversion | High | WDR provides photo standards guide; BD does quality check before activation |

---

## 11. Appendices

### A. Dealer Exchange Agreement — Key Clauses

| Clause | Detail |
|---|---|
| **Commission** | 17-22% of gross booking revenue; paid weekly |
| **Listing Term** | Minimum 3-month commitment per vehicle; 14-day notice to de-list |
| **Insurance** | Dealer maintains comprehensive cover; WDR provides trip-based gap overlay |
| **Liability** | WDR liable for renter damage up to vehicle value (via WDR Shield/insurance); dealer liable for pre-existing damage and mechanical failure |
| **TBYB Success Fee** | ZAR 1,500 per completed sale (excl. VAT); invoiced at point of sale |
| **Data Sharing** | Dealer consents to WDR collecting telematics data during rentals; POPIA Schedule attached |
| **Non-Exclusivity** | Dealer may list on other platforms; WDR first right of refusal on demo stock |
| **Termination** | 30-day notice; immediate if POPIA/FICA breach |

### B. Dealer Onboarding Checklist (Printable)

```
☐  Dealer Exchange Agreement signed
☐  FICA documents provided (company reg, directors' IDs, tax clearance)
☐  Insurance certificate reviewed + gap cover confirmed
☐  Bank account verified (PenCheck)
☐  Dealer dashboard account created
☐  Initial 3+ vehicles entered (photos, specs, pricing)
☐  OBD-II dongles shipped (5 per dealer)
☐  Staff training completed (45-min webinar)
☐  First booking test completed (internal QA)
☐  Live on platform ✅
```

### C. Reference Documents

| Document | Location | Relevance |
|---|---|---|
| GTM Strategy & Financial Projections | `/strategy/financials/GTM_AND_FINANCIALS.md` | Phase 2 financials, unit economics |
| Merchant & Payout Strategy | `/strategy/MERCHANT_PAYOUT_STRATEGY.md` | Dealer payout cycle (T+1 Premium), fee structure |
| Partner Integration Hub | `/strategy/PARTNER_INTEGRATION_HUB.md` | Insurance connector for dealer gap cover |
| Compliance & Risk Framework | `/strategy/compliance/COMPLIANCE_FRAMEWORK.md` | FICA, insurance requirements for dealers |
| Connector SDK Interfaces | `/strategy/connector-sdk/CONNECTOR_SDK_INTERFACES.ts` | Payment connector for dealer payouts |
| WDR Design System | `/design/brand/DESIGN_SYSTEM.md` | Brand guidelines, typography, color palette |
| Component Library | `/design/brand/documentation/COMPONENTS.md` | React Native components, Trust Badge style |
| Database Schema | `/repo/docs/database/schema.sql` | fleet.vehicles (dealership_id, ownership_type), ledger.commissions |

---

*This document builds on the GTM Strategy & Financial Projections (Phase 2 Dealer Exchange) and should be implemented in coordination with the Designer (brand assets) and Architect (dealer dashboard API integration).*