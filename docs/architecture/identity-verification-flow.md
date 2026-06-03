# WTH Drive Rentals — Identity & Verification Flow

## Verification Levels
| Level | Requirements | IdentityScore Max |
|-------|-------------|-------------------|
| L0 Anonymous | None | Cannot rent |
| L1 Basic | Email + Phone OTP | Capped at 300 |
| L2 Standard | + ID document + Home Affairs check | 70 |
| L3 Enhanced | + Driver's license (eNaTIS) + Selfie match | 85 |
| L4 Verified | + Proof of address + Payment method + Liveness | 100 |
| L5 Premium | + Biometric enrollment + Bank verification | Required for Diamond |

## Onboarding Steps
1. Registration → 2. Phone OTP → 3. ID Upload (IDVerse OCR + Home Affairs) → 4. License (eNaTIS) → 5. Selfie + Liveness (blink/turn/smile + AWS Rekognition) → 6. Address (bank statement/utility) → 7. Payment method (Yoco tokenization) → 8. Trust Score init

## Biometric Step-Up for Sensitive Actions
- Check-in: Selfie verification
- Extending booking: Face biometric
- Filing claim: Biometric + ID re-check
- Changing payout: Biometric + OTP
- Adding payment method: OTP only

## Fraud Prevention
| Threat | Detection | Prevention |
|--------|-----------|------------|
| Fake ID | IDVerse document auth | Auto-reject |
| Deepfake | Active liveness (3 challenges) | Block enrollment |
| SIM swap | Telco API check | Re-verify |
| Synthetic ID | Cross-reference ID + license + bank | Fail mismatch |
| Account takeover | Device fingerprint + login pattern | Step-up auth |

## Data Retention
- ID documents: 5 years post-last transaction → secure delete
- Biometric templates: Account duration + 90 days
- Liveness videos: Deleted within 5 minutes after scoring
- Selfie (verification): 48 hours → delete after match