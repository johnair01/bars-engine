# Dev Setup Incidents — Lessons Learned

This document captures emergent issues encountered during developer setup and loop readiness. Use it to debug and to avoid repeating the same mistakes.

**Format:** Symptom | Root Cause | Fix | Doc Update

---

## 0. Home page 500 — "The table public.players does not exist"

**Symptom:** `GET /` returns 500. Terminal shows:
```
The table `public.players` does not exist in the current database.
The table `public.app_config` does not exist in the current database.
```

**Root Cause:** Database has no tables — migrations were never applied, or the app is using a different/empty database. Common when using Prisma Accelerate with a fresh DB, or when switching between local/prod URLs.

**First step:** Run `npm run diagnose:db` to see which URL the app uses (PRISMA_DATABASE_URL, DATABASE_URL, etc.) and whether that database has tables.

**Fix:**
1. Run `npm run setup` (migrate deploy → seeds → loop:ready:quick)
2. Or manually: `npx tsx scripts/with-env.ts "prisma migrate deploy"` then `npm run db:seed`
3. If you have a stale session cookie, use "Clear session and return home" on the Setup Required page

**Doc Update:** Home page now catches P2021 (table does not exist) and renders SetupRequired with instructions instead of 500. See `src/components/SetupRequired.tsx`.

---

## 1. db:sync fails with "drop column adventureType" data-loss warning

**Symptom:** `npm run db:sync` fails with:
```
⚠️  There might be data loss when applying the changes:
  • You are about to drop the column `adventureType` on the `adventures` table...
Error: Use the --accept-data-loss flag to ignore the data loss warnings
```

**Root Cause:** Schema was updated to remove `adventureType` from the Adventure model, but the database still had the column. `prisma db push` refuses to drop columns with data when it would cause data loss.

**Fix:**
1. Create a migration that explicitly drops the column: `prisma/migrations/YYYYMMDD_drop_adventure_type/migration.sql`
2. Use `ALTER TABLE "adventures" DROP COLUMN IF EXISTS "adventureType"`
3. Run `npx tsx scripts/with-env.ts "prisma migrate deploy"` to apply

**Doc Update:** Document in DB_STRATEGY: when schema removes a column, create a migration instead of relying on db push.

**Reference:** bruised-banana-residency-ship spec, migration 20260314000000_drop_adventure_type

---

## 2. P3009: migrate found failed migrations in the target database

**Symptom:** `prisma migrate deploy` fails with:
```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20260311000000_add_spec_kit_backlog` migration... failed
```

**Root Cause:** A migration was marked as "failed" in `_prisma_migrations` (e.g. it started but errored, or was manually interrupted). Prisma blocks new migrations until the failed one is resolved.

**Fix:**
1. Check if the migration's goal was achieved (e.g. does `spec_kit_backlog_items` table exist?):
   ```bash
   npx tsx scripts/with-env.ts "node -e \"
   const { PrismaClient } = require('@prisma/client');
   const p = new PrismaClient();
   p.\$queryRaw\`SELECT 1 FROM spec_kit_backlog_items LIMIT 1\`
     .then(() => { console.log('EXISTS'); p.\$disconnect(); })
     .catch(() => { console.log('MISSING'); p.\$disconnect(); });
   \""
   ```
2. If table **exists**: `npx tsx scripts/with-env.ts "prisma migrate resolve --applied 20260311000000_add_spec_kit_backlog"`
3. If table **missing**: `npx tsx scripts/with-env.ts "prisma migrate resolve --rolled-back 20260311000000_add_spec_kit_backlog"` then `prisma migrate deploy`
4. Replace migration name with the actual failed migration from the error.

**Doc Update:** ENV_AND_VERCEL.md has this; ensure it's discoverable from onboarding.

**Reference:** docs/ENV_AND_VERCEL.md § Troubleshooting

---

## 3. loop:ready fails "Missing quest: orientation-quest-1"

**Symptom:** `npm run loop:ready:quick` fails with:
```
Core quest configuration intact | FAIL | Missing quest: orientation-quest-1
```

**Root Cause:** Base seeds were not run. The `orientation-quest-1` and `system-feedback` quests are created by `npm run db:seed` (seed-utils). Pre-launch seeds (party, quest-map, onboarding, cert:cyoa) add campaign structure; db:seed creates the core loop quests.

**Fix:**
```bash
npm run db:seed
```
For full Bruised Banana setup, also run (in order):
```bash
npm run seed:party
npm run seed:quest-map
npm run seed:onboarding
npm run seed:cert:cyoa
```

**Doc Update:** LOOP_READINESS_CHECKLIST has Pre-Launch Seeds; add remediation hint to loop:ready output.

**Reference:** docs/LOOP_READINESS_CHECKLIST.md

---

