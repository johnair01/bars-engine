# Production Incidents

Production incidents with root cause, fix, and structural improvements. Use for post-mortems and to avoid repeating mistakes.

**Format:** Date | Symptom | Root Cause | Fix | Structural Improvement

**First step when DB issues arise:** Run `npm run diagnose:db` to see which URL the app uses and whether tables exist. No speculation. Facts first.

---

## 2026-03-16 — Production Player Data Wipe

| Field | Value |
|-------|-------|
| **Detected** | ~14:05 UTC (500 errors on `GET /`) |
| **Symptom** | `prisma.appConfig` query failed; 0 players; login broken |
| **Root Cause** | Unknown — no terminal log captured. Likely `npm run db:reset` or `prisma db push --force-reset` run in a shell that had `DATABASE_URL` pointing to production. The gemini AI copy at `~/.gemini/antigravity/bars-engine/web/` is a suspect — it uses the same `DATABASE_URL` and was last active Feb 24. |
| **Data Recovered** | Yes — via Prisma Postgres PITR. Restored "8pm March 15" backup. 170 players + all game data intact. |
| **Downtime** | ~2 hours (14:05–16:xx UTC) |
| **Fix Applied** | 1. PITR restore from console. 2. Re-ran `apply-migration-direct.ts` for new columns. 3. `prisma migrate resolve --applied` for latest migration. 4. Created `scripts/fix-post-restore-columns.ts` for columns added via `db push` not in migration files (`custom_bars.inviteId`). 5. Pushed two commits to trigger Vercel rebuild. |
| **Schema Drift** | `custom_bars.inviteId` — added via `db push` after last migration; not captured in any migration file; lost after restore. |
| **Structural Improvement** | `scripts/db-reset-guard.ts` — refuses `db:reset` when `DATABASE_URL` points to non-localhost. Override with `FORCE_RESET=true` when intentional. See [DB Data Safety spec](../.specify/specs/db-data-safety/spec.md). |

---

## References

- [Dev Setup Incidents](../.specify/specs/dev-setup-anti-fragile/INCIDENTS.md) — developer setup, loop readiness, schema drift
- [ENV_AND_VERCEL.md](./ENV_AND_VERCEL.md) — PITR, troubleshooting, credential isolation
