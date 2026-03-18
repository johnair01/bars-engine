# Tasks: DB Data Safety

## Phase 1 (Guard rails + docs)

- [x] DBP-1: `scripts/db-reset-guard.ts` — host check; refuse non-localhost without `FORCE_RESET=true`
- [x] DBP-2: `package.json` `db:reset` — prepend guard call
- [x] DBP-3: `docs/INCIDENTS.md` — create with 2026-03-16 entry
- [x] DBP-4: `docs/ENV_AND_VERCEL.md` — PITR section + AI tool credential isolation
- [x] DBP-5: `npm run db:post-restore` — chain apply-migration-direct + fix-post-restore-columns + verify:prod-db

## Phase 2 (Snapshot cron)

- [x] DBP-6: `scripts/prod-snapshot.ts` — row count metadata to backups/SNAPSHOT_LOG.md
- [x] DBP-7: `package.json` — prod:snapshot + snapshot:verify scripts
- [x] DBP-8: Vercel cron or local cron entry for daily snapshot (documented in ENV_AND_VERCEL.md)

## Phase 3 (Schema drift in loop readiness)

- [x] DBP-9: loop-readiness.ts — add find-schema-drift.ts pre-check with remediation hint
- [x] DBP-10: DEVELOPER_ONBOARDING.md — db push warning for shared/prod databases
