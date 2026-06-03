# WTH Drive Rentals — Database Schema

## Overview
This directory contains the complete database schema, migration scripts, and documentation for the WTH Drive Rentals (WDR) platform. The schema is designed for PostgreSQL (primary OLTP) with Redis for caching and real-time telematics processing.

## Architecture Principles
1. **Modularity** — Each business domain has its own schema namespace for future service decomposition
2. **Auditability** — All financial and trust-related tables include immutable ledger entries
3. **Scalability** — Telematics and event data are designed for time-series partitioning
4. **Extensibility** — JSONB fields for flexible metadata without schema locks

## Schema Domains
| Domain | Schema | Description |
|--------|--------|-------------|
| Identity | `iam` | Users, drivers, KYC, biometrics, roles |
| Inventory | `fleet` | Vehicles, owners, telematics devices, pricing |
| Booking | `booking` | Reservations, trips, check-in/out, insurance |
| Trust | `trust` | Trust scores, deposit waivers, claims |
| Finance | `ledger` | Payments, commissions, invoice, settlements |
| Subscription | `subs` | VaaS plans, memberships, billing cycles |
| Telematics | `telemetry` | GPS, accelerometer, OBD-II data streams |
| Events | `events` | Domain events for async processing |

## Files
- `schema.sql` — Full DDL with all tables, constraints, and indices
- `schema-er-diagram.md` — Entity-Relationship descriptions
- `redis-schema.md` — Redis key patterns and caching strategy
- `api-architecture.md` — REST + GraphQL API design specification