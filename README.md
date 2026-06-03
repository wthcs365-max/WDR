# WTH Drive Rentals (WDR)

The infrastructure layer for flexible mobility in South Africa.

## Architecture

WDR uses a **microservice architecture** with the following services:

| Service | Port | Description |
|---------|------|-------------|
| **IAM Service** | 4001 | Identity & Access Management (auth, users, KYC) |
| **Fleet Service** | 4002 | Vehicle inventory, telematics devices |
| Booking Service | 4003 | Reservations & trip management |
| Ledger Service | 4004 | Payments, wallets, commissions |
| Trust Service | 4005 | Trust scoring, deposits, claims |

## Tech Stack

- **Runtime:** Node.js + TypeScript (Express)
- **Database:** PostgreSQL 15+ (Prisma ORM)
- **Cache:** Redis
- **Auth:** JWT (JSON Web Tokens)
- **Pattern:** REST APIs per microservice

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Redis (or Docker)

### Install & Run

```bash
# Install dependencies (from repo root)
npm install

# Generate Prisma client
npm run db:generate -w packages/database

# Run IAM service
npm run dev:iam

# Run Fleet service (in another terminal)
npm run dev:fleet
```

### Using Docker

```bash
docker compose up -d
```

## API Endpoints

### IAM Service (`:4001`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/register` | No | Register new user |
| POST | `/v1/auth/login` | No | Login |
| POST | `/v1/auth/refresh` | No | Refresh JWT |
| GET | `/v1/users/me` | Yes | Get profile |
| PATCH | `/v1/users/me` | Yes | Update profile |
| GET | `/v1/users/me/kyc` | Yes | List KYC docs |
| POST | `/v1/users/me/kyc` | Yes | Upload KYC |
| GET | `/v1/users/me/payment-methods` | Yes | List payment methods |
| POST | `/v1/users/me/payment-methods` | Yes | Add payment method |

### Fleet Service (`:4002`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/vehicles` | Optional | Search vehicles |
| GET | `/v1/vehicles/:id` | Optional | Get vehicle details |
| POST | `/v1/vehicles` | Yes | Create listing |
| PATCH | `/v1/vehicles/:id` | Yes | Update listing |
| DELETE | `/v1/vehicles/:id` | Yes | Remove listing |
| GET | `/v1/vehicles/:id/availability` | No | Availability calendar |
| GET | `/v1/owner/vehicles` | Yes | My listings |
| GET | `/v1/vehicles/makes` | No | List makes |
| GET | `/v1/vehicles/makes/:id/models` | No | List models |
| POST | `/v1/devices` | Yes | Register telematics device |
| GET | `/v1/devices/:vehicleId` | No | Get device info |

## Database Schema

The full PostgreSQL schema is defined in `packages/database/prisma/schema.prisma`, covering 8 domains:

- **iam** — Users, KYC, biometrics, addresses, payment methods
- **fleet** — Vehicles, makes/models, availability, telematics devices
- **booking** — Reservations, check-in/out, insurance, extensions
- **trust** — Trust scores, deposits, waivers, claims
- **ledger** — Wallets, transactions, commissions, invoices
- **subs** — Subscription plans, VaaS subscriptions, billing cycles
- **telemetry** — Real-time GPS, OBD-II events, trip segments
- **events** — Domain event store for async processing