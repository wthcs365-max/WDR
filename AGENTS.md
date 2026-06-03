# WTH Drive Rentals — Agent Guide

## Architecture Overview
- **Monorepo** structure with npm workspaces
- `packages/` — Shared libraries (types, database, auth middleware)
- `services/` — Microservices (iam-service, fleet-service, booking-service, etc.)
- Each service is a standalone Express + TypeScript application
- PostgreSQL via Prisma ORM — schema in `packages/database/prisma/schema.prisma`
- All services listen on `0.0.0.0` for containerized deployment

## Service Ports
| Service       | Port |
|--------------|------|
| IAM Service  | 4001 |
| Fleet Service| 4002 |
| Booking      | 4003 |
| Ledger       | 4004 |
| Trust        | 4005 |

## Code Standards
- Use `async/await` — no raw promises/callbacks
- Export route handlers as `Router` from each service's `routes/`
- Validation with `zod` on all inputs
- Standard error response: `{ error: { code: string, message: string, details?: any } }`
- Standard success: `{ data: {...}, meta?: {...} }`

## Service Bootstrap Pattern
```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import { router } from './routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/v1', router);

const PORT = process.env.PORT || 4001;
app.listen(PORT, '0.0.0.0', () => console.log(`Service running on port ${PORT}`));
```