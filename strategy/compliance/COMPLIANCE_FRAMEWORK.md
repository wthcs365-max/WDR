# WTH Drive Rentals — Compliance & Risk Framework (South Africa)

**Version:** 1.0  
**Last Updated:** 2025-07-15  
**Owner:** Strategist (Risk & Compliance)

---

## 1. Executive Summary

WTH Drive Rentals operates at the intersection of mobility, fintech, and insurance. This framework ensures full regulatory compliance across all South African applicable laws while building a defensible risk underwriting engine. The Trust Scoring system is the core risk mitigation lever — it replaces traditional high-friction deposits with data-driven decisioning that satisfies both regulatory and insurance requirements.

---

## 2. Regulatory Compliance

### 2.1 POPIA (Protection of Personal Information Act)

| Requirement | WDR Implementation | Status |
|---|---|---|
| **Lawful Processing (Section 9-11)** | Explicit consent obtained during onboarding (renter, owner, dealer); consent per purpose (KYC, scoring, telematics, insurance) | To implement |
| **Purpose Specification (Section 13)** | Data collected only for: identity verification, risk scoring, trip facilitation, regulatory reporting | To implement |
| **Minimality (Section 10)** | Collect only: ID/passport, driver's license, address, payment method, driving history, telematics data. No unnecessary demographic or health data | To implement |
| **Retention & Restriction (Section 14)** | Retention schedule: KYC data = 5 years post-last transaction; telematics = 90 days; logs = 2 years for dispute resolution | To implement |
| **Data Subject Rights (Sections 18-25)** | Self-service portal for access, correction, deletion (subject to legal retention), data portability | To implement |
| **Cross-Border Transfer (Section 57)** | No cross-border transfers currently; all data resides in ZA via AWS Cape Town region | To implement |
| **Information Officer (Section 55)** | Appoint Information Officer; register with InfoReg; publish PAIA manual | To implement |
| **Security Measures (Section 19)** | Encryption at rest (AES-256) and in transit (TLS 1.3); pseudonymized risk scores; role-based access control | To implement |
| **Data Breach Notification (Section 22)** | 72-hour notification to InfoReg; affected data subjects informed within 24 hours of regulator notification | To implement |

**Risk:** POPIA fines up to ZAR 10 million or imprisonment for directors.  
**Mitigation:** Dedicated Privacy Officer, annual POPIA audits, data protection impact assessments (DPIA) before feature launches.

---

### 2.2 NCR (National Credit Regulator) Compliance

WDR does NOT originate credit. However, the following touchpoints trigger NCR oversight:

| Activity | NCR Relevance | Required Action |
|---|---|---|
| **Deposit Waiver** | Not credit — it's a risk product. No NCR registration needed if structured as an insurance/bond waiver | Legal opinion confirming non-credit classification |
| **VaaS Subscriptions** | Monthly recurring subscription for vehicle access. If no ownership transfer, not credit. If rent-to-own, NCR applies | Structure as pure rental/subscription. No ownership transfer clause |
| **Embedded Financing** | Rent-to-own conversions offered through partner lenders | Partner must be NCR-registered credit provider. WDR acts as introducer only |
| **Late Payment Penalties** | May be deemed "credit fee" if excessive | Cap penalties at prescribed max interest rate (repo rate + 21% p.a. max per NCA) |
| **Debt Counselling** | If user falls >20 days behind, must refer to debt counselling per NCA Section 129 | Automated triggers for Section 129 notices; debt counselling referral path |

**Key Documents:**
- NCR Registration Certificate (if directly offering credit — currently not needed)
- Partner lender NCR certificate (for embedded financing)
- Loan disclosure forms (NCA Form 20) — for partner loans

---

### 2.3 FICA (Financial Intelligence Centre Act)

WDR is an "accountable institution" under FICA Schedule 1 if it facilitates financial transactions.

| FICA Requirement | WDR Implementation |
|---|---|
| **Customer Due Diligence (CDD)** | Full KYC at onboarding. Verify: Full name, ID number (Home Affairs verification), residential address, source of funds (for high-value rentals >ZAR 25,000) |
| **Beneficial Ownership** | For corporate/Dealer accounts, identify natural persons controlling >25% of entity |
| **Ongoing Due Diligence** | Transaction monitoring for suspicious patterns; KYC refresh every 12 months |
| **Record Keeping** | 5-year retention of CDD records and transaction history |
| **Risk Classification** | Risk-based approach: Low (verified P2P renters <ZAR 10k/day), Medium (dealers, VaaS subscribers), High (cash payments, high-value luxury bookings) |
| **Suspicious Transaction Reporting** | Submit STRs to FIC within 15 days of suspicion; no tipping-off |
| **Cash Threshold Reporting** | Report all cash transactions >ZAR 49,999.99 to FIC (no cash on platform — enforce digital payments) |

