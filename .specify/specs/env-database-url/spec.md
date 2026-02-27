# Spec: DATABASE_URL Required for Runtime

## Objective
Resolve `PrismaClientInitializationError: Environment variable not found: DATABASE_URL` on the front page (and any route that uses the database).

## Requirements
- **Cause**: Prisma schema requires `DATABASE_URL` (PostgreSQL). If it is unset, Prisma client initialization fails when any server code imports `db` and runs a query (e.g. layout's `getCurrentPlayerSafe`, or dev tools' `getAllPlayers`).
- **Surfaces**: All server-rendered pages that touch the DB (home, layout, dev, admin, etc.).
- **Mechanics**: Provide a clear path for local dev to set `DATABASE_URL`. Do not commit secrets; do document required env and optional vars.
- **Verification**: With a valid `DATABASE_URL` in `.env`, the app starts and the front page loads without PrismaClientInitializationError.

## Deliverables
- [x] `.env.example` with `DATABASE_URL` and other common local vars (no real secrets).
- [x] README or env doc updated to reference `.env.example` and state that PostgreSQL is required for local run.
- [x] (Optional) Note in docs/dev-notes or RUNBOOK about Guest Mode when DB is unreachable.
