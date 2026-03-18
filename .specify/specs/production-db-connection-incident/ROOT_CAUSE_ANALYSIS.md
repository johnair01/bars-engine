# Root Cause Analysis: Production DB Connection / Login Failure

**Symptom**: Production deploy cannot connect to the database; players cannot log in.

**Scope**: Last 24 hours of changes; production Vercel deployment.

---

## 1. Recent Changes (Last 24 Hours)

| Commit | Date | Change |
|--------|------|--------|
| 23660fd | Recent | Agent workflows (ensureBackendReady, MCP) — no DB impact |
| f5ccd12 | Recent | Wire ensureBackendReady into sage scripts — no DB impact |
| 64be771 | Recent | Agent-workflows-cursor spec + backend-health — no DB impact |
| eca6283 | Mar 16 | **Harden db-sync warnings + migration discipline** — db-sync.ts, fail-fix-workflow.mdc, admin/maps/editor try/catch |
| 4c147c6 | Mar 16 | **Add migration for birthday onboarding + spatial world** — new migration `20260316000000_add_birthday_onboarding_and_spatial_world` |
| e2d2cab | Mar 16 | Spatial World system (SW-1 through SW-7) |
| c3a2579 | Mar 16 | Birthday Onboarding system (BO-1 through BO-6) |

**Key finding**: Commit eca6283 explicitly states: *"Prevents repeat of the production 500-error incident caused by db push without migration files."* — A prior production incident already occurred.

---

## 2. Hypotheses (Ranked by Likelihood)

### H1: Migration failure during Vercel build (HIGH)

**Mechanism**: `npm run build` runs `prisma migrate deploy`. If the migration fails (e.g. P3009, P3018, partial apply), the build script falls back to `prisma generate && next build` (see `scripts/build-with-env.ts`). The app is deployed **without** migrations applied. At runtime, Prisma client expects the new schema (e.g. `sprite_url`, `spatial_map_anchors`) but production DB has old schema → connection or query errors.

**Evidence**: build-with-env.ts catches migrate deploy failure and continues with generate + next build. No rollback or explicit failure.

### H2: DATABASE_URL not set or wrong scope in Vercel (MEDIUM)

**Mechanism**: Vercel env vars are scoped (Production, Preview, Development). If `DATABASE_URL` was removed, rotated, or scoped to wrong environment, production runtime gets no URL. `src/lib/db.ts` uses `resolveDatabaseUrl()` which checks PRISMA_DATABASE_URL, POSTGRES_PRISMA_URL, DATABASE_URL, POSTGRES_URL. If all are missing, Prisma falls back to schema default `env("DATABASE_URL")` → runtime error.

**Evidence**: docs/ENV_AND_VERCEL.md: "If production cannot log in or sign up while local dev has data, production and local are likely using different databases."

### H3: Schema mismatch (schema changed, migrations not applied) (HIGH)

**Mechanism**: Migration `20260316000000_add_birthday_onboarding_and_spatial_world` adds columns and tables. If it was never applied to production (e.g. build failed migrate, or deploy used cached build), Prisma client expects `players.sprite_url`, `spatial_map_anchors`, etc. Production DB lacks them. First query that touches new schema fails.

**Evidence**: diagnose-prod-db.ts exists specifically for this. Prior incident (eca6283) was "db push without migration files."

### H4: Connection pooler / SSL / Neon/Supabase config (LOWER)

**Mechanism**: Some providers require `?sslmode=require` or pooler-specific URLs. If connection string format changed or provider had outage, connection fails.

### H5: Prisma Accelerate / extension mismatch (LOWER)

**Mechanism**: `src/lib/db.ts` uses `withAccelerate()` when URL is `prisma+postgres://`. If Accelerate proxy has issues or URL was changed, connections fail.

---

## 3. Diagnostic Steps (Run First)

Before applying fixes, run:

```bash
# 1. Diagnose production DB (read-only)
DATABASE_URL="<prod-url-from-vercel-dashboard>" npm run diagnose:prod-db

# 2. Verify production DB state
DATABASE_URL="<prod-url>" npm run verify:prod-db

# 3. Test connectivity
DATABASE_URL="<prod-url>" npm run smoke
```

**Interpretation**:
- If diagnose shows "Schema mismatch" or "playbookId vs archetypeId" → H3
- If diagnose fails at "Database unreachable" → H2 or H4
- If migrations list shows failed or missing → H1

---

## 4. Immediate Remediation (If H1/H3)

1. **Apply migrations manually**:
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   ```

2. **If migration fails with "relation already exists"** (P3018):
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate resolve --applied 20260316000000_add_birthday_onboarding_and_spatial_world
   ```

3. **Redeploy** on Vercel (or push empty commit to trigger deploy).

---

## 5. References

- [docs/ENV_AND_VERCEL.md](../../../docs/ENV_AND_VERCEL.md) — env setup, diagnose, P3009/P3018
- [scripts/diagnose-prod-db.ts](../../../scripts/diagnose-prod-db.ts) — read-only diagnostic
- [scripts/build-with-env.ts](../../../scripts/build-with-env.ts) — build + migrate flow
