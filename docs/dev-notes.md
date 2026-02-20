# Conclave Development Notes: Crash Prevention & Resilience

This document outlines common runtime crash patterns observed during development and establishes mechanisms to prevent them from breaking the application.

## 1. Error Classes & Prevention

### A) Critical-Path DB Query in RootLayout
- **Symptom**: The entire application fails to render at `/` (Server Error 500).
- **Cause**: Database connection failures (e.g., missing `DATABASE_URL` or unreachable instance) occurring during the initial auth check in `RootLayout`.
- **Mitigation**: 
  - Wrapped `db` calls in `RootLayout` with `try/catch`.
  - Implemented "Guest Mode" fallback.
- **Prevention**: Use lazy initialization in `src/lib/db.ts` to prevent module-load crashes. Tolerated outages in higher-level layout components.

### B) Undefined Identifier / Renamed Props
- **Symptom**: Client-side or Server-side crash with `X is not defined`.
- **Cause**: Using variables in JSX or components that weren't correctly extracted from props or state (e.g., `focusQuest`).
- **Mitigation**: Ensured all search parameters are correctly awaited and defined before use in Server Components.
- **Prevention**: Strict TypeScript prop typing. Run `npm run check` (`next lint && tsc --noEmit`) before major commits.

### C) Schema Mismatch / Stale Prisma Client
- **Symptom**: `PrismaClientInitializationError` or `InconsistentModelError`.
- **Cause**: Local developer's `node_modules` are out of sync with the current `prisma/schema.prisma`.
- **Mitigation**: Added `db:sync` to the build process.
- **Prevention**: Use the `smoke` script (`npm run smoke`) to verify environment and database health.

## 2. Safety Mechanisms

### Dev-Only Warning Banner
When the database is unreachable in a non-production environment, a red warning banner appears at the top of the UI. This alerts developers to environmental issues without completely killing the preview.

### Preflight Checks
The `scripts/preflight-env.ts` script checks for essential configuration before the application starts.

## 3. Recommended Workflow
1.  **Sync**: `npm run db:sync` after pulling changes.
2.  **Verify**: `npm run check` to catch type errors.
3.  **Sanity**: `npm run smoke` to ensure the environment is healthy.
