# Prompt: Production Database Divergence — Demo Readiness

**Use this prompt when production login/signup fails while local dev has data, or when you need to ensure admin@admin.local exists in production.**

## Context

- Production (Vercel) cannot log in or sign up; local dev has data.
- Canonical demo admin: `admin@admin.local` / `password` (from seed), not `admin@bars-engine.local`.
- Root cause: prod and local use different databases, or prod DB was never seeded.

## Task

Implement the spec in [.specify/specs/production-database-divergence/spec.md](../specs/production-database-divergence/spec.md):

1. **Create `scripts/verify-production-db.ts`**
   - Load env; connect to DB; report accounts/players/roles counts and whether `admin@admin.local` exists with admin role.
   - Redact DATABASE_URL host when printing.
   - Exit 0 if admin OK; 1 otherwise.

2. **Create `scripts/ensure-admin-local.ts`**
   - Create/update `admin@admin.local` with password `password` and admin role.
   - Idempotent. Reuse logic from seed-utils step 7.

3. **Update `docs/ENV_AND_VERCEL.md`**
   - Add "Production demo readiness" runbook.
   - Document Vercel env scope (Production vs Preview vs Development).
   - Reference `admin@admin.local` and `ensure-admin-local`.

4. **Add npm scripts** (optional): `verify:prod-db`, `ensure:admin-local`

## Verification

- `DATABASE_URL="<prod>" npx tsx scripts/verify-production-db.ts` — reports DB state.
- `DATABASE_URL="<prod>" npx tsx scripts/ensure-admin-local.ts` — creates admin.
- Log in at prod `/conclave` with `admin@admin.local` / `password`; access `/admin`.
