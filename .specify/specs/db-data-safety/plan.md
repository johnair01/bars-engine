# Plan: DB Data Safety

## Phase 1: Guard rails and documentation

1. **`scripts/db-reset-guard.ts`** — parse `DATABASE_URL` host; refuse if not localhost/127.0.0.1 (unless `FORCE_RESET=true`).
2. **`package.json`** — prefix `db:reset` with `tsx scripts/db-reset-guard.ts &&`.
3. **`docs/INCIDENTS.md`** — create with 2026-03-16 incident entry.
4. **`docs/ENV_AND_VERCEL.md`** — add PITR section + AI tool credential isolation note.
5. **`npm run db:post-restore`** — add to `package.json`; script: `tsx scripts/apply-migration-direct.ts && tsx scripts/fix-post-restore-columns.ts && npm run verify:prod-db`.

## Phase 2: Automated snapshot cron

6. **`scripts/prod-snapshot.ts`** — `pg_dump` to `backups/` with row count metadata.
7. **`package.json`** — add `prod:snapshot` and `snapshot:verify` scripts.
8. **Vercel cron or local cron** — daily snapshot trigger.

## Phase 3: Schema drift in loop readiness

9. **`scripts/loop-readiness.ts`** — call `find-schema-drift.ts` as pre-check; emit "Fix: create a migration" hint.
10. **`docs/DEVELOPER_ONBOARDING.md`** — add warning: never `db push` on shared/prod databases.

## Ambiguity score: 0.10
All requirements derive directly from the 2026-03-16 incident. No open design questions.
