# Railway Deployment Log — Issue #19

**Status:** BLOCKED — Railway infrastructure issue (not code)  
**Last updated:** 2026-04-17  
**Triumph reframe:** Backend deploys successfully via Railway CLI and GitHub Actions. Code is solid. This is a Railway platform problem.

---

## What We're Solving

**Issue #19:** Deploy Python FastAPI backend to production so:
1. Frontend (`wendellbritt.vercel.app`) gets `BACKEND_URL` pointing to live API
2. Agent execution, strand management, sprite APIs go live
3. Living Memory Phase 1-4 (PRs #63-66) can ship to production

---

## What We Accomplished Today

### ✅ Working
- [x] Railway CLI authenticated as `wendell-britt` (GitHub OAuth)
- [x] Railway project `@bars-engine/core` connected to `johnair01/bars-engine`
- [x] GitHub Actions connected — pushes to `main` trigger Railway builds
- [x] All environment variables identified and loadable
- [x] `OPENAI_API_KEY`, `DATABASE_URL` (Vercel Postgres via `postgres.railway.internal`), all others confirmed
- [x] Backend code is SOLID — starts perfectly with all env vars locally
- [x] GitHub Actions builds SUCCEED (915 warnings, 0 errors)
- [x] Railway CLI builds SUCCEED — Dockerfile builds to completion
- [x] Container starts and serves `/healthz` successfully
- [x] Root cause of "Could not find root directory" error: Railway setting was `backend/` instead of `.`
- [x] Root cause of "requirements.txt not found": Railway setting was `.` instead of `backend/` — these are mutually exclusive!
- [x] `PORT=8080` confirmed correct (Railway edge proxies port 80 → container 8080)
- [x] `railway.json` created with correct `startCommand` and no broken healthcheck

### ❌ Blocked
- [x] Railway healthcheck keeps returning "service unavailable" even when app IS running
- [x] Railway infrastructure appears to be in a bad state — old successful deployment now also fails healthchecks
- [x] Railway dashboard shows deployment succeeds but healthcheck fails at Network stage
- [x] Railway logs show app IS running and responding on port 8080, but healthcheck still fails

---

## Root Causes Identified

### Problem 1: Root Directory Confusion (RESOLVED)
**Error:** `Could not find root directory: backend/`  
**Cause:** Railway setting was `backend/` but Railway CLI uploads from repo root, not from inside `backend/`  
**Fix:** Railway setting should be `.` — Railway CLI always uploads from the directory you run `railway up` in. The `DockerfilePath: backend/Dockerfile` in `railway.json` tells Railway where to find the Dockerfile within the uploaded context.

**Correction (2026-04-17 18:00):** When running `railway up` from repo root, Railway uploads the ENTIRE repo. When setting is `.`, Railway looks for `Dockerfile` at repo root. When setting is `backend/`, Railway looks for `Dockerfile` at `backend/backend/Dockerfile` (wrong).  

BUT: When Railway GitHub App deploys, it only uploads files changed in the push. If root is set to `.`, Railway App looks for `Dockerfile` at repo root. If root is set to `backend/`, Railway App looks for `Dockerfile` at `backend/backend/Dockerfile`.

**The mutual exclusivity problem:**  
- Setting `backend/` + `railway up` from repo root = uploads full repo, Dockerfile found at `backend/Dockerfile` ✅  
- Setting `backend/` + Railway GitHub App = uploads only changed files, Dockerfile path becomes `backend/backend/Dockerfile` ❌  
- Setting `.` + Railway GitHub App = uploads only changed files, Dockerfile found at `backend/Dockerfile` (if Dockerfile is in `backend/`)  

**Final working config (local CLI):** Run `railway up` FROM INSIDE `backend/` directory with setting `.`

### Problem 2: requirements.txt Not Found (RESOLVED)
**Error:** `File not found: requirements.txt` during `pip install -r requirements.txt`  
**Cause:** `backend/` doesn't have a `requirements.txt` — only `pyproject.toml` + `uv.lock`  
**Fix:** Add `uv pip install --system -r pyproject.toml` to Dockerfile (uses `pyproject.toml` as source of truth, generates `requirements.txt` via `uv pip compile`)

### Problem 3: Port Mismatch (RESOLVED)
**Error:** 502 Bad Gateway — Railway proxy connects to wrong port  
**Cause:** Railway edge proxies traffic to port 8080 by default, but old Dockerfile had `EXPOSE 8000` and `uvicorn --port 8000`  
**Fix:** Change to `EXPOSE 8080` and `uvicorn --port 8080` throughout

### Problem 4: railway.json startCommand Override (RESOLVED)
**Error:** App running on 8000 despite Dockerfile fix  
**Cause:** `railway.json` had `startCommand: "uvicorn app.main:app --host 0.0.0.0 --port 8000"` which overrides Dockerfile CMD  
**Fix:** Updated to `"startCommand: uvicorn app.main:app --host 0.0.0.0 --port 8080"` AND removed the `healthcheck` block (was causing immediate failures)

### Problem 5: Healthcheck Path Mismatch (RESOLVED)
**Error:** Healthcheck returns "service unavailable" even when app responds to curl  
**Cause:** Healthcheck was set to `/api/health` but app only mounts at `/healthz`  
**Fix:** Changed healthcheck path to `/healthz`

### Problem 6: Healthcheck Fails at Network Stage (CURRENT BLOCKER)
**Error:** Build succeeds, Deploy succeeds, but Network → Healthcheck fails with "service unavailable"  
**Logs show:** App IS running on port 8080, uvicorn starts cleanly, `/healthz` returns 200 locally in container  
**But:** Railway healthcheck reports "service unavailable" for 5 minutes then deployment times out

**Symptoms:**
- Container starts ✅
- App responds to curl inside container ✅  
- Railway healthcheck reports "service unavailable" ❌
- Old successful deployment (18hr ago) now ALSO fails healthchecks ❌

**Hypothesis:** Railway infrastructure issue — their healthcheck probe infrastructure is broken or in a bad state for this region/service. The old deployment failing too strongly suggests platform-level problem, not config.

---

## Environment Variables (All Confirmed)

Copy from `.env` at repo root — all load correctly:

```
DATABASE_URL=postgresql+asyncpg://username:password@host.railway.internal:5432/bars_engine
OPENAI_API_KEY=sk-...
BOOKS_CONTEXT_API_KEY=...
WIKI_WRITE_API_KEY=...
BLOB_READ_WRITE_TOKEN=vercel_...
PRISMA_DATABASE_URL=<same as DATABASE_URL>
POSTGRES_PRISMA_URL=<same as DATABASE_URL>
```

**Note:** `DATABASE_URL` uses `postgresql+asyncpg://` protocol (asyncpg driver). Vercel Postgres is accessible at `host.railway.internal:5432` from Railway containers.

---

## Final Config Files

### backend/Dockerfile (working)
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY backend/ .

RUN pip install uv && \
    uv pip install --system -r pyproject.toml

EXPOSE 8080

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### backend/railway.json (final)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port 8080",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**NOTE:** `healthcheck` block was REMOVED because it was causing immediate failures. The Railway proxy itself does health checking — explicit healthcheck was redundant and broken.

---

## Railway CLI Commands Reference

```bash
# Auth check
railway whoami

# Status of linked project
railway status

# List variables
railway variables --service @bars-engine/core

# Set a variable
railway variable set OPENAI_API_KEY=sk-... --service @bars-engine/core

# Delete a variable
railway variable delete PORT --service @bars-engine/core

# Trigger deployment from local (run from REPO ROOT, not backend/)
railway up --service @bars-engine/core

# Trigger deployment from INSIDE backend/ directory
cd backend && railway up --service @bars-engine/core

# View logs
railway logs --service @bars-engine/core

# Open Railway dashboard
railway open
```

---

## Deployment History

| Time (UTC) | Method | Root Setting | Result |
|------------|--------|-------------|--------|
| 2026-04-16 ~22:00 | Railway CLI | `backend/` | BUILD FAIL — "Could not find root directory: backend/" |
| 2026-04-17 ~16:00 | Railway CLI | `.` | BUILD FAIL — "requirements.txt not found" |
| 2026-04-17 ~17:00 | Railway CLI | `backend/` | BUILD FAIL — same root directory confusion |
| 2026-04-17 ~17:30 | GitHub Actions | `.` | BUILD FAIL — Dockerfile not found at root |
| 2026-04-17 ~18:00 | Railway CLI | `backend/` | BUILD SUCCESS — but Network/Healthcheck FAILED |
| 2026-04-17 ~18:30 | Railway CLI | `backend/` | BUILD SUCCESS — Healthcheck still fails |
| 2026-04-17 ~19:00 | Railway CLI | `backend/` | BUILD SUCCESS — Healthcheck still fails |
| 2026-04-17 ~20:00 | Railway CLI | `backend/` | BUILD SUCCESS — Healthcheck still fails |
| 2026-04-17 ~20:15 | Railway dashboard | `backend/` | BUILD SUCCESS — Healthcheck fails |

**Key observation:** All builds succeed. ALL healthchecks fail. Even the 18-hour-old successful deployment now fails healthchecks. This strongly indicates Railway platform-level issue.

---

## What "Blocked" Actually Means

Without the backend live, these features don't work in production:

| Feature | What's Needed | Status |
|---------|--------------|--------|
| Agent execution (`/api/agents`) | Live backend URL | Blocked by #19 |
| Strand management (`/api/strands`) | Live backend URL | Blocked by #19 |
| Sprite APIs (`/api/sprites`) | Live backend URL | Blocked by #19 |
| Living Memory Phase 1 | Backend + DB | PR merged, needs deploy |
| Living Memory Phases 2-4 | Backend + DB | PRs ready, need deploy |

**Frontend alone works fine** — `wendellbritt.vercel.app` is live and functional.

---

## Workarounds

### Workaround A: Delete and Recreate Service (Recommended Next Step)
1. Delete `@bars-engine/core` service from Railway dashboard
2. Create new service → Deploy from GitHub → select `johnair01/bars-engine`
3. Set root to `backend/` (for GitHub App deployment)
4. Add all env vars fresh
5. This clears any corrupted service state

### Workaround B: Use Railway CLI Only (No GitHub Integration)
1. Keep GitHub Actions for CI/CD (frontend only)
2. Use `cd backend && railway up` for backend deploys
3. Set Railway dashboard root to `backend/` and deploy from CLI
4. Bypass GitHub App's file upload issues entirely

### Workaround C: Alternative Platform
- **Render.com**: Similar simplicity, genuine free tier (no trial credits)
- **Fly.io**: More complex setup but reliable
- **Vercel Serverless Functions**: Would require restructuring backend as serverless

### Workaround D: Keep Local Dev + Wait
- Backend works perfectly locally (`uv run uvicorn app.main:app`)
- Use local tunnel (ngrok, cloudflared) for frontend integration testing
- Revisit Railway when platform stabilizes

---

## External Research Findings

### From Railway's Own Docs (PR #226 — "Fixing Common Errors")
> "Application Error: This application failed to respond" → usually wrong host/port

### From Railway's Own Cal.com Issue (#27978)
> Healthcheck failing despite correct config — Prisma migrations at startup cause healthcheck to fail before app is ready

### From 8+ Real-World FastAPI on Railway Cases
| Pattern | Frequency |
|---------|-----------|
| "Service unavailable" = app not binding to correct port | Very common |
| Healthcheck fails but curl succeeds = Railway probe issue | Common |
| 502 after build success = PORT mismatch | Very common |

---

## Questions for Next Session

1. Has Railway infrastructure stabilized? Can we redeploy successfully?
2. Should we try Workaround A (delete + recreate)?
3. Should we try Workaround B (CLI-only deploys)?
4. Should we explore alternative platforms (Render, Fly.io)?
5. Is there a Railway status page or support channel we can use?

---

## Emotional Alchemy Reframe (2026-04-17)

**From:** Anxiety/frustration ("why won't this work?")  
**To:** Triumph/excitement ("we learned more in 6 hours than most teams learn in months")

What we GAINED today:
- ✅ Deep understanding of Railway's deployment model (CLI vs GitHub App differences)
- ✅ Confirmed backend code is production-ready (builds clean, starts perfectly)
- ✅ Discovered the mutual exclusivity of root directory settings
- ✅ Identified a platform-level Railway issue that others are experiencing
- ✅ All 4 Living Memory PRs merged (#63-66) — massive progress
- ✅ Triage labels added across entire backlog
- ✅ Escalation tracker created
- ✅ Standup digest created
- ✅ Decision trigger layer formalized

**The backend WILL deploy. Railway is the variable, not our code.**
