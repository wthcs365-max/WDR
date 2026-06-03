# WTH Drive Rentals — Technical Architecture

## Strategic Positioning
Convergence of **Turo** (P2P marketplace), **Shopify** (vertical SaaS for dealers), **Discovery Insure** (telematics risk scoring).

## High-Level Architecture
```
CLIENT: React Native (Mobile) + React/Next.js (Web)
    → API Gateway: Kong/Traefik (JWT, Rate Limit, Route)
        → MICROSERVICES (Node.js/TS + Go):
            auth-service → iam-service → kyc-service
            vehicle-service → fleet-service → booking-service
            payment-service → trust-service → telemetry-service
            subscription-service → notification-service → analytics-service
        → DATA:
            PostgreSQL 15 (Primary OLTP) + TimescaleDB (Telemetry)
            Redis Cluster (Cache + Streams + Queues)
            Elasticsearch (Search + Logs)
            Object Storage (S3/MinIO for photos/docs)
        → MESSAGING: NATS / Redis Streams
        → OBSERVABILITY: OpenTelemetry → Grafana + Loki + Tempo
```

## Microservices (13)
| Service | Port | Purpose |
|---------|------|---------|
| auth-service | 4000 | JWT, OTP, biometric auth |
| iam-service | 4001 | Users, profiles, roles |
| kyc-service | 4001-ext | KYC documents, verification |
| vehicle-service | 4002 | Vehicle CRUD, search |
| fleet-service | 4002-ext | Fleet management, pricing |
| booking-service | 4003 | Reservations, check-in/out |
| payment-service | 4004 | Wallet, ledger, invoices |
| trust-service | 4005 | Scoring engine, waivers, claims |
| telemetry-service | 4006 | GPS ingestion, trip segments |
| subscription-service | 4007 | VaaS plans, billing cycles |
| notification-service | 4008 | Push, email, SMS |
| analytics-service | 4009 | Dashboards, reporting |
| partner-service | 4010 | Dealer exchange, 3rd party API |

## Modular Fintech/Insurance Integration
```
Integration Hub:
    Insurance Connector → Policy issuance, Claims filing, Premium billing
    Embedded Finance Connector → Loan origination, Credit assessment, Repayment tracking
    Open Banking Connector → Account verification, Transaction history

Connector SDK Pattern:
    authenticate() → createPolicy() → fileClaim() → checkStatus() → webhookHandler()
```

## Identity & Verification Flow
1. Register (Email + Password + Phone)
2. Phone OTP → Email verification
3. ID Document → OCR + Home Affairs check
4. Driver's License → eNaTIS validation
5. Selfie → Liveness check → Face match vs ID photo
6. Proof of Address → Bank statement verification
7. Payment Method → Card tokenization (Yoco/Peach)
8. **Trust Score Initialization** (~525 Silver)

## Deployment
- **EKS Kubernetes** — Multi-AZ (JHB primary, CPT failover)
- **CI/CD** — GitHub Actions + ArgoCD (GitOps)
- **Environments** — dev → staging → canary → production
- **DR** — AZ failure: 5min RTO, Region failure: 30min RTO
- **Security** — mTLS service mesh, SPIFFE identities, OPA policies