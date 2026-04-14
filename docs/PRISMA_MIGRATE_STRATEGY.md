# Prisma migrate strategy (`migrate deploy`)

This repo historically mixed **`prisma db push`** with a long **`prisma/migrations`** chain. That caused wrong-order migrations, missing `CREATE TABLE` steps, and production drift.

### Policy — `prisma db push` is forbidden

**No one** uses `prisma db push` — including **AI agents** and **automation**. It is not a shortcut; it is how schema history diverges from git and breaks `migrate deploy`. Anyone who uses it is breaking the realm’s contract (migrations are law).

- **`npm run db:push`** exits with an error (wrapper).
- **`scripts/db-sync.ts`** runs **`prisma generate` only**; it never pushes. If `schema.prisma` changed since your local `.prisma_hash`, it fails until you run **`migrate dev` / `migrate deploy`** and **`npm run db:record-schema-hash`**.
- **Legacy damage:** `20250306000000_playbook_to_archetype_rename` was removed (wrong order + duplicate). **Gaps** (e.g. `adventures`) from old `db push` are why **`migrate reset` on an empty DB** can still fail until Path B (squash) is done.

---

## Goals

| Goal | Tool |
|------|------|
| CI / Vercel / production apply schema | **`prisma migrate deploy`** |
| Local — change schema | **`prisma migrate dev --name …`** → commit `prisma/migrations/**` → **`migrate deploy`** → **`npm run db:record-schema-hash`** |
| Local — regenerate client only | **`npm run db:generate`** or **`npm run db:sync`** (when schema hash matches) |

---

## Architect playbook — unblock now, stop recurrence

**Blueprint:** Migrations are the **contract** between `schema.prisma` and every database. Drift happens when **history** (what Prisma thinks ran) and **reality** (tables/columns) disagree, or when the chain **cannot run on an empty database**. Fix the contract once, then **guard** it.

### What to do **right now** (failed `20260313020000_add_character_creator_v2`, P3009, restored backup)

1. **Assume your backup is a full, working schema** — you already have `adventures`, `player_playbooks`, and the character-creator columns, or an equivalent end state.
2. **Do not “roll back” first** unless you have proven that re-running that migration file will succeed (it needs `adventures` to exist before it runs — same failure mode as before).
3. **Prefer marking reality as applied:**  
   `npx prisma migrate resolve --applied 20260313020000_add_character_creator_v2`  
   against **production** `DATABASE_URL`. That tells Prisma: “this migration’s outcome is already in the DB; move on.”
4. If something from that migration is **actually missing** (table/column), run the SQL from `prisma/migrations/20260313020000_add_character_creator_v2/migration.sql` once, **then** `migrate resolve --applied`.
5. Run `migrate deploy` again; then redeploy Vercel.

**Why this path:** The failure was **order/environment** (migration ran when prerequisites weren’t there), not necessarily a wrong end state after restore. `resolve --applied` aligns **history** with **reality** with minimal risk.

### What to do **moving forward** (so you don’t keep doing this)

| Layer | Action |
|-------|--------|
| **Single path to prod schema** | Every change that ships: **`prisma migrate dev`** → commit migration folder → **`migrate deploy`** in CI/Vercel. **`db push` is never used.** |
| **Prove the chain** | Schedule **Path B (squashed baseline)** when the team can coordinate: one migration that builds from **empty** to current `schema.prisma`, tested on a **fresh** DB. That removes hidden gaps from legacy **`db push`**. |
| **CI gate** (recommended) | On PR: spin up **empty Postgres**, run **`migrate deploy`**, fail if it doesn’t complete. Catches broken ordering before Vercel. |
| **After restore** | If backup is full: prefer **`resolve --applied`** for stuck rows when the schema already matches; only use **`--rolled-back`** when you intend to **retry** the exact SQL and preconditions are fixed. |

### Anti-patterns (Architect: cut these)

- **`prisma db push`** for any shared or production database — or for “speed” without a migration file.
- Shipping schema changes **without** a new row in `prisma/migrations/`.
- Renaming or deleting migration folders that have **already** touched production without **baselining** (see Prisma docs).

---

## Path A — Empty database (new project, destroyed DB, new branch DB)

**Use when:** You control the database and can start from **zero objects** in `public` (or a new Postgres database).

1. Point **`DATABASE_URL`** at that empty database.
2. Apply migrations only:

   ```bash
   npx tsx scripts/with-env.ts "npx prisma migrate deploy"
   ```

