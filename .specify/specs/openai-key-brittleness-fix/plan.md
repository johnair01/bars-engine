# Plan: OpenAI Key Brittleness Fix

## Overview

Fix env loading across backend, MCP wrapper, and health visibility. Use absolute paths in backend config; load dotenv in MCP wrapper; expose openai_configured in health; add loop:ready agent check.

## Phase 1: Backend Config

### 1.1 Update `backend/app/config.py`

- Import `Path` from `pathlib`
- Compute `_backend_root = Path(__file__).resolve().parent.parent` (backend/)
- Compute `_repo_root = _backend_root.parent`
- Set `env_file` to `(str(_backend_root / ".env"), str(_repo_root / ".env.local"))`
- Remove CWD-relative paths

## Phase 2: MCP Wrapper

### 2.1 Update `scripts/mcp-serve-with-backend.ts`

- Add `import { config } from 'dotenv'` at top
- Before `ensureBackendReady`, call `config({ path: '.env.local' })` and `config({ path: '.env' })`
- Ensures process.env has OPENAI_API_KEY when spawning backend and MCP

## Phase 3: Health Endpoint

### 3.1 Update `backend/app/routes/health.py`

- In `health_check()`, add `openai_configured: bool(settings.openai_api_key.get_secret_value())` to response
- Response shape: `{"status": "ok", "environment": "...", "openai_configured": true|false}`

## Phase 4: loop:ready

### 4.1 Update `scripts/loop-readiness.ts`

- After existing checks, add optional agent health check
- Get backend URL from `process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'`
- Fetch `GET ${url}/api/health` (with short timeout, non-blocking)
- If response has `openai_configured: false`, add result with remediation hint
- If backend unreachable, skip (don't fail loop:ready)

## File Impacts

| File | Action |
|------|--------|
| `backend/app/config.py` | Modify env_file paths |
| `scripts/mcp-serve-with-backend.ts` | Add dotenv loading |
| `backend/app/routes/health.py` | Add openai_configured |
| `scripts/loop-readiness.ts` | Add agent health check |
