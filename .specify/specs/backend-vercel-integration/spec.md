# Spec: Backend–Vercel Integration

## Purpose

Deploy the Python FastAPI backend (Game Master agents, orientation quest) alongside the Next.js app on Vercel. Vercel does not run Python serverless; the backend runs as a separate service. This spec defines the contract, env, and deployment path so the frontend can call the backend in production.

**Problem**: The backend exists in `backend/` but is not deployed. Production uses only Next.js on Vercel; agent calls fall back to direct OpenAI or deterministic logic. To use the full agent framework in production, the backend must be hosted elsewhere and wired via `NEXT_PUBLIC_BACKEND_URL`.

**Practice**: Deftness Development — API-first (contract exists), spec kit first, graceful degradation preserved.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Backend hosting** | Deploy to Railway, Render, or Fly.io — Vercel does not support Python serverless |
| **Contract** | Existing: `agent-client.ts` → `POST ${BACKEND_URL}/api/agents${path}`. No change. |
| **Database** | Backend and Next.js share the same `DATABASE_URL` (production Postgres) |
| **Fallback** | Preserve three-tier: Backend → Direct OpenAI → Deterministic. App works when backend is down. |

## API Contracts (Already Defined)

The frontend calls the backend at `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:8000`).

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Backend availability check |
| `/api/agents/architect/draft` | POST | Quest draft from narrative lock |
| `/api/agents/architect/compile` | POST | Compile quest from unpacking answers |
| `/api/agents/challenger/propose` | POST | Propose moves |
| `/api/agents/diplomat/*` | POST | Community guidance |
| `/api/agents/regent/assess` | POST | Campaign assessment |
| `/api/agents/sage/consult` | POST | Sage meta-agent routing |
| `/api/agents/shaman/*` | POST | Emotional reading |
| `/api/agents/mapping-proposer/propose` | POST | Mapping proposal |

See [src/lib/agent-client.ts](../../src/lib/agent-client.ts) and [backend/app/routes/agents.py](../../backend/app/routes/agents.py).

## User Stories

### P1: Production agent calls

**As a developer**, I want the production Next.js app to call the Python backend when available, so users get the full Game Master agent experience (Architect, Sage, etc.) in production.

**Acceptance**: Set `NEXT_PUBLIC_BACKEND_URL` in Vercel; production app calls backend; fallback works when backend is down.

### P2: Backend deployment

**As a developer**, I want to deploy the backend to a Python-capable host with minimal config, so the backend runs in production.

**Acceptance**: One-command deploy (Railway/Render/Fly.io); backend uses production `DATABASE_URL`; CORS allows Vercel origin.

## Functional Requirements

### Phase 1: Documentation and Config

- **FR1**: Document `NEXT_PUBLIC_BACKEND_URL` in `docs/ENV_AND_VERCEL.md` — purpose, format, when to set.
- **FR2**: Document backend env vars (`DATABASE_URL`, `OPENAI_API_KEY`, `CORS_ORIGINS`) in `docs/ENV_AND_VERCEL.md`.
- **FR3**: Add `CORS_ORIGINS` to `backend/.env.example` with example production value.

### Phase 2: Deployment Config

- **FR4**: Add `railway.json` or `render.yaml` (or equivalent) for one-click deploy to Railway/Render.
- **FR5**: Backend `Dockerfile` and `docker-compose.yml` remain usable for local dev.

### Phase 3: Verification

- **FR6**: Fallback chain MUST remain: `isBackendAvailable()` → backend call; on failure → direct OpenAI or deterministic.
- **FR7**: Backend health check at `/api/health` returns 200 when DB is reachable.

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| **Backend hosting** | Railway/Render/Fly.io — Python supported |
| **CORS** | `CORS_ORIGINS` includes `https://<app>.vercel.app` |
| **Env** | Document in `docs/ENV_AND_VERCEL.md` |
| **Graceful degradation** | `agent-client.ts` fallback chain preserved |

## Dependencies

- Backend and agent-client (merged in integration branch)
- [deftness-development](.agents/skills/deftness-development/SKILL.md) — scaling robustness

## References

- [backend/app/main.py](../../backend/app/main.py) — FastAPI app, CORS
- [src/lib/agent-client.ts](../../src/lib/agent-client.ts) — frontend client
- [docs/ENV_AND_VERCEL.md](../../docs/ENV_AND_VERCEL.md) — env documentation
