# Prisma migrate strategy (`migrate deploy`)

This repo historically mixed **`prisma db push`** (dev / `db:sync`) with a long **`prisma/migrations`** chain. That caused:

- **Wrong-order migration removed:** `20250306000000_playbook_to_archetype_rename` sorted **before** `init_postgres` and duplicated `20260307000000_playbook_to_archetype_rename` (removed from git).
- **Gaps in history:** Some tables (e.g. `adventures`) were introduced via **`db push`** and never appeared as `CREATE TABLE` in an early migration, so **`migrate reset` on an empty DB** can fail mid-chain.
- **Half-applied DBs:** **`db push`** after failed **`migrate`** leaves the database in a state **`migrate deploy`** / **`db push`** may not reconcile; **drop `public` or use a new database** before reapplying.

Use this document to choose a path and keep production deploys predictable.

---

## Goals

| Goal | Tool |
|------|------|
| CI / Vercel / production apply schema | **`prisma migrate deploy`** |
| Local rapid iteration (team norm today) | **`prisma db push`** (see `scripts/db-sync.ts`) — must be followed by **real migrations** before shipping schema changes |

---

## Path A — Empty database (new project, destroyed DB, new branch DB)

**Use when:** You control the database and can start from **zero objects** in `public` (or a new Postgres database).

1. Point **`DATABASE_URL`** at that empty database.
2. Apply migrations only (no `db push` first):

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

6. **Production DBs** that already had the old migrations: use Prisma **baselining** so `deploy` does not re-run old folders; for a DB that only ever had `db push`, you may **mark** the new baseline as applied after verifying schema matches, per Prisma docs (risky — prefer empty DB + restore data).

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
3. Avoid alternating **`migrate`** and **`db push`** on the same database without a plan.

---

## References

- [Prisma: Production troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Prisma: Baselining a database](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining)
- Project env: [ENV_AND_VERCEL.md](./ENV_AND_VERCEL.md)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-30 | Document added; removed duplicate wrong-order `20250306000000_playbook_to_archetype_rename` migration. |
