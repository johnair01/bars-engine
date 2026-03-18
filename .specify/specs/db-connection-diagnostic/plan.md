# Plan: DB Connection Diagnostic

## Summary

Extract URL resolution logic to a shared module, create a diagnostic script that reports which URL the app uses and whether the chosen database has the expected tables, and document it as the first step when DB issues arise.

## Implementation Order

### Phase 1: Extract resolution logic

1. **Create `src/lib/db-resolve.ts`**
   - Move `isPostgresUrl`, `isAccelerateUrl`, `resolveDatabaseUrl` from db.ts
   - Export `resolveDatabaseUrl` (and optionally the helpers if needed)
   - Use same candidate order: PRISMA_DATABASE_URL, POSTGRES_PRISMA_URL, DATABASE_URL, POSTGRES_URL

2. **Update `src/lib/db.ts`**
   - Import `resolveDatabaseUrl` from `./db-resolve`
   - Remove the inlined functions
   - Behavior unchanged; existing `[DB] Using ...` log stays

### Phase 2: Diagnostic script

3. **Create `scripts/diagnose-db-connection.ts`**
   - Load env: `config({ path: '.env.local' })`, `config({ path: '.env' })`
   - Import `resolveDatabaseUrl` from `../src/lib/db-resolve`
   - Call `resolveDatabaseUrl()`; if null, exit with "No valid DB URL found"
   - Print: `Using ${source}${accelerate ? ' (Accelerate)' : ''}`
   - Redact URL: parse as URL, print `***@${hostname}` (or scheme + host only)
   - Create PrismaClient with the resolved URL (use direct client for Accelerate URLs too — Prisma handles it)
   - Connect: `$connect()` + `$queryRaw\`SELECT 1\``
   - Check tables: `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='players')` (and same for `app_config`)
   - Print: `players: exists` or `players: missing`; `app_config: exists` or `app_config: missing`
   - Catch errors; exit 1 on connection failure with clear message

4. **Add npm script**
   - `"diagnose:db": "tsx scripts/diagnose-db-connection.ts"`

### Phase 3: Documentation

5. **Update INCIDENTS.md**
   - In incident #0 (Home page 500 — table does not exist), add: "First run `npm run diagnose:db` to see which URL the app uses and whether tables exist."

6. **Update docs/ENV_AND_VERCEL.md**
   - In "Confirm you have database access" or "Troubleshooting", add a subsection: "DB connection diagnostic — run `npm run diagnose:db` to see which env var the app uses and whether the chosen database has tables."

## File Impacts

| Action | File |
|--------|------|
| Create | `src/lib/db-resolve.ts` |
| Edit | `src/lib/db.ts` — import from db-resolve |
| Create | `scripts/diagnose-db-connection.ts` |
| Edit | `package.json` — add diagnose:db |
| Edit | `.specify/specs/dev-setup-anti-fragile/INCIDENTS.md` — incident #0 |
| Edit | `docs/ENV_AND_VERCEL.md` — troubleshooting |

## Verification

- Run `npm run diagnose:db` with .env.local containing PRISMA_DATABASE_URL → output shows "Using PRISMA_DATABASE_URL (Accelerate)"
- Run with only DATABASE_URL set → output shows "Using DATABASE_URL"
- Run against DB with tables → output shows "players: exists", "app_config: exists"
- Run against empty DB → output shows "players: missing", "app_config: missing"
- No secrets in output
- `npm run build` and `npm run check` pass
