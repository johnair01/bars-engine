# Spec: DB Data Safety — Backup Automation, Credential Isolation, and Post-Restore Runbook

## Purpose

Prevent repeat data-loss incidents. On 2026-03-16, production player data was wiped — 170 players lost — with no automated alert and no clear audit trail. The data was recovered via Prisma Postgres PITR, but only because the user noticed manually and happened to have PITR enabled. This spec hardens that infrastructure.

**Problem**: No automated snapshots beyond Prisma Cloud PITR. No guard against `db:reset` running against production. A dormant AI-managed copy of the repo (`~/.gemini/antigravity/bars-engine/web/`) shares the same `DATABASE_URL` and could mutate production silently. Post-restore column drift requires manual scripting. No formal incident record.

**Practice**: Observe before act. Automated safety over manual vigilance. Document incidents so they become structural improvements.

---

## Incident Log

### 2026-03-16 — Production Player Data Wipe

| Field | Value |
|-------|-------|
| **Detected** | ~14:05 UTC (500 errors on `GET /`) |
| **Symptom** | `prisma.appConfig` query failed; 0 players; login broken |
| **Root cause** | Unknown — no terminal log captured. Likely `npm run db:reset` or `prisma db push --force-reset` run in a shell that had `DATABASE_URL` pointing to production. The gemini AI copy at `~/.gemini/antigravity/bars-engine/web/` is a suspect — it uses the same `DATABASE_URL` and was last active Feb 24. |
| **Data recovered** | Yes — via Prisma Postgres PITR. Restored "8pm March 15" backup. 170 players + all game data intact. |
| **Downtime** | ~2 hours (14:05–16:xx UTC) |
| **Fix applied** | 1. PITR restore from console. 2. Re-ran `apply-migration-direct.ts` for new columns. 3. `prisma migrate resolve --applied` for latest migration. 4. Created `scripts/fix-post-restore-columns.ts` for columns added via `db push` not in migration files (`custom_bars.inviteId`). 5. Pushed two commits to trigger Vercel rebuild. |
| **Schema drift** | `custom_bars.inviteId` — added via `db push` after last migration; not captured in any migration file; lost after restore. |
| **Prevention gap** | No automated snapshot. No guard preventing `db:reset` in prod context. No credential isolation for gemini copy. |

---

## User Stories

### P1: Post-restore runbook automation

**As a** maintainer, **I want** a single command that fixes schema drift after a PITR restore, **so** I don't spend 2 hours hunting missing columns.

**Acceptance**: `npm run db:post-restore` runs: `apply-migration-direct.ts` → `fix-post-restore-columns.ts` → `prisma migrate resolve --applied <latest>` → `verify:prod-db`. Idempotent. Prints a pass/fail summary.

### P2: `db:reset` production guard

**As a** developer, **I want** `npm run db:reset` to refuse if `DATABASE_URL` points to a non-local host, **so** an accidental terminal command can't wipe production.

**Acceptance**: `scripts/db-reset-guard.ts` checks the `DATABASE_URL` host. If it is not `localhost` or `127.0.0.1`, it prints a red warning and exits non-zero without running `prisma db push --force-reset`. Override possible via `FORCE_RESET=true` env var (explicit intent required).

### P3: Credential isolation for AI tool copies

**As a** maintainer, **I want** the gemini/AI-managed copy of the repo to use a separate `DATABASE_URL`, **so** it cannot mutate production data.

**Acceptance**: `~/.gemini/antigravity/bars-engine/web/.env.local` (or equivalent) uses a dedicated development/staging `DATABASE_URL`, not production. Documented in `docs/ENV_AND_VERCEL.md` under "AI Tool Credential Isolation".

### P4: PITR awareness in runbooks

**As a** maintainer, **I want** `docs/ENV_AND_VERCEL.md` to document how to trigger a PITR restore, **so** the next on-call doesn't lose 30 minutes finding the UI.

**Acceptance**: A "Point-in-time Recovery" section in `ENV_AND_VERCEL.md` describes: Prisma Cloud console → project → Backups → select timestamp → restore. Includes the PITR retention window (7 days for Prisma Postgres free tier).

### P5: Incident log in version control

**As a** team, **I want** `docs/INCIDENTS.md` to track production incidents with root cause and structural fix, **so** patterns emerge over time.

**Acceptance**: `docs/INCIDENTS.md` exists with the 2026-03-16 incident documented. Format: date, symptom, root cause, fix, structural improvement made.

---

## Functional Requirements

### Phase 1: Guard rails and documentation (immediate)

- **FR1**: `scripts/db-reset-guard.ts` — host check before `db:reset`; `package.json` `db:reset` script calls guard first.
- **FR2**: `docs/INCIDENTS.md` — created with 2026-03-16 entry.
- **FR3**: `docs/ENV_AND_VERCEL.md` — add "Point-in-time Recovery" section and "AI Tool Credential Isolation" note.
- **FR4**: `npm run db:post-restore` script — chains `apply-migration-direct.ts` + `fix-post-restore-columns.ts` + `migrate resolve --applied` + `verify:prod-db`.

### Phase 2: Automated snapshot cron

- **FR5**: `scripts/prod-snapshot.ts` — uses `DATABASE_URL` to `pg_dump` into a timestamped file in `backups/` (gitignored). Writes snapshot metadata (row counts, timestamp) to `backups/SNAPSHOT_LOG.md`.
- **FR6**: Vercel cron or local cron entry: `npm run prod:snapshot` daily at 00:00 UTC.
- **FR7**: `npm run snapshot:verify` — reads latest snapshot metadata and confirms it is < 25 hours old. Fails loudly if stale.

### Phase 3: Schema drift prevention

- **FR8**: `scripts/find-schema-drift.ts` (already exists) — add to `npm run loop:ready` as a pre-check step. Emit "Fix: add to a migration file" hint on drift detection.
- **FR9**: Developer onboarding doc: add warning — never use `db push` on shared/production databases; always create a migration file for schema changes.

---

## Non-Goals

- Replacing Prisma Postgres PITR with a custom backup system — PITR is sufficient; automate the snapshot as belt-and-suspenders, not a replacement.
- Full disaster recovery (multi-region, replica) — out of scope for this phase.
- Auditing the gemini copy's past actions retroactively.

---

## Dependencies

- [DS — Dev Setup Anti-Fragile](.specify/specs/dev-setup-anti-fragile/spec.md) (overlaps: incidents, schema drift)
- [DBC — DB Connection Diagnostic](.specify/specs/db-connection-diagnostic/spec.md) (overlaps: which URL the app uses)
- `scripts/apply-migration-direct.ts` (pre-existing)
- `scripts/fix-post-restore-columns.ts` (created 2026-03-16)
- `scripts/find-schema-drift.ts` (created 2026-03-16)
