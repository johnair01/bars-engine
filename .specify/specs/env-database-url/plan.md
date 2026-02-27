# Plan: Resolve DATABASE_URL PrismaClientInitializationError

## Summary
The runtime error `Environment variable not found: DATABASE_URL` occurs because Prisma requires `DATABASE_URL` at client initialization. The schema uses PostgreSQL only. Fix: document and provide a template so developers set `DATABASE_URL` before running the app.

## Changes Made
1. **`.env.example`** — Added with `DATABASE_URL` placeholder (Postgres URL) and optional dev vars. Developers copy to `.env` and set a real connection string.
2. **`README.md`** — Prerequisites updated to PostgreSQL; env section updated to reference `.env.example` and `DATABASE_URL` for Postgres.
3. **`RUNBOOK.md`** — Prerequisites updated to a single Postgres `DATABASE_URL` and reference to `.env.example`.

## Resolution for the User
- **Create `.env`** from the example: `cp .env.example .env`
- **Set `DATABASE_URL`** to a valid PostgreSQL connection string, e.g.:
  - Local Postgres: `postgresql://user:password@localhost:5432/bars_engine`
  - Or use a free hosted Postgres (e.g. Neon, Vercel Postgres, Railway), then run `npm run db:push` and `npm run db:seed`.
- Restart the dev server (`npm run dev`).
