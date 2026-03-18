# Spec: DB Connection Diagnostic — Observe Before Act

## Purpose

Add a diagnostic script that reports which database URL the app uses and whether that database has the expected tables. No speculation. No quick fixes. Just facts so we can decide what to do.

**Problem**: When the app shows "The table public.players does not exist," we don't know which env var won, which database we're hitting, or whether that database has tables. The app uses four possible env vars in a fixed order; `.env.local` is gitignored; there is no audit trail. Quick fixes without observation create more problems.

**Practice**: Deftness Development — observe first, then act. Single source of truth for URL resolution logic.

## Game Master Synthesis

The six faces agreed: **observe before acting**.

| Face | Perspective |
|------|-------------|
| **Architect** | Make the decision path observable; the system is a black box at runtime. |
| **Challenger** | Simplify or at least make the chosen URL visible at startup. |
| **Shaman** | Identify first; stop acting from assumption. |
| **Regent** | Run a diagnostic that reports: which env var won, direct vs Accelerate, and whether tables exist. |
| **Diplomat** | Shared understanding; document the diagnostic as the first step when DB issues arise. |
| **Sage** | Add a script that outputs facts. No speculation. Then decide. |

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Resolution logic** | Extract from `db.ts` to a shared module; diagnostic and app both use it. Single source of truth. |
| **Read-only** | Diagnostic does not modify the database. |
| **Redaction** | Print URL host/scheme only; never log secrets. |
| **Table check** | Query for `players` and `app_config` existence; these are the first tables the home page needs. |

## User Stories

### P1: See which URL the app uses

**As a** developer debugging DB issues, **I want** to run a command that prints which env var won and whether it's direct or Accelerate, **so** I know what the app is actually using.

**Acceptance**: `npm run diagnose:db` outputs: `Using PRISMA_DATABASE_URL (Accelerate)` or `Using DATABASE_URL` (or similar), with host redacted.

### P2: See if that database has tables

**As a** developer, **I want** the diagnostic to check whether `players` and `app_config` exist in the chosen database, **so** I know if migrations were applied.

**Acceptance**: Output includes `players: exists` or `players: missing`; same for `app_config`.

### P3: First step when DB issues arise

**As a** maintainer, **I want** the diagnostic documented as the first step in INCIDENTS.md and ENV_AND_VERCEL, **so** everyone runs it before applying fixes.

**Acceptance**: INCIDENTS.md incident #0 and docs/ENV_AND_VERCEL troubleshooting reference `npm run diagnose:db`.

## Functional Requirements

### Phase 1: Shared resolution module

- **FR1**: Extract URL resolution logic from `src/lib/db.ts` to `src/lib/db-resolve.ts`. Export `resolveDatabaseUrl(): { url, source, accelerate } | null`.
- **FR2**: Update `src/lib/db.ts` to import from `db-resolve.ts`; behavior unchanged.

### Phase 2: Diagnostic script

- **FR3**: Create `scripts/diagnose-db-connection.ts` that:
  1. Loads `.env.local` then `.env` (same as app)
  2. Calls `resolveDatabaseUrl()` from the shared module
  3. Prints which source won and whether Accelerate
  4. Redacts URL (host only, no password)
  5. Connects to the chosen URL and checks for `players` and `app_config` tables
  6. Prints `players: exists|missing`, `app_config: exists|missing`
- **FR4**: Add `npm run diagnose:db` to package.json.

### Phase 3: Documentation

- **FR5**: Update INCIDENTS.md incident #0 to say: "First run `npm run diagnose:db` to see which URL the app uses and whether tables exist."
- **FR6**: Add "DB connection diagnostic" to docs/ENV_AND_VERCEL.md troubleshooting.

## Non-Functional Requirements

- **Read-only**: No writes to the database.
- **No secrets in output**: Redact connection string; show only scheme and host.
- **Fast**: Complete in under 5 seconds or fail with clear error.

## Dependencies

- `src/lib/db.ts` — current resolution logic
- `scripts/diagnose-prod-db.ts` — reference for structure; different purpose (prod-only, uses DATABASE_URL only)

## References

- [src/lib/db.ts](../../src/lib/db.ts) — URL resolution
- [.specify/specs/dev-setup-anti-fragile/INCIDENTS.md](../dev-setup-anti-fragile/INCIDENTS.md) — incident #0
- [docs/ENV_AND_VERCEL.md](../../docs/ENV_AND_VERCEL.md) — env and troubleshooting
