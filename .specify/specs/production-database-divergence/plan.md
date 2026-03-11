# Plan: Production Database Divergence — Demo Readiness

## Summary

Production cannot log in or sign up; local dev has data. Root cause: production and local use different databases, or production DB was never seeded. Canonical demo admin is `admin@admin.local` (from seed), not `admin@bars-engine.local`.

## Approach

1. **Diagnose**: Add `verify-production-db.ts` to report which DB is reached and whether admin/seed data exists.
2. **Ensure admin**: Add `ensure-admin-local.ts` to create/update `admin@admin.local` with admin role (idempotent).
3. **Document**: Update ENV_AND_VERCEL.md with prod vs dev comparison and demo readiness runbook.

## Implementation Order

1. Create `scripts/verify-production-db.ts`
2. Create `scripts/ensure-admin-local.ts`
3. Update `docs/ENV_AND_VERCEL.md` — add "Production demo readiness" section and Vercel env scope notes
4. Add npm scripts: `verify:prod-db`, `ensure:admin-local` (optional, for convenience)

## Key Files

- [src/lib/seed-utils.ts](src/lib/seed-utils.ts) — admin@admin.local creation logic (step 7)
- [scripts/require-db-env.ts](scripts/require-db-env.ts) — env loading for scripts
- [docs/ENV_AND_VERCEL.md](docs/ENV_AND_VERCEL.md) — env and recovery docs
