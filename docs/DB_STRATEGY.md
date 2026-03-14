# Database Strategy — Migrate vs Push, When to Use Each

This doc clarifies when to use `prisma migrate deploy`, `prisma db push`, and `db:sync`. Confusion here causes schema drift and failed migrations.

## TL;DR

| Context | Use | Why |
|---------|-----|-----|
| **Production / Vercel build** | `prisma migrate deploy` | Build runs this; migrations are versioned |
| **Local dev (first-time or after pull)** | `prisma migrate deploy` | Applies migrations; keeps DB in sync |
| **Local dev (rapid schema iteration)** | `npm run db:sync` (db push) | Faster; no migration file. Use with care—destructive changes may fail |
| **Schema removes a column** | Create migration, then `migrate deploy` | db push may refuse (data-loss warning); migration is explicit |

## Production

The build script (`npm run build`) runs `prisma migrate deploy` when `DATABASE_URL` is set. Migrations in `prisma/migrations/` are applied in order. Do not use `db push` in production.

## Local Development

### Recommended: migrate deploy

```bash
npx tsx scripts/with-env.ts "prisma migrate deploy"
```

- Applies all pending migrations
- Idempotent (already-applied migrations are skipped)
- Keeps local DB in sync with migration history

### Alternative: db:sync (db push)

```bash
npm run db:sync
```

- Pushes schema directly to DB without migrations
- Faster for rapid iteration
- **Limitation:** May fail on destructive changes (e.g. dropping a column with data). In that case, create a migration and use `migrate deploy`.

### When schema changes

1. **Adding columns/tables:** Either `db push` or create migration + `migrate deploy`
2. **Removing columns:** Create a migration. `db push` may warn about data loss and refuse.
3. **Renaming columns:** Create a migration (Prisma can generate it via `prisma migrate dev`)

## Failed Migrations (P3009)

If `migrate deploy` fails with "migrate found failed migrations":

1. Check if the failed migration's goal was achieved (e.g. does the table exist?)
2. If **yes:** `prisma migrate resolve --applied <migration_name>`
3. If **no:** `prisma migrate resolve --rolled-back <migration_name>`, then `migrate deploy` again

See [.specify/specs/dev-setup-anti-fragile/INCIDENTS.md](../.specify/specs/dev-setup-anti-fragile/INCIDENTS.md) for details.

## References

- [ENV_AND_VERCEL.md](ENV_AND_VERCEL.md) — env setup, production recovery
- [.specify/specs/dev-setup-anti-fragile/INCIDENTS.md](../.specify/specs/dev-setup-anti-fragile/INCIDENTS.md) — incident runbooks
