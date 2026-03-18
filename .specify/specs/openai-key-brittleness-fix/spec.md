# Spec: OpenAI Key Brittleness Fix

## Purpose

Fix env loading brittleness so OPENAI_API_KEY is reliably available to the backend and agents. Link key health → agent health → project health.

**Problem**: The key exists in `.env.local` but agents get deterministic fallbacks because env loading is brittle across execution contexts: backend uses CWD-relative env_file paths; MCP wrapper doesn't load dotenv; no visibility into whether the backend has the key.

**Practice**: Deftness Development — spec kit first, deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Backend env_file** | Use absolute path from config file location; avoid CWD sensitivity |
| **MCP wrapper** | Load dotenv (.env.local, .env) before spawning children |
| **Health** | Add `openai_configured: bool` to `/api/health` — links key to agent readiness |
| **loop:ready** | When backend reachable, report openai_configured; print remediation if false |

## User Stories

### P1: Backend loads key regardless of CWD

**As a developer**, I want the backend to load OPENAI_API_KEY from `.env.local` regardless of the working directory it was started from, so agents work when the backend is started from different contexts (terminal, Cursor, MCP wrapper).

**Acceptance**: Backend config uses absolute path for env_file; key loads when `.env.local` exists at repo root.

### P2: MCP wrapper passes env to children

**As a developer**, I want the MCP wrapper to load `.env.local` before spawning the backend and MCP server, so children inherit OPENAI_API_KEY when Cursor spawns the wrapper.

**Acceptance**: MCP wrapper loads dotenv at startup; `process.env` includes vars from `.env.local`.

### P3: Health endpoint exposes agent readiness

**As a developer**, I want `/api/health` to report whether OPENAI_API_KEY is configured in the backend, so I can diagnose agent fallbacks.

**Acceptance**: `GET /api/health` returns `openai_configured: true|false`.

### P4: loop:ready reports agent health

**As a developer**, I want `npm run loop:ready` to report agent health when the backend is reachable, so project health includes agent readiness.

**Acceptance**: loop:ready calls `/api/health` when backend is up; prints openai_configured status and remediation if false.

## Functional Requirements

- **FR1**: Backend config uses `Path(__file__).resolve()` to compute absolute paths for `.env` and `.env.local`; env_file no longer CWD-relative.
- **FR2**: MCP wrapper imports dotenv and calls `config({ path: '.env.local' })`, `config({ path: '.env' })` before any spawn.
- **FR3**: `/api/health` response includes `openai_configured: bool` (True if `settings.openai_api_key.get_secret_value()`).
- **FR4**: loop-readiness.ts fetches `/api/health` when backend URL is known; reports openai_configured; if false, prints remediation hint.

## Non-Functional Requirements

- openai_configured does not expose the key value; only presence.
- loop:ready must not fail if backend is unreachable; agent check is best-effort.

## Dependencies

- [game-master-agents-cursor-integration](.specify/specs/game-master-agents-cursor-integration/) — MCP wrapper exists
- [docs/OPENAI_KEY_BRITTLENESS_ANALYSIS.md](../../docs/OPENAI_KEY_BRITTLENESS_ANALYSIS.md)

## References

- [backend/app/config.py](../../backend/app/config.py)
- [scripts/mcp-serve-with-backend.ts](../../scripts/mcp-serve-with-backend.ts)
- [backend/app/routes/health.py](../../backend/app/routes/health.py)
- [scripts/loop-readiness.ts](../../scripts/loop-readiness.ts)
