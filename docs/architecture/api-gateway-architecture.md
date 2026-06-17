# WTH Drive Rentals — Public API Gateway Architecture

**Version:** 1.0  
**Owner:** Architect  
**Status:** Draft for Review  

---

## 1. Executive Summary

The API Gateway is the single public entry point for all client interactions with the WDR microservices ecosystem. It provides cross-cutting concerns — authentication, authorization, rate limiting, routing, caching, request/response transformation — while offloading these from individual services.

**Recommended approach: Hybrid** — Kong API Gateway (edge router + security) + Apollo Federation GraphQL Gateway (unified frontend schema).

---

## 2. Architecture Overview

```
CLIENTS: Mobile App │ Web App │ Partners
    │
    ▼
KONG API GATEWAY (Edge Router)
  ┌─────────────────────────────────────┐
  │ Plugins: JWT Auth, Rate Limit, CORS │
  │ IP Restriction, Prometheus Metrics  │
  │ Request/Response Transforms         │
  └─────┬──────────┬──────────┬─────────┘
        │          │          │
  ┌─────┴────┐ ┌───┴────┐ ┌──┴──────┐
  │ REST     │ │GraphQL  │ │WebSocket│
  │/api/v1/* │ │/graphql │ │ /ws/*   │
  └────┬─────┘ └───┬─────┘ └────┬────┘
       │           │            │
       ▼           ▼            ▼
  ┌────────────────────────────────────────┐
  │        MICROSERVICES (10)              │
  │ auth:4000 │ iam:4001 │ fleet:4002     │
  │ booking:4003 │ ledger:4004 │ trust:4005│
  │ telemetry:4006 │ subscription:4007    │
  │ notification:4008 │ partner:4010       │
  └────────────────────────────────────────┘
```

---

## 3. Route Configuration (Kong)

| Kong Route | Upstream Service | Auth | Notes |
|------------|-----------------|------|-------|
| `/api/v1/auth/*` | auth:4000 | Public (register); JWT (others) | |
| `/api/v1/users/*` | iam:4001 | JWT | Profiles, KYC |
| `/api/v1/vehicles/*` | fleet:4002 | Optional (search); JWT (CRUD) | |
| `/api/v1/bookings/*` | booking:4003 | JWT | Booking lifecycle |
| `/api/v1/wallet/*` | ledger:4004 | JWT | |
| `/api/v1/payments/*` | ledger:4004 | JWT | |
| `/api/v1/invoices/*` | ledger:4004 | JWT | |
| `/api/v1/trust/*` | trust:4005 | JWT | Scores, waivers |
| `/api/v1/claims/*` | trust:4005 | JWT | |
| `/api/v1/telemetry/*` | telemetry:4006 | API Key (devices); JWT (users) | |
| `/api/v1/subscriptions/*` | subscription:4007 | JWT | VaaS |
| `/api/v1/admin/*` | iam:4001 | JWT (admin role) | |
| `/api/v1/partner/*` | partner:4010 | API Key | |
| `/graphql` | graphql-gateway:4050 | JWT (optional) | Apollo Federation |
| `/ws/*` | telemetry:4006 | JWT (query param) | Real-time |
| `/webhooks/*` | ledger:4004 | Signature verify | Stripe, Yoco |

---

## 4. Apollo Federation (GraphQL Gateway)

**Why Federation over single GraphQL server:** Decentralized schema ownership, independent deployments, no single point of failure, type reuse across services.

**Subgraphs:** auth, iam, fleet, booking, ledger, trust, telemetry, subscription, notification

**Supergraph composition:** Gateway fetches subgraph schemas at startup, composes into unified schema. Query planner distributes queries to appropriate subgraphs and aggregates responses.

**Example cross-service query:**
```graphql
query BookingDetails {
  booking(id: "bkg_123") {
    renter { name trustScore { tier } }
    vehicle { make model dailyRate }
    insurance { policyNumber provider }
  }
}
```

---

## 5. Authentication & Authorization Flow

```
Client → POST /api/v1/auth/login {email, password}
  → Kong routes to auth:4000 → Validates → Returns JWT (1h) + Refresh (7d)
  
Client → GET /api/v1/bookings (Authorization: Bearer <JWT>)
  → Kong JWT plugin verifies: signature, exp, nbf
  → Kong injects headers: X-Consumer-ID, X-Consumer-Role, X-Consumer-Trust-Tier
  → Routes to booking:4003
  
Client ← 401 if JWT missing/expired
Client ← 403 if insufficient role permissions
```

### JWT Structure:
```json
{ "sub": "user-uuid", "role": "renter", "trust_tier": "gold",
  "permissions": ["bookings:read","bookings:write"],
  "iat": 1717200000, "exp": 1717203600 }
```

### Role Access Matrix:
| Endpoint Group | renter | owner | dealer | fleet_mgr | admin |
|---------------|--------|-------|--------|-----------|-------|
| auth/* | ✅ | ✅ | ✅ | ✅ | ✅ |
| users/me | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicles (GET) | ✅ | ✅ | ✅ | ✅ | ✅ |
| vehicles (POST) | ❌ | ✅ | ✅ | ✅ | ✅ |
| bookings (own) | ✅ | ✅ | ✅ | ✅ | ✅ (all) |
| wallet/* | ✅ | ✅ | ✅ | ✅ | ✅ |
| admin/* | ❌ | ❌ | ❌ | ❌ | ✅ |
| partner/* | ❌ | ❌ | ✅ | ❌ | ✅ |

---

## 6. Rate Limiting Tiers

| Tier | Requests/min | Routes |
|------|-------------|--------|
| Anonymous | 30 | Vehicle search, auth register |
| Authenticated | 120 | Most user endpoints |
| Dealer | 300 | Inventory management |
| Admin | 600 | Admin endpoints |
| Partner API | 1000 | Partner endpoints |
| Device Telemetry | 3600/device | Telemetry ingestion |

---

## 7. Security

- **Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, `CSP`
- **IP allowlisting**: Admin (office VPN), Webhooks (payment provider IPs)
- **Body size limit**: 10MB; Query string: 2048 chars
- **Internal header stripping**: Prevents `X-Internal-*` injection
- **TLS**: All gateway traffic over HTTPS; upstream mTLS via service mesh

---

## 8. Caching

| Route | TTL | Notes |
|-------|-----|-------|
| GET /vehicles (search) | 30s | Freshness-critical |
| GET /vehicles/{id} | 60s | |
| GET /vehicles/makes | 1h | Static |
| GET /analytics | 5min | Dashboards |
| GraphQL | No edge cache | APQ for repeated queries |

---

## 9. Error Responses

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Retry in 30s.",
    "details": { "retry_after_seconds": 30 }
  },
  "meta": { "request_id": "req_a1b2c3" }
}
```

**Status codes**: 200 (OK), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 422 (validation), 429 (rate limited), 500 (internal), 502 (bad gateway), 503 (unavailable)

---

## 10. Deployment

- **Kong**: 3 replicas, DB-less mode with declarative YAML config, auto-scaled at 70% CPU
- **Apollo Gateway**: 3 replicas, 500 rps/pod target, auto-scaled
- **Observability**: OpenTelemetry → Prometheus → Grafana; distributed tracing via Jaeger/Tempo
- **Service Mesh (future)**: Move to Istio for mTLS, traffic management, fine-grained auth

---

*See also: Technical Architecture (`technical-architecture.md`), API Architecture (`database/api-architecture.md`), Auth Middleware (`packages/auth-middleware/src/index.ts`)*