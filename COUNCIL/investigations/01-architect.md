# 🧠 Architect — Infrastructure Topology Analysis

## Component Map

### 1. Frontend — Next.js (Vercel)
- **What:** React SSR/SSG frontend, TypeScript, route-based architecture
- **Repo:** `/home/workspace/bars-engine/src/app/`
- **Key files:**
  - `src/app/page.tsx` (~550 lines) — authenticated player dashboard; reads `bars_player_id` cookie, renders quest threads, packs, charge capture, appreciations, campaign milestone guidance
  - `src/actions/onboarding.ts` — onboarding state machine (deprecated in favor of thread system)
  - `src/actions/instance.ts` — instance/campaign CRUD: `upsertInstance`, `updateInstanceFundraise`, `setActiveInstance`, `getActiveInstance`; catches schema drift gracefully
  - `src/lib/campaign-player-home.ts` — `resolveDefaultCampaignRef`, `needsCampaignOnboardingRoute`; BB hardcoded as fallback campaign
  - `src/app/api/health/route.ts` — public health check; queries 6 DB tables directly via Prisma; does NOT call Railway backend
- **Data model:** PostgreSQL via Prisma ORM (`prisma/schema.prisma`); datasource URL from `DATABASE_URL`
- **Env vars:** `DATABASE_URL`, `NEXT_PUBLIC_BACKEND_URL`

### 2. Backend — Python/FastAPI (Railway)
- **What:** Async Python API with FastAPI, pydantic-settings, asyncpg
- **Repo:** `/home/workspace/bars-engine/backend/`
- **Entrypoint:** `backend/app/main.py` — FastAPI app exposing `/healthz`, `/`, and routers for agents, strands, sprites
- **Config:** `backend/app/config.py` — loads from `backend/.env`, repo root `.env`, `.env.local` (in that priority order); normalizes `postgres://` → `postgresql+asyncpg://`
- **Key submodules:**
  - `app/agents/` — 7 GM face agents: `architect.py`, `challenger.py`, `diplomat.py`, `regent.py`, `sage.py`, `shaman.py`, `mind.py`, plus `_tools.py`, `_instructions.py`, `_lore.py`, `_iching.py`
  - `app/routes/` — agents, strands, sprites HTTP routes
  - `app/models/` — Pydantic models: `campaign.py`, `deck.py`, `economy.py`, `game.py`, `identity.py`, `knowledge.py`, `memory.py`, `narrative.py`, `player.py`, `quest.py`
  - `app/sprites/` — portrait + walkable sprite generation pipeline
  - `app/strand/` — strand creator and runner
- **Railway config:** `backend/railway.json` — Dockerfile build, start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Dockerfile:** `backend/Dockerfile` — `python:3.12-slim`, installs `uv`, exposes 8080, **CMD = `["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]`**

### 3. Vercel Serverless Python Wrapper
- **What:** `api/bars-engine.py` — minimal HTTP proxy for Vercel Python runtime
- **Proxies to:** `os.environ.get("BARS_ENGINE_URL", "https://bars-enginecore-production.up.railway.app")`
- **Problem:** This proxy is a stub — only handles `GET` with a minimal `BufferHTTPHandler`, ignores method/path body forwarding, returns raw string bodies as JSON
- **vercel.json:** `{"buildCommand": "", "installCommand": ""}` — build is suppressed/empty

### 4. Database — PostgreSQL
- **Provider:** `postgresql` via `DATABASE_URL` env var
- **ORM:** Prisma (`prisma/schema.prisma`) — ~50+ models covering players, quests, bars, instances, campaigns, I Ching, alchemy, sprites, BAR decks, trading, etc.
- **Key models:** `Instance`, `CustomBar`, `Bar`, `Player`, `QuestThread`, `PlayerQuest`, `Vibulon`, `Nation`, `Archetype`
- **Deployment:** Managed externally (not in this repo); connection string in `DATABASE_URL`

### 5. Registry
- **`public/registry.json`** — auto-generated API manifest (722 lines, ~360 deletions on last regen); documents every route in the Next.js frontend (admin pages, API routes, entity definitions, energy models, example requests)

---

