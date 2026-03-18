# DB Connection Investigation — "Last Night It Worked"

## Summary

**Root cause**: The app uses `PRISMA_DATABASE_URL` (Accelerate) **first**, while the diagnose script uses `DATABASE_URL` (direct). If Accelerate points at a different or empty database, the app sees "table does not exist" even though the direct DB has tables.

## URL Resolution Order

| Source | Used by | Format |
|--------|---------|--------|
| `PRISMA_DATABASE_URL` | **App** (checked first) | `prisma+postgres://` = Accelerate proxy |
| `POSTGRES_PRISMA_URL` | App, diagnose fallback | `postgresql://` = direct |
| `DATABASE_URL` | App, diagnose primary | `postgresql://` = direct |
| `POSTGRES_URL` | App | `postgresql://` = direct |

From `src/lib/db.ts`:

```ts
const candidates = [
    ['PRISMA_DATABASE_URL', process.env.PRISMA_DATABASE_URL],  // ← First
    ['POSTGRES_PRISMA_URL', process.env.POSTGRES_PRISMA_URL],
    ['DATABASE_URL', process.env.DATABASE_URL],
    ['POSTGRES_URL', process.env.POSTGRES_URL],
]
```

From `scripts/diagnose-prod-db.ts`:

```ts
const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL  // ← Never uses PRISMA_DATABASE_URL
```

## What Likely Changed

1. **Last night (working)**: Either `PRISMA_DATABASE_URL` was unset, so the app used `DATABASE_URL` (direct) — or Accelerate was correctly configured to the same backend.
2. **Now (broken)**: `PRISMA_DATABASE_URL` is set (e.g. from `vercel env pull`) and Accelerate points at:
   - A different database (staging, reset, or new project), or
   - A database that was never migrated.

`.env.local` is gitignored, so we cannot diff env changes. Version control only shows code; env changes are local.

## Quick Fix: Bypass Accelerate for Local Dev

Force the app to use the direct database:

```bash
# Option A: Comment out PRISMA_DATABASE_URL in .env.local
# PRISMA_DATABASE_URL=prisma+postgres://...

# Option B: Run dev without Accelerate
PRISMA_DATABASE_URL="" POSTGRES_PRISMA_URL="" npm run dev
```

Or create `.env.local.direct` and use it:

```bash
# Copy .env.local, remove PRISMA_DATABASE_URL line, then:
env $(grep -v '^#' .env.local.direct | xargs) npm run dev
```

## Verify Which URL the App Uses

When you run `npm run dev`, the app logs:

```
[DB] Using PRISMA_DATABASE_URL (Accelerate)
```

or

```
[DB] Using DATABASE_URL
```

If you see "Accelerate" and get "table does not exist", the direct DB (used by diagnose) is fine — the app is hitting a different DB via Accelerate.

## Next Steps

1. **Immediate**: Unset `PRISMA_DATABASE_URL` in `.env.local` for local dev, or run with `PRISMA_DATABASE_URL="" npm run dev`.
2. **Accelerate config**: In [Prisma Data Platform](https://console.prisma.io), check which database the Accelerate project uses. Ensure it matches your `DATABASE_URL` backend.
3. **Vercel**: If production uses Accelerate, ensure the Accelerate project's backend DB has migrations applied and matches production expectations.
