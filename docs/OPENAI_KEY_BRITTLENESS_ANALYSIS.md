# OpenAI Key Brittleness Analysis

## Core Issue

The OpenAI key is only brittle in the places where it is **loaded**, not where it is **called**. The key exists in `.env.local` and hasn't changed. The failure is in **env loading across different execution contexts**.

## Execution Contexts and Env Loading

| Context | How env is loaded | OPENAI_API_KEY source |
|---------|-------------------|------------------------|
| **Node scripts** (sage-brief, sage-deft-plan, etc.) | `require-db-env` or explicit `config({ path: '.env.local' })` | Loaded from repo root `.env.local` |
| **Backend** (FastAPI, uvicorn) | pydantic-settings `env_file: (".env", "../.env.local")` | **CWD-relative** — `../.env.local` = repo root only when cwd=backend/ |
| **MCP wrapper** | **None** — does not load dotenv | Passes `process.env` to children; inherits from Cursor (may be minimal) |
| **MCP server** (bars-agents) | Same as backend — pydantic-settings | CWD=backend when spawned by wrapper |

## What Has Changed

1. **MCP wrapper** — Added `mcp-serve-with-backend.ts`. It does not import `require-db-env` or load dotenv. When Cursor spawns it, the wrapper's `process.env` may not have the key. So when it spawns the backend (via `ensureBackendReady`), the backend gets env from the wrapper. The backend then relies on pydantic's `env_file` loading.

2. **Backend env_file path** — `"../.env.local"` is **relative to CWD**. Pydantic-settings resolves env_file paths relative to the current working directory, not the config file location. If the backend ever runs with cwd ≠ backend/, the path breaks.

3. **Multiple spawn chains** — Backend can be started by:
   - User: `npm run dev:backend` (cwd=repo root for npm; uvicorn cwd=backend)
   - ensureBackendReady from sage-brief (has require-db-env → env loaded)
   - ensureBackendReady from MCP wrapper (no env loading → backend must use env_file)

## Root Cause

**CWD-sensitive env_file path** + **no env preloading in MCP wrapper** = brittle. When the backend runs, it must succeed at loading from `../.env.local`. If cwd is wrong, or the path resolution differs (e.g. in Docker, CI, or when run from a different directory), the key is missing.

## Linking Health: Key → Agents → Project

| Layer | Current | Proposed |
|-------|---------|----------|
| **Key health** | `npm run smoke` checks Node process env | Add backend `/api/health` check for `openai_configured` |
| **Agent health** | None | Agents use deterministic fallback when key missing; no visibility | Add `openai_configured: bool` to `/api/health` |
| **Project health** | `loop:ready` checks build, DB, feedback cap | Add optional agent health check | `loop:ready` can call `/api/health` and report `openai_configured` |

## Proposed Fixes

### 1. Backend config: use absolute path for env_file

Avoid CWD sensitivity:

```python
from pathlib import Path
_backend_root = Path(__file__).resolve().parent.parent  # backend/
_repo_root = _backend_root.parent
model_config = {
    "env_file": (
        str(_backend_root / ".env"),
        str(_repo_root / ".env.local"),
    ),
    ...
}
```

### 2. MCP wrapper: load env before spawning

Ensure the wrapper passes env to children:

```python
// At top of mcp-serve-with-backend.ts
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })
```

### 3. Health endpoint: expose OPENAI_API_KEY status

Add to `/api/health` or create `/api/health/agents`:

```python
{
  "status": "ok",
  "openai_configured": bool,  # True if settings.openai_api_key.get_secret_value()
  "environment": "development"
}
```

### 4. loop:ready: optional agent health check

When backend is reachable, call `/api/health` and report `openai_configured`. If false, print remediation: "OPENAI_API_KEY not loaded in backend. Add to .env.local, restart backend."

### 5. ensureBackendReady: pass env explicitly

When spawning the backend, ensure we pass env that includes .env.local. The spawn already uses `env: process.env`. The parent (sage-brief) has require-db-env. The parent (MCP wrapper) does not. Fix: MCP wrapper loads env (see #2).

## Files to Change

| File | Change |
|------|--------|
| `backend/app/config.py` | Use absolute path for env_file |
| `scripts/mcp-serve-with-backend.ts` | Load dotenv before ensureBackendReady |
| `backend/app/routes/health.py` | Add `openai_configured` to response |
| `scripts/loop-readiness.ts` | Optional: check backend health, report openai_configured |
| `docs/AGENT_WORKFLOWS.md` | Link to this analysis |