## Connection Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Frontend                          │
│   Next.js (src/app/) — vercel.com deployment                    │
│   Builds: npm → next build                                      │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  GET /             → page.tsx (SSR, authenticated)       │  │
│   │  GET /api/health   → route.ts (Prisma direct DB check)   │  │
│   │  GET /event/*      → campaign pages                      │  │
│   │  GET /admin/*      → admin pages                         │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Reads: DATABASE_URL (Prisma)                                  │
│   NEXT_PUBLIC_BACKEND_URL → Railway backend URL                  │
│   (But no route currently uses NEXT_PUBLIC_BACKEND_URL!)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (when called)
                           │ ↓
┌──────────────────────────▼──────────────────────────────────────┐
│                   Railway Backend (Python)                        │
│   FastAPI @ bars-enginecore-production.up.railway.app            │
│   Routes: /healthz, /agents, /strands, /sprites                  │
│                                                                 │
│   Reads: DATABASE_URL (asyncpg), OPENAI_API_KEY, etc.            │
│   ⚠️ CURRENTLY RETURNING 502                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              Vercel Serverless Python (api/)                     │
│   api/bars-engine.py → proxies to Railway URL                    │
│   ⚠️ STUB ONLY — broken HTTP forwarding                          │
│   Vercel buildCommand="" — NOT actually building anything       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL                                  │
│   External DB; Prisma migrations via migrate deploy               │
│   Accessed by: Next.js (Prisma direct), Railway (asyncpg)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Changed

### Recent Commits (git log --oneline -20)
| Commit | Change |
|--------|--------|
| `d0df9fb` | `chore: refresh env` — `public/registry.json` regenerated (722 lines, 362 insertions/360 deletions, April 18 01:23 UTC) |
| `2bb6f57` | `fix: remove broken ToolManager import and serialize strand agent calls` |
| `66748e3` | `fix: backend Dockerfile PORT + pydantic-ai import fallback (Render deploy)` |
| `4b88519` | `fix: root Dockerfile for direct GitHub deploy + update render.yaml dockerfilePath` |
| `50913d9` | `fix: pydantic-ai 1.84.0 _tool_manager import path` |
| `5ca5cfe` | `Add Dockerfile and requirements.txt at repo root for Render` |
| `73f4eea` | `fix: disable vercel build commands so render.yaml docker config takes over` |
| `3955e99` | `feat: Vercel serverless backend with Python runtime` |
| `4fc86ff` | `feat: Vercel Python serverless fallback for backend` |
| `0d55e9d` | `fix: use $PORT for Railway auto-injection, remove hardcoded 8080` |

### Key Technical Changes

**1. Dockerfile CMD change (`backend/Dockerfile`):**
```dockerfile
# BEFORE (before 0d55e9d): hardcoded 8080
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]

# AFTER (current, from 0d55e9d): $PORT injection
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]
```
Note: `railway.json` already had `$PORT` in its startCommand; the Dockerfile was the only thing hardcoded.

**2. Dual-backend strategy introduced (commits `4fc86ff`, `3955e99`):**
- Railway is canonical production backend
- Vercel serverless Python (`api/`) is fallback/proxy layer
- `vercel.json` has empty `buildCommand` and `installCommand` — effectively disabled
- `api/bars-engine.py` is a stub: `BufferHTTPHandler` only does `GET`, ignores request method/body, returns raw string as body

**3. `.vercelignore` changed (commit `4fc86ff`):**
```diff
- backend  # Included now — Vercel Python runtime for serverless backend
+ # backend  # NOT excluded — uploads for serverless runtime
```
Backend Python code now uploads to Vercel (but `vercel.json` build is suppressed)

**4. Railway `railway.json` startCommand (commit `0d55e9d`):**
```json
"startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

**5. `NEXT_PUBLIC_BACKEND_URL` env var:**
- Points to Railway URL (`https://bars-enginecore-production.up.railway.app`)
- **Not used anywhere in the codebase** — grep found no references to `NEXT_PUBLIC_BACKEND_URL` or `BACKEND_URL`
- The frontend never calls the Railway backend from Next.js server-side code
- The health check at `src/app/api/health/route.ts` uses Prisma direct DB access, not HTTP

---

## Target State

### Correct Architecture (what it SHOULD look like)

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Browser         │────▶│  Vercel          │────▶│  Railway       │
│  (Player)        │     │  Next.js         │     │  FastAPI       │
│                  │◀────│  (SSR + API)     │◀────│  (Python)      │
└──────────────────┘     └──────────────────┘     └────────────────┘
                                │                         │
                                │ (server-side)           │
                                ▼                         │
                         ┌──────────────────┐            │
                         │  PostgreSQL      │◀───────────┘
                         │  (Prisma ORM)    │   (asyncpg)
                         └──────────────────┘
```

**Two valid deployment modes:**

**Mode A — Railway Primary, Vercel SSR Frontend:**
- Railway runs FastAPI: `/agents`, `/strands`, `/sprites`, `/healthz`
- Vercel Next.js does SSR and uses Railway for Python agent calls
- `NEXT_PUBLIC_BACKEND_URL` = Railway URL → used in server-side API calls
- Vercel serverless Python proxy = dormant/unused

**Mode B — Vercel Full-Stack (no Railway):**
- Vercel serverless Python handles `/api/agents`, `/api/strands` routes
- Proxies to Railway when available
- Railway backend becomes optional

---

## Critical Gaps

### Gap 1: Railway 502 — Root Cause Unknown
- Railway backend `https://bars-enginecore-production.up.railway.app` returns 502
- GitHub Actions deployment in progress
- Likely cause: **Railway `$PORT` not being injected at runtime**, or ** DATABASE_URL missing**, or **startup crash** (missing env var like `OPENAI_API_KEY`)
- `backend/app/main.py` has `/healthz` liveness probe — if Railway can't reach DB on startup, it may crash and return 502

### Gap 2: Vercel Serverless Proxy is a Non-Functional Stub
- `api/bars-engine.py`'s `BufferHTTPHandler.get()` only does `GET` on hardcoded root path `/`
- Request method, path, headers, and body are all ignored
- The `handler()` function calls `handler.get(path)` but the class ignores `path`!
- `vercel.json` has empty build/install commands — Vercel isn't actually building the Python layer

### Gap 3: No Frontend → Railway Connection
- `NEXT_PUBLIC_BACKEND_URL` exists in env but **zero code paths use it**
- The frontend `src/app/api/health/route.ts` does **direct Prisma DB queries** — it never calls Railway
- No server-side code calls Railway's FastAPI endpoints
- If the intent was to offload AI agent work to Railway, **no routes wire this up**

### Gap 4: Registry Regen on April 18 with No Schema Migration
- `public/registry.json` was regenerated at `2026-04-18T00:53:38.014Z`
- This coincides with an env refresh and potential schema drift
- If `instances` or `app_config` tables don't exist yet, `getActiveInstance()` (used on homepage) catches and warns — but other code paths may not

### Gap 5: Conflicting Dockerfiles
- `backend/Dockerfile` at repo root — for Railway GitHub App build context
- `render.yaml` at root — alternative deployment config
- Root-level `Dockerfile` and `requirements.txt` added in commit `5ca5fce` for Render
- Two deployment targets with no clear canonical path

---

## Top 3 Action Items for Morning

### 1. Diagnose Railway 502
**Problem:** Railway backend is down. This blocks all Python agent work (agents, strands, sprites).
**Steps:**
- [ ] Check Railway dashboard for logs: `tail /dev/shm/railway*.log` or loki query
- [ ] Verify `DATABASE_URL`, `OPENAI_API_KEY`, and all required env vars are set in Railway env vars
- [ ] Check if startup crash: Railway liveness probe `/healthz` may be returning 200 but the app is crashing after
- [ ] Try a direct curl: `curl -v https://bars-enginecore-production.up.railway.app/healthz`
- [ ] If startup crash: add temporary `print(settings.database_url)` debug in `main.py` lifespan

### 2. Fix or Remove Vercel Serverless Proxy
**Problem:** `api/bars-engine.py` is a non-functional stub that provides false confidence.
**Decision needed:** Is Vercel serverless Python meant to be a real fallback or was it abandoned?
- **If real:** Fix `handler()` to properly forward method, path, headers, body to Railway using `httpx`; update `vercel.json` with actual build commands
- **If abandoned:** Delete `api/`, remove backend from `.vercelignore` exclusion, remove `4fc86ff`/`3955e99` commits from Vercel

### 3. Wire Up `NEXT_PUBLIC_BACKEND_URL` or Kill It
**Problem:** The env var exists but no code uses it. If Railway is the canonical backend for AI work, something should be calling it.
**Decision needed:** Does the Next.js frontend need to call Railway backend?
- **If yes:** Find the call sites (search for any `fetch` to `NEXT_PUBLIC_BACKEND_URL`) and wire up the agent routes
- **If no:** Remove `NEXT_PUBLIC_BACKEND_URL` from all env configs to avoid confusion

---

## Supporting Evidence

**Files read:**
- `src/app/page.tsx` — authenticated dashboard, Prisma direct DB access
- `src/actions/onboarding.ts` — deprecated boolean-flag onboarding
- `src/actions/instance.ts` — instance CRUD with schema-drift tolerance
- `src/lib/campaign-player-home.ts` — BB hardcoded fallback
- `prisma/schema.prisma` — 50+ models, PostgreSQL
- `public/registry.json` — ~360-line diff from April 18 regen
- `backend/app/main.py` — FastAPI with `/healthz`, CORS
- `backend/app/config.py` — pydantic-settings, env_file load order, URL normalization
- `backend/railway.json` — `$PORT` startCommand
- `backend/Dockerfile` — `CMD ["uvicorn", "app.main:app", ...]`
- `api/bars-engine.py` — stub proxy with broken `BufferHTTPHandler`
- `.vercelignore` — backend was previously excluded, now included
- `vercel.json` — empty build/install commands
- `git log --oneline -20` — full commit history
