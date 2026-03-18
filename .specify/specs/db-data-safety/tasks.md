# Tasks: DB Data Safety

## Phase 1 (Guard rails + docs)

- [ ] DBP-1: `scripts/db-reset-guard.ts` — host check; refuse non-localhost without `FORCE_RESET=true`
- [ ] DBP-2: `package.json` `db:reset` — prepend guard call
- [ ] DBP-3: `docs/INCIDENTS.md` — create with 2026-03-16 entry
- [ ] DBP-4: `docs/ENV_AND_VERCEL.md` — PITR section + AI tool credential isolation
- [ ] DBP-5: `npm run db:post-restore` — chain apply-migration-direct + fix-post-restore-columns + verify:prod-db

## Phase 2 (Snapshot cron)

- [ ] DBP-6: `scripts/prod-snapshot.ts` — pg_dump + row count metadata to backups/
- [ ] DBP-7: `package.json` — prod:snapshot + snapshot:verify scripts
- [ ] DBP-8: Vercel cron or local cron entry for daily snapshot

## Phase 3 (Schema drift in loop readiness)

- [ ] DBP-9: loop-readiness.ts — add find-schema-drift.ts pre-check with remediation hint
- [ ] DBP-10: DEVELOPER_ONBOARDING.md — db push warning for shared/prod databases
