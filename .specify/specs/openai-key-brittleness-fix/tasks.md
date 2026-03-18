# Tasks: OpenAI Key Brittleness Fix

## Phase 1: Backend Config

- [x] **1.1** Update `backend/app/config.py`
  - Import Path from pathlib
  - Compute _backend_root, _repo_root from __file__
  - Use absolute paths for env_file

## Phase 2: MCP Wrapper

- [x] **2.1** Update `scripts/mcp-serve-with-backend.ts`
  - Import config from dotenv
  - Load .env.local first, then .env before ensureBackendReady

## Phase 3: Health Endpoint

- [x] **3.1** Update `backend/app/routes/health.py`
  - Add openai_configured to health_check response

## Phase 4: loop:ready

- [x] **4.1** Update `scripts/loop-readiness.ts`
  - Add agent health check when backend reachable
  - Report openai_configured; remediation if false

## Verification

- [ ] **V1** Backend runs with key from .env.local; /api/health returns openai_configured: true
- [ ] **V2** MCP wrapper spawns backend with env; agents get AI when key present
- [ ] **V3** npm run loop:ready reports agent health
