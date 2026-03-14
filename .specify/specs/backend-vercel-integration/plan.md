# Plan: Backend–Vercel Integration

## Overview

Wire the Python FastAPI backend to production by (1) documenting env vars, (2) adding deployment config for Railway/Render, and (3) ensuring CORS and fallback behavior. No frontend code changes required — the contract exists.

## Phase 1: Documentation

### 1.1 Update ENV_AND_VERCEL.md

Add section **"Python Backend (Game Master Agents)"**:

- `NEXT_PUBLIC_BACKEND_URL` — Vercel env; URL of deployed backend (e.g. `https://bars-backend.railway.app`). Omit or leave empty to use fallback (direct OpenAI / deterministic).
- Backend env vars (for Railway/Render): `DATABASE_URL`, `OPENAI_API_KEY`, `CORS_ORIGINS` (comma-separated, include `https://<app>.vercel.app`).

### 1.2 Update backend/.env.example

Add `CORS_ORIGINS` with example:
```
CORS_ORIGINS=https://bars-engine.vercel.app,https://bars-engine-*.vercel.app
```

## Phase 2: Deployment Config

### 2.1 Railway

Create `backend/railway.json` (or `railway.toml`):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

Railway injects `PORT`; backend must use it. Update Dockerfile CMD or use `PORT` env.

### 2.2 Render (Alternative)

Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: bars-backend
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: CORS_ORIGINS
        sync: false
```

### 2.3 Port Handling

Railway and Render set `PORT`. The Dockerfile uses `8000`. Add to backend:

- Read `PORT` from env in `main.py` or use `uvicorn --port $PORT` in start command.
- Or: Keep Dockerfile at 8000; Railway/Render map external port to container 8000.

Check: Railway uses `PORT` env; Render uses `PORT`. Both expect the app to listen on `0.0.0.0:$PORT`.

Update `backend/Dockerfile` or add `start.sh` to use `PORT`:

```dockerfile
# In Dockerfile, or use railway/render start command override
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

## Phase 3: Verification

### 3.1 Local

1. `cd backend && uv run uvicorn app.main:app --reload`
2. `curl http://localhost:8000/api/health`
3. `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npm run dev` — agent calls should hit backend.

### 3.2 Production

1. Deploy backend to Railway (or Render).
2. Set backend env: `DATABASE_URL` (prod), `OPENAI_API_KEY`, `CORS_ORIGINS=https://<app>.vercel.app`
3. Set Vercel env: `NEXT_PUBLIC_BACKEND_URL=https://<backend-url>`
4. Redeploy Next.js.
5. Verify: Production app calls backend; `/api/health` returns 200.

## File Summary

| Action | File |
|--------|------|
| Update | `docs/ENV_AND_VERCEL.md` |
| Update | `backend/.env.example` |
| Create | `backend/railway.json` or `backend/render.yaml` |
| Optional | `backend/start.sh` for PORT handling |
