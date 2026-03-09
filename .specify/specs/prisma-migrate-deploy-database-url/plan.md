# Plan: Prisma Migrate Deploy — Graceful When DATABASE_URL Missing

## Summary

Create `scripts/build-with-migrate.ts` that conditionally runs `prisma migrate deploy` only when DATABASE_URL is set. When unset, run `prisma generate && next build` and print a clear warning. Update package.json build script.

## Phases

### Phase 1: Build script

1. **Create scripts/build-with-migrate.ts**
   - Load dotenv: `.env` then `.env.local`
   - Check: `process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL`
   - If set: `execSync('prisma migrate deploy && next build', { stdio: 'inherit', shell: true })`
   - If not set: `execSync('prisma generate && next build', { stdio: 'inherit', shell: true })` and `console.warn('⚠ DATABASE_URL not set. Skipping prisma migrate deploy. Run npm run env:pull or add DATABASE_URL to .env.local for full build.')`

2. **Update package.json**
   - `"build": "tsx scripts/build-with-migrate.ts"`

### Phase 2: Documentation

3. **Update docs/ENV_AND_VERCEL.md**
   - Add short note: "Build without DATABASE_URL: `npm run build` will skip `prisma migrate deploy` and still run `next build`. For full build (including migrations), set DATABASE_URL via `npm run env:pull` or `.env.local`."

## Verification

- `DATABASE_URL` unset: `npm run build` succeeds; warning printed
- `DATABASE_URL` set: `npm run build` runs migrate deploy then next build
- `npm run check` still works (unchanged)
