# Tasks: Production Database Divergence

## Phase 1: Diagnosis

- [ ] **T1** Create `scripts/verify-production-db.ts`
  - Load env via require-db-env or dotenv (.env.local, .env)
  - Accept optional `--url` or use DATABASE_URL from env
  - Connect, run: `SELECT COUNT(*) FROM accounts`, `FROM players`, `FROM roles`
  - Check if account with email `admin@admin.local` exists and has admin role
  - Redact host when printing (e.g. `postgresql://***@db.example.com:5432/db`)
  - Exit 0 if admin exists with role; 1 otherwise
  - Print summary: host (redacted), counts, admin status

- [ ] **T2** Add npm script `verify:prod-db` in package.json (optional)

## Phase 2: Ensure Admin

- [ ] **T3** Create `scripts/ensure-admin-local.ts`
  - Import require-db-env
  - Email: `admin@admin.local`, password: `password` (bcrypt hash)
  - Upsert Account, Player (id: `test-admin`), StarterPack, PlayerRole (admin)
  - Reuse logic from seed-utils step 7; ensure nationId/archetypeId if required by schema
  - Idempotent: safe to run multiple times
  - Print success message with credentials

- [ ] **T4** Add npm script `ensure:admin-local` in package.json (optional)

## Phase 3: Documentation

- [ ] **T5** Update `docs/ENV_AND_VERCEL.md`
  - Add "Production vs local: which database?" — explain Vercel env scope (Production, Preview, Development)
  - Add "Production demo readiness" runbook:
    1. Get prod DATABASE_URL from Vercel Dashboard (Production)
    2. Run `DATABASE_URL="<prod>" npm run verify:prod-db` (or npx tsx scripts/verify-production-db.ts)
    3. If admin missing or DB empty: `DATABASE_URL="<prod>" npm run db:seed`
    4. Run `DATABASE_URL="<prod>" npm run ensure:admin-local` (or npx tsx scripts/ensure-admin-local.ts)
    5. Optional: create invite for signup flows
    6. Verify: log in at prod `/conclave` with `admin@admin.local` / `password`

- [ ] **T6** Update production recovery section to mention `admin@admin.local` and `ensure-admin-local`
