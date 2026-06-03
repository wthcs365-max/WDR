# WTH Drive Rentals — API Architecture

## Design: REST for CRUD, GraphQL for Frontend, WebSockets for Real-time

**Base URL:** `https://api.wthdrive.co.za/v1`
**Auth:** Bearer JWT + X-Idempotency-Key for mutations

## REST Endpoints

### Auth & Users
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (JWT + refresh) |
| POST | `/auth/biometric/register` | Register biometric |
| GET | `/users/me` | Get profile |
| POST | `/users/me/kyc` | Upload KYC document |
| GET | `/users/me/trust-score` | Trust score breakdown |

### Vehicles
| Method | Path | Description |
|--------|------|-------------|
| GET | `/vehicles?lat=&lng=&radius_km=&start_date=&end_date=&...` | Search with geo/filters |
| GET | `/vehicles/{id}` | Vehicle details |
| POST | `/vehicles` | List a vehicle |
| GET | `/owner/vehicles` | My listings |

### Bookings
| Method | Path | Description |
|--------|------|-------------|
| POST | `/bookings/quote` | Price quote (no commitment) |
| POST | `/bookings` | Create booking |
| POST | `/bookings/{id}/cancel` | Cancel |
| POST | `/bookings/{id}/checkin` | Digital check-in |
| POST | `/bookings/{id}/checkout` | Return vehicle |
| GET | `/renter/bookings` | My bookings |
| GET | `/owner/bookings` | Bookings on my vehicles |

### Deposits, Trust & Claims
| Method | Path | Description |
|--------|------|-------------|
| POST | `/bookings/{id}/deposit/waive` | Request deposit waiver |
| POST | `/claims` | File a claim |
| GET | `/trust/score` | Trust score detail |
| GET | `/trust/score/history` | Score event history |

### Payments & Wallet
| Method | Path | Description |
|--------|------|-------------|
| GET | `/wallet` | Balance |
| GET | `/wallet/transactions` | History |
| GET | `/invoices` | Invoice listing |

### Subscriptions & VaaS
| Method | Path | Description |
|--------|------|-------------|
| GET | `/subscriptions/plans` | Available plans |
| POST | `/subscriptions` | Subscribe |
| POST | `/subscriptions/{id}/cancel` | Cancel |

## GraphQL (Frontend)
**Endpoint:** `https://api.wthdrive.co.za/graphql`

Root types: `Query { vehicleSearch, vehicle, booking, me, myTrustScore, myWallet, subscriptionPlans }`, `Mutation { register, login, createBooking, checkIn, fileClaim, subscribe }`, `Subscription { vehicleTracking, bookingUpdates, notifications }`

## WebSocket
**Endpoint:** `wss://api.wthdrive.co.za/ws`
Channels: `tracking:{booking_id}`, `booking:{booking_id}`, `notifications:{user_id}`, `geofence:{vehicle_id}`

## Rate Limiting: Anonymous 30/min, Authenticated 120/min, Admin 300/min, Partner API 1000/min