# Database Data Loss — Root Cause Analysis

**Context:** Recurring incidents where player data is wiped (players: 0 rows) while some tables (e.g. `instances`, `app_config`) retain data. Last incident: between last night and tonight; prior incident ~Feb 20.

---

## Summary of Findings

The codebase has **three distinct destructive paths** that can wipe player data. The observed pattern (players empty, instances intact) matches **exactly** what happens when `triggerSystemReset` or `prod-reset` runs: they truncate a fixed list of tables but **do not** truncate `instances` or `audit_logs`.

---

## Destructive Paths Identified

### 1. Admin Panel Reset (`triggerSystemReset`)

| Location | `src/actions/admin-tools.ts` |
|----------|-----------------------------|
| Trigger | Admin clicks "Initiate Full Server Reset" on `/admin` (AdminResetZone) |
| Auth | Requires admin role (`ensureAdmin()`) |
| Action | TRUNCATE on: `admin_audit_log`, `player_roles`, `thread_quests`, `thread_progress`, `pack_progress`, `starter_quest_progress`, `player_quests`, `vibulon_events`, `vibulons`, `starter_packs`, `custom_bars`, `quest_threads`, `players`, `accounts`, `invites`, `nations`, `playbooks`, `story_ticks`, `global_state`, `app_config`, `bars` |
| Survives | `audit_logs`, `instances`, and any table not in the list |
| Audit | Writes `SYSTEM_RESET_STARTED` / `SYSTEM_RESET_COMPLETED` / `SYSTEM_RESET_FAILED` to `audit_logs` |

**Risk:** Admin may be testing locally but env vars point at production DB (e.g. after `vercel env pull`). One click wipes prod.

---

### 2. Production Reset Script (`db:prod-reset`)

| Location | `scripts/prod-reset.ts` |
|----------|-------------------------|
| Trigger | `npm run db:prod-reset` (manual) |
| Action | Same TRUNCATE list as admin panel; then runs `db:seed` |
| Audit | Writes `PROD_RESET_STARTED` / `PROD_RESET_COMPLETED` / `PROD_RESET_FAILED` to `audit_logs` |

**Risk:** Run with wrong `DATABASE_URL` (e.g. prod URL in `.env.local`). No environment check.

---

### 3. Full Schema Reset (`db:reset`)

| Location | `package.json` → `prisma db push --force-reset && tsx prisma/seed.ts` |
|----------|----------------------------------------------------------------------|
| Trigger | `npm run db:reset` (manual) |
| Action | Drops entire schema, recreates, seeds. **All tables** wiped. |
| Survives | Nothing |

**Risk:** Same as prod-reset — wrong env = wrong DB wiped. If this ran, `instances` would also be empty. Since instances still have data, **db:reset is unlikely** to be the cause of the current incident.

---

## What Does NOT Cause Data Loss

| Process | Why Safe |
|---------|----------|
| `npm run build` | Runs `prisma migrate deploy` only. Migrations are additive/alter; no truncate. |
| `npm run db:sync` | Runs `prisma db push` (no `--force-reset`). Skips in production. |
| `npm run db:seed` | Uses upsert; does not truncate. |
| `npm run setup` | Runs migrate deploy + seeds. No destructive ops. |
| Migrations since Feb 20 | Reviewed: no DROP TABLE on `players`; playbook→archetype rename preserves data. |

---

## Evidence to Check

1. **Audit log:** `audit_logs` is **not** truncated by resets. Run:
   ```bash
   npm run db:reset-history
   ```
   This prints `SYSTEM_RESET_*` and `PROD_RESET_*` events. If you see recent entries, a reset was triggered.

2. **Diagnostic:** `npm run diagnose:db` reports which DB the app uses and row counts. Compare to what you expect.

3. **Env vars:** After `vercel env pull`, `.env.local` gets production vars. If you then run `npm run dev` or any script, it uses that DB. Local dev prefers `DATABASE_URL`; production prefers `PRISMA_DATABASE_URL` (Accelerate). See `src/lib/db-resolve.ts`.

---

## Recommended Safeguards

1. **Block admin reset on Vercel deploy** ✅ Implemented  
   In `triggerSystemReset`, reject when `process.env.VERCEL === '1'` unless `ALLOW_PRODUCTION_RESET=1` is set in Vercel env. Prevents accidental reset from the deployed admin panel.

2. **Audit log in diagnose** ✅ Implemented  
   `npm run diagnose:db` now reports recent reset events from `audit_logs` so operators see them immediately.

3. **Rename / gate destructive scripts**  
   Consider renaming `db:reset` → `db:reset:local-only`. Document that `db:prod-reset` must never be run against production without verifying `DATABASE_URL` first.

4. **Admin UI warning**  
   Show which database the app is connected to (e.g. host/db name) in the AdminResetZone. "You are about to reset: neon-xxx.us-east-1.aws.neon.tech / bars_prod"

---

## Timeline (since Feb 20)

- **Feb 20:** Prior data loss; reseed required.
- **Mar 1:** Current incident; players: 0, instances intact.
- **Build/deploy:** No automatic destructive commands. Rollback did not restore data → issue is data-layer, not code.

---

## Next Steps

1. Run `npm run db:reset-history` to confirm if a reset was logged.
2. Implement safeguards (production block, diagnose enhancement).
3. Add "connected DB" display to AdminResetZone.
4. Document in INCIDENTS.md as incident #8.