**Risk:** FICA non-compliance carries fines up to ZAR 100 million and imprisonment up to 15 years.  
**Mitigation:** Automated KYC via Home Affairs e-Channel; biometric liveness checks; no cash accepted; all payments via debit/credit card or EFT with verified source.

---

### 2.4 Insurance Underwriting Requirements

| Requirement | P2P Rentals | Dealer Inventory | VaaS Subscriptions |
|---|---|---|---|
| **Minimum Cover** | Comprehensive + Third Party Fire & Theft | Comprehensive (dealership insurance) | Comprehensive + Gap Cover |
| **Excess Structure** | ZAR 5,000-15,000 standard; Waiver shifts excess to WDR Shield | ZAR 2,500-10,000 per dealer policy | ZAR 2,000 standard |
| **Telematics Required** | Mandatory (OBD-II dongle or app-based) | Recommended for high-value stock | Mandatory (hardwired) |
| **Underwriter** | Partner insurer (tied) with trip-based overlay | Dealer's existing insurer + WDR gap | WDR master policy (brokered) |
| **Claims Process** | Digital claims portal; 48-hour initial assessment | Dealer handles; WDR facilitates | WDR handles via insurance partner |
| **Deposit Waiver Instrument** | Surety bond / insurance policy waiver — underwritten per renter risk score | Not applicable (dealer covers) | Built into subscription fee |

**Insurance Partner Requirements:**
- FSCA-licensed short-term insurer
- Underwrite on risk-scored basis using WDR Trust Alpha inputs
- Provide trip-based (per-day/per-kilometer) premium calculation
- Claims turnaround: <48 hours for assessment, <7 days for payout on approved claims

---

## 3. Trust Scoring Engine — Risk Inputs

This section defines the inputs to the Trust Scoring Engine. The architect will use these to design the scoring algorithm.

### 3.1 Input Categories

#### A. Identity & KYC (Weight: 25%)
| Signal | Data Source | Validation |
|---|---|---|
| ID Verification | Home Affairs / Dept. of Transport | MVA match, identity confirmed |
| Driver's License Validity | eNaTIS (National Traffic Info System) | License code, expiration, endorsements |
| Facial Biometric Match | Selfie + ID photo | Liveness detection, 1:1 match |
| Phone & Email Verification | SMS OTP / Email OTP | Active, verified, owned |

#### B. Financial History (Weight: 25%)
| Signal | Data Source | Risk Indicator |
|---|---|---|
| Credit Score | TransUnion / Experian / XDS SA | Score >620 = low risk; <580 = high |
| Adverse Records | Credit bureau | Judgments, admin orders, defaults in last 5 years |
| Bank Account Verification | PenCheck / real-time EFT | Valid account, positive balance flag |
| Income Proof | Payslip / bank statement | Debt-to-income <40% |
| Past Rental Payment History | WDR internal (or partner data) | Payment punctuality % |

#### C. Behavioral & Platform History (Weight: 20%)
| Signal | Data Source | Risk Indicator |
|---|---|---|
| Trip Completion Rate | WDR internal | >90% = low risk |
| Late Return Frequency | WDR internal | <5% of trips |
| Damage Claims History | WDR internal + insurer data | 0 claims = low risk |
| App Engagement | Platform analytics | Consistent app usage = lower fraud risk |
| Referral Network Quality | Social graph | Trusted referrers = positive signal |

#### D. Telematics & Driving Behaviour (Weight: 30%)
| Signal | Data Source | Risk Indicator |
|---|---|---|
| Hard Braking / Acceleration Events | OBD-II / Smartphone GPS | Events per 100km threshold |
| Speed Compliance | GPS telemetry | % time over speed limit |
| Night Driving | GPS telemetry | % of driving between 23:00-05:00 |
| Distance Driven | GPS telemetry | km per day / per trip |
| Geolocation Anomaly | GPS + geofence | Vehicle leaving permitted zone |
| Driving Smoothness Score | Sensor fusion algorithm | Composite 0-100 |