3. If **`deploy` fails** because the migration chain is still incomplete vs `schema.prisma`, either:
   - **Fix forward:** add missing SQL to the **earliest** migration that should create the table (high effort), or
   - **Squash baseline (Path B)** — one migration that matches current `schema.prisma` (see below).

4. Seed if needed:

   ```bash
   npm run db:seed
   ```

---

## Path B — Squashed baseline (recommended to unlock `migrate deploy` everywhere)

**Use when:** The team agrees to **replace** the long migration history with a **single baseline** migration that matches **`schema.prisma`**, and you can coordinate **all** environments.

**Effects:**

- **New empty DBs:** `migrate deploy` applies **one** migration — reliable.
- **Existing databases** that already applied old migrations: you must **baseline** or **migrate data** separately (Prisma: [Baselining](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining)).

**Procedure (outline — run only after backup + team sign-off):**

1. **Backup** production and any shared DBs.
2. **Archive** current history (keep in git forever):

   ```bash
   mkdir -p prisma/migrations_archive
   git mv prisma/migrations prisma/migrations_archive/migrations_before_squash_$(date +%Y%m%d)
   mkdir prisma/migrations
   ```

3. **Generate** one SQL script from empty → current datamodel:

   ```bash
   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > prisma/migrations/MIGRATION_NAME/migration.sql
   ```

   Replace `MIGRATION_NAME` with a single timestamp folder, e.g. `20260330120000_baseline_schema` (use a **new** timestamp when you actually run this).

4. **Review** the SQL (constraints, extensions, data).

5. **Test** on a **fresh** database:

   ```bash
   npx tsx scripts/with-env.ts "npx prisma migrate deploy"
   npx prisma generate
   ```

6. **Production DBs** that already had the old migrations: use Prisma **baselining** so `deploy` does not re-run old folders; for a DB that only ever had legacy **`db push`** (before this policy), you may **mark** the new baseline as applied after verifying schema matches, per Prisma docs (risky — prefer empty DB + restore data).

7. **Document** the cutover in this file (date, migration folder name).

---

## Path C — Existing production (keep current migration folders)

**Use when:** You **cannot** squash (multiple teams, long-lived DBs).

- Ship schema changes with **`prisma migrate dev`** locally to **add** a new migration folder for each release.
- Fix ordering bugs (like wrong timestamps) by **renaming** folders only when they have **never** been applied to any shared DB.
- **`migrate deploy`** on production after merge.

If the chain is already broken on empty DB, Path C still needs **incremental fixes** (add missing `CREATE TABLE` steps) or a **one-time** baseline for **new** environments only (hybrid).

---

## Repairing a broken / half-migrated database

1. Prefer **new empty database** or `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` (only when data loss is OK).
2. **`npx prisma migrate deploy`** (after chain is fixed or baseline exists).
3. Do not use **`db push`** — use **migrations** only.

---

## References

- [Prisma: Production troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Prisma: Baselining a database](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining)
- Project env: [ENV_AND_VERCEL.md](./ENV_AND_VERCEL.md)

### Room presence (`RoomPresence`)

The `room_presences` table has **no** `@@unique([playerId, roomId])`, so Prisma does not expose `playerId_roomId` for `upsert`. `src/actions/room-presence.ts` uses **`findFirst` + `update` / `create`** instead. To use **`upsert`** and tighten concurrency semantics, add a composite unique **via a migration** (then regenerate the client per project workflow).

---

## Do not commit local migrate-resolve artifacts

`prisma migrate resolve` updates **`_prisma_migrations` in the database only** — it does not create migration files in git. After a restore or drift fix, **do not commit** ad-hoc logs, one-off SQL, or “what we ran” notes as if they were part of the repo’s migration history.

For personal scratch (commands, timestamps, which `resolve --applied` names you used), use **`.prisma-migrate-local-notes`** (gitignored) or another private store — not tracked files.

## Changelog

| Date | Change |
|------|--------|
| 2026-03-31 | Note: `RoomPresence` has no composite unique; `room-presence.ts` uses findFirst + update/create (see References § Room presence). |
| 2026-03-30 | Do not commit local migrate-resolve artifacts; `.prisma-migrate-local-notes` gitignored. |
| 2026-03-30 | Document added; removed duplicate wrong-order `20250306000000_playbook_to_archetype_rename` migration. |
| 2026-03-30 | Architect playbook: P3009 / restore / `resolve --applied`, recurrence prevention, CI gate. |
| 2026-03-30 | Policy: **`prisma db push` forbidden**; `db-sync` no longer pushes; `db:push` script errors; `db:reset` uses `migrate reset`. |
