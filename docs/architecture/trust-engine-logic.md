# WTH Drive Rentals — Trust Scoring Engine Logic ("WTH Drive Verified")

## Overview
The Trust Scoring Engine is the core IP of WDR. It replaces traditional security deposits with a dynamic, data-driven risk assessment.

## Score Components

| Component | Weight | Sub-Components |
|-----------|--------|----------------|
| Identity & KYC | 25% | ID Verification (30%), Driver's License (25%), Facial Biometric (25%), Phone/Email (10%), Address (10%) |
| Financial History | 25% | Credit Score (35%), Adverse Records (25%), Bank Verification (15%), WDR Payment History (25%) |
| Behavioral & Platform | 20% | Trip Completion (30%), Late Return (20%), Damage Claims (25%), App Engagement (10%), Referral Quality (15%) |
| Telematics & Driving | 30% | Driving Smoothness (35%), Speed Compliance (25%), Night Driving (15%), Geolocation (15%), Trip Distance (10%) |

## Score Formula
```
TrustAlpha = round((IdentityScore × 0.25 + FinancialScore × 0.25 + BehavioralScore × 0.20 + TelematicsScore × 0.30) × 10)
```
**Scale:** 0-1000

## Tier Classification

| Tier | Score | Deposit Waiver | Max Vehicle Value |
|------|-------|----------------|-------------------|
| Diamond 💎 | 800-1000 | ✅ Free, up to R50k | No limit |
| Platinum ⭐ | 700-799 | ✅ R25k at 10% fee | R800k |
| Gold 🥇 | 600-699 | ✅ R15k at 20% fee | R500k |
| Silver 🥈 | 500-599 | ⚠️ R5k at 35% fee | R300k |
| Bronze 🥉 | 300-499 | ❌ Full deposit | R150k |
| Restricted ⚠️ | 0-299 | ❌ No access | No access |

## Key Business Rules
- New users with verified ID: default ~525 (Silver)
- After 5 good trips: typically Platinum (700+)
- Score decays 10% per 90 days of inactivity
- Max regression per event: one tier level drop
- Collision: score reset to 25 pending investigation

## 3rd Party Integrations
- **Home Affairs e-Channel** — ID verification
- **eNaTIS / RTMC** — Driver's license check
- **IDVerse** — Document OCR + liveness + face match
- **TransUnion / Experian** — Credit scores
- **PenCheck** — Bank account verification
- **Netstar / Tracker** — GPS telematics