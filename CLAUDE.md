# WTH Drive Rentals — CLAUDE.md

## Project Structure
```
wdr/
├── packages/
│   ├── shared-types/     — TypeScript types for all domains
│   ├── database/         — Prisma schema & migrations
│   └── auth-middleware/  — JWT verification middleware
├── services/
│   ├── iam-service/      — Identity & Access Management
│   └── fleet-service/    — Vehicle inventory & telematics
├── docker-compose.yml    — Local development stack
└── README.md
```

## Getting Started
1. `npm install` (from root)
2. `npm run dev:iam` — Start IAM service on :4001
3. `npm run dev:fleet` — Start Fleet service on :4002

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret
- `PORT` — Service port (default per service)
- `REDIS_URL` — Redis connection (optional)