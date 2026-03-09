# Analysis: Prisma Migrate Deploy — DATABASE_URL Missing

## Current Flow

```
package.json "build": tsx scripts/with-env.ts "prisma migrate deploy && next build"
     ↓
with-env.ts: config(.env), config(.env.local), execSync(cmd)
     ↓
prisma migrate deploy  ← fails if DATABASE_URL not set (Prisma schema validation)
     ↓
next build             ← never reached when migrate fails
```

## What Works Without DATABASE_URL

| Command | Needs DB? | Notes |
|---------|-----------|-------|
| `prisma generate` | No | Reads schema file only; generates client |
| `next build` | No | Compiles app; Prisma client is generated; DB access at runtime |
| `prisma migrate deploy` | Yes | Connects to DB to apply migrations |

## Proposed Flow

```
build script (new: build-with-migrate.ts)
     ↓
Load .env, .env.local
     ↓
DATABASE_URL set?
  YES → prisma migrate deploy && next build
  NO  → prisma generate && next build
        + print warning
```

## File Impacts

| File | Action |
|------|--------|
| scripts/build-with-migrate.ts | Create — conditional migrate logic |
| package.json | Update build script to use build-with-migrate |
| docs/ENV_AND_VERCEL.md | Add note about build without DATABASE_URL |

## Edge Cases

- **Vercel**: DATABASE_URL is set in project env; migrate deploy runs. No change.
- **CI without DB**: Some CI may run build for type-check only. Build succeeds; warning printed.
- **Local with .env.example only**: If user copies .env.example but doesn't add real DATABASE_URL, migrate would fail. Our fix: if DATABASE_URL is empty or placeholder, we could still skip. For simplicity, "not set" = undefined or empty string.
