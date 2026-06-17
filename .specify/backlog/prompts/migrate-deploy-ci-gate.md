# Prompt: CI gate — prove the migration chain applies on an empty Postgres

**Use when:** hardening the migration flow so broken ordering or bad DB-free-authored migrations are caught on PRs, before they reach Production.

## Context

Migrations authored in a sandbox via `prisma migrate diff` (see **migration-deploy-flow**) get **no shadow-DB validation** — a bad migration only surfaces at `migrate deploy` on Production, which is the worst place to find it (`build-with-env.ts` fails the prod build). The repo's own `docs/PRISMA_MIGRATE_STRATEGY.md` recommends a CI gate: spin up an empty Postgres on each PR and run `migrate deploy`, failing if it doesn't complete. This also surfaces the legacy "chain can't build from empty" gaps the strategy doc warns about (the eventual Path B squash).

## Prompt text

> Add a CI job (GitHub Actions) that, on every PR touching `prisma/**`, spins up an **empty Postgres** service container, points `DATABASE_URL`/`DIRECT_URL` at it, runs `npx prisma migrate deploy`, and fails if any migration fails to apply. Keep it fast (cache, only run on `prisma/**` changes). Optionally also assert `prisma migrate status` is clean and `prisma generate` succeeds. Document the gate in `docs/PRISMA_MIGRATE_STRATEGY.md` (replaces the "CI gate (recommended)" row with "implemented"). If the chain currently fails from empty (legacy `db push` gaps), capture that as a finding and link the **Path B squash baseline** as the follow-up rather than forcing it here.

## Reference

- `docs/PRISMA_MIGRATE_STRATEGY.md` § "CI gate (recommended)" and § "Path B — Squashed baseline"
- `.github/workflows/frontend-check.yml` (existing CI; `prisma validate` already runs there)
- Related: **migration-deploy-flow**