## 4. loop:ready / test:feedback-cap fails "column agentMetadata does not exist"

**Symptom:** `npm run test:feedback-cap` or loop:ready fails with:
```
The column `custom_bars.agentMetadata` does not exist in the current database.
```

**Root Cause:** Schema has been updated (new column added) but the database has not been migrated. Prisma client expects the column; DB doesn't have it.

**Fix:**
```bash
npx tsx scripts/with-env.ts "prisma migrate deploy"
```
Or if using db push for local dev: `npm run db:sync` (but db push may reject some changes; prefer migrate deploy).

**Doc Update:** Add to DB_STRATEGY: when pulling schema changes, run migrate deploy first.

**Reference:** bruised-banana-residency-ship, db:sync

---

## 5. Vercel deploy stuck in initialization

**Status:** Resolved (Mar 2025) — Vercel deployment queue is no longer blocked.

**Symptom:** New Vercel deployments never reach "Building"; they stay in "Initializing" or "Queued".

**Root Cause:** Platform/queue issue. Common causes: Hobby account (1 concurrent build), accumulated failed deployments, Vercel platform incident.

**Fix:**
1. Delete old failed deployments from Vercel Dashboard
2. Cancel any stuck builds
3. Check status.vercel.com for incidents
4. Wait and retry

**Doc Update:** Vercel Init Blocker plan (existing). Not a dev-setup issue; deployment infra.

**Reference:** .cursor/plans/vercel_init_blocker_fix

---

## 6. DEVELOPER_ONBOARDING says "migrate dev" but build uses "migrate deploy"

**Symptom:** Confusion about whether to use `prisma migrate dev` or `prisma migrate deploy` or `db:sync`.

**Root Cause:** Project uses a hybrid: build runs migrate deploy; some docs say migrate dev for first-time setup. db:sync uses db push for local dev.

**Fix:**
- **First-time:** Use `prisma migrate deploy` to apply all migrations. Don't use `migrate dev --name init` unless you're creating a new migration.
- **Schema changes:** Create migration file, then `migrate deploy`. Use db push only for rapid prototyping (and accept that it may fail on destructive changes).

**Doc Update:** Unify in DB_STRATEGY.md; update DEVELOPER_ONBOARDING.

---

## 7. db:seed fails "Argument `where` needs at least one of `id`" (Nation/Archetype)

**Symptom:** `npm run db:seed` fails with:
```
Argument `where` of type NationWhereUniqueInput needs at least one of `id` arguments.
```

**Root Cause:** Nation and Archetype models have no `@@unique` on `name`. The seed used `upsert({ where: { name } })`, which requires a unique field. Prisma 5.x enforces this strictly.

**Fix:** Use `findFirst` + `create`/`update` instead of `upsert` for Nation and Archetype in `src/lib/seed-utils.ts`. Match by `name` and `instanceId: null` for global records.

**Doc Update:** None. Code fix in seed-utils.

**Reference:** DS verification (Mar 2026)

---

---

## 8. Player data wiped — players: 0, instances intact

**Symptom:** `players` table has 0 rows; `instances` and `app_config` still have data. User reports data loss between last night and tonight; similar incident ~Feb 20.

**Root Cause:** A destructive reset was triggered. The codebase has three paths that can wipe player data:
1. **Admin Panel** — `triggerSystemReset` (AdminResetZone on `/admin`) truncates players, nations, playbooks, etc. Requires admin role.
2. **Script** — `npm run db:prod-reset` truncates same tables and reseeds.
3. **Schema reset** — `npm run db:reset` (db push --force-reset) drops entire schema. Would also wipe instances; since instances survive, this is unlikely.

The pattern (players empty, instances intact) matches exactly what `triggerSystemReset` or `prod-reset` does: they truncate a fixed list of tables; `instances` and `audit_logs` are **not** in that list.

**First step:** Run `npm run diagnose:db` to see DB identity and **recent reset events** from `audit_logs`. Run `npm run db:reset-history` for full reset history.

**Fix:** Reseed: `npm run db:seed` then pre-launch seeds (`seed:party`, `seed:quest-map`, etc.). See incident #3.

**Doc Update:** See `.specify/specs/dev-setup-anti-fragile/DATA_LOSS_ROOT_CAUSE_ANALYSIS.md` for full analysis and recommended safeguards (block reset in production, show connected DB in AdminResetZone). For recovery and connection forensics, see `docs/DATA_RECOVERY_AND_CONNECTION_FORENSICS.md`.

---

## Adding New Incidents

When you hit a new setup/loop-readiness issue:

1. Add an entry here with Symptom, Root Cause, Fix, Doc Update
2. If the fix is a command, add a remediation hint to loop-readiness.ts
3. Update the relevant doc (ENV_AND_VERCEL, DEVELOPER_ONBOARDING, etc.)
