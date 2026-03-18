# Tasks: DB Connection Diagnostic

## Phase 1: Extract resolution logic

- [x] **1.1** Create `src/lib/db-resolve.ts`
  - `isPostgresUrl(url)`, `isAccelerateUrl(url)`, `resolveDatabaseUrl()` — same logic as current db.ts
  - Export `resolveDatabaseUrl`
- [x] **1.2** Update `src/lib/db.ts` to import `resolveDatabaseUrl` from `./db-resolve`; remove inlined functions

## Phase 2: Diagnostic script

- [x] **2.1** Create `scripts/diagnose-db-connection.ts`
  - Load .env.local, .env
  - Import resolveDatabaseUrl from db-resolve
  - If null → exit 1 with "No valid DB URL found"
  - Print: Using ${source} (Accelerate) or Using ${source}
  - Redact URL (host only, no password)
  - Create PrismaClient: use withAccelerate when URL is prisma+postgres
  - Connect; on failure exit 1 with clear message
  - Check information_schema for players, app_config
  - Print players: exists|missing, app_config: exists|missing
- [x] **2.2** Add `"diagnose:db": "tsx scripts/diagnose-db-connection.ts"` to package.json

## Phase 3: Documentation

- [x] **3.1** Update INCIDENTS.md incident #0: add "First run npm run diagnose:db to see which URL the app uses and whether tables exist."
- [x] **3.2** Update docs/ENV_AND_VERCEL.md: add DB connection diagnostic to troubleshooting

## Verification

- [x] **V1** Run `npm run diagnose:db` — outputs which source won, redacted URL, table status
- [x] **V2** With PRISMA_DATABASE_URL set → shows Accelerate
- [x] **V3** With only DATABASE_URL → shows DATABASE_URL (implied by resolution logic)
- [x] **V4** `npm run build` and `npm run check` pass