### 3.2 Scoring Methodology

```
WDR Trust Alpha Score = f(KYC, Financial, Behavioural, Telematics) → 0–1000

Tiers:
- Premium (800-1000):  Zero deposit waiver fee, instant booking
- Standard (650-799):   50% deposit waiver fee, standard verification
- Elevated (500-649):    Full deposit required OR high waiver premium
- High Risk (<500):      Manual review; deposit + hold collateral

Deposit Waiver Premium = Base Premium × Risk Multiplier(Tier)
```

### 3.3 Privacy & Fairness
- No discrimination on race, gender, age, or location (POPIA Section 10)
- Model explainability: user can request reasons for score (Section 18 right)
- Annual model fairness audit
- Data used only for risk assessment — not for marketing or pricing optimization outside of underwriting

---

## 4. Governance & Risk Management

### 4.1 Risk Committee
- **Chair:** COO / Head of Risk
- **Members:** Legal Counsel, Data Protection Officer, Head of Insurance, Head of Product
- **Cadence:** Monthly risk review, quarterly compliance audit

### 4.2 Key Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Data Breach (POPIA violation) | Medium | High (ZAR 10M fine + reputational) | Encryption, quarterly pen tests, access controls |
| Fraud via fake identity (FICA) | Medium | High (criminal liability) | Liveness detection, Home Affairs verification |
| Underwriting loss exceeds premiums | Low | High (capital erosion) | Telematics-based dynamic pricing; reinsurance |
| Rental default / vehicle theft | Medium | High (asset loss) | GPS immobilization; geofencing; surety bond |
| NCR reclassification risk | Low | High (regulatory penalty) | Legal opinion; structure as rental not credit |
| Driver's license fraud | Medium | Medium | eNaTIS MVA query; biometric match |

### 4.3 Operational Controls
- **Escrow:** All rental payments held in trust account (FSCA-regulated)
- **Dispute Resolution:** Independent arbitration panel for damage claims
- **Insurance Claims:** Dedicated claims handler with SLA of 48-hour assessment
- **Fraud Detection:** Real-time transaction monitoring with rule-based + ML anomaly detection

---

## 5. Implementation Roadmap

| Phase | Compliance Milestones | Timeline |
|---|---|---|
| **Phase 1: MVP** | POPIA baseline compliance; FICA CDD for MVP users; Trust Score v1 (KYC + financial) | Q3 2025 |
| **Phase 2: Dealer Exchange** | FICA full compliance; Insurance partner agreements; Telematics integration; Trust Score v2 (+behavioral) | Q4 2025 |
| **Phase 3: VaaS** | NCR legal compliance opinion; Full POPIA audit; Trust Score v3 (+telematics); FSCA registration for insurance | Q1 2026 |
| **Phase 4: Scale** | Annual POPIA/FICA audit cycle; Reinsurance program; STR filing automation | Q2-Q3 2026 |

---

## 6. Appendices

### A. Required Regulatory Registrations
| Body | Registration Type | Timeline |
|---|---|---|
| InfoReg (POPIA) | Information Officer registration | Pre-launch |
| FSCA | FSP license (if facilitating insurance) | Phase 2 |
| FIC | Registration as accountable institution | Phase 1 |
| NCR | N/A (unless rent-to-own) | Monitor |

### B. Partner Requirements
- **KYC Provider:** Home Affairs e-Channel / identity verification API
- **Credit Bureau:** TransUnion SA or Experian SA for credit scoring
- **Telematics Provider:** Tracking company or OBD-II OEM
- **Insurance Partner:** Old Mutual / Hollard / Discovery Insure / Santam
- **Payment Partner:** Yoco / Ozow / Peach Payments (PCI-DSS Level 1)

### C. Trust Score Processing Flow
```
User Onboarding
    ↓
KYC Collection (ID, License, Selfie, Bank)
    ↓
API Calls (Home Affairs, eNaTIS, Credit Bureau)
    ↓
Identity Verified?
    ├── Yes → Behavioral Check (existing platform data)
    │          └── Telematics Enrolment (if renting)
    │                 └── Compute Trust Score
    └── No → Manual Review → Approve/Reject
    ↓
Result: Trust Tier + Deposit Waiver Premium
```

---

*This framework should be reviewed quarterly and updated as regulation evolves. All implementation dates are provisional and subject to lead approval.*