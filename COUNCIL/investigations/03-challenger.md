> ⚠️ **[ARCHIVED — Railway backend DEPRECATED 2026-04-18]**
> Railway was replaced by Render as the production backend. All Railway references are historical. Current production backend: `https://bars-backend-5fhb.onrender.com`

# ⚔️ Challenger — Assumption Audit

**Investigator:** gm-challenger  
**Opened:** 2026-04-18 01:55 UTC  
**Context:** Railway 502 on `/api/`, registry.json regenerated, two simultaneous deployments

---

## Assumptions We're Making

### Assumption 1: "GitHub Actions is deploying to Railway"

**Assumption:** The GitHub Actions workflow is triggering Railway deployments.

**Challenged:** The only workflow file is `frontend-check.yml`. It runs `npm run check` (lint + type-check + Prisma validate) on every push. It does NOT run `railway login`, `railway deploy`, or anything Railway-related.

**Evidence to the contrary:** 
- `.github/workflows/frontend-check.yml` only checks code quality — no deployment commands
- `backend/DEPLOY.md` describes manual Railway deployment steps
- There is no `deploy-railway.yml` or any workflow containing `railway` CLI commands
- Railway deployments are triggered by Railway's own GitHub integration or manual `railway up` — NOT GitHub Actions

**Red Herring Risk:** HIGH. If nobody is actively deploying to Railway, the 502 might be from a previous deployment that's now failing health checks, or Railway's own redeploy-on-commit trigger fired without the team knowing.

**Verdict:** GitHub Actions is not deploying to Railway. This assumption should be ELIMINATED.

---

### Assumption 2: "Railway is the intended production backend"

**Assumption:** Railway was deliberately chosen as the production backend host.

**Challenged:** There is a `render.yaml` in `backend/` — meaning the backend was also being considered for Render. The `DEPLOY.md` lists Railway AND Render AND Fly.io as options, with "Vercel does not support Python" as the constraint. There is no documented decision record for why Railway was chosen over Render.

**Evidence to the contrary:**
- `backend/render.yaml` exists and is configured (with `$PORT` override)
- `backend/railway.json` uses DOCKERFILE builder — a copy-paste config
- No `RAILWAY_*` env vars appear in the codebase grep
- The `vercel.json` in the repo root is essentially empty `{}` — frontend is likely on Vercel
- AGENTS.md says "Use Vercel-backed env by default on this machine"

**Red Herring Risk:** MEDIUM. If Railway was never formally chosen, the team might be debugging the wrong deployment target. However, Railway IS returning 502, so it is clearly live — but maybe nobody owns it.

**Verdict:** Railway may be running stale code from a previous deployment. The "intended backend" question is unresolved.

---

### Assumption 3: "The Dockerfile CMD change was harmless"

**Assumption:** The change from `["python", "-m", "uvicorn", ...]` (backend/Dockerfile) to `["uvicorn", ...]` (root Dockerfile) is a harmless cosmetic change.

**Challenged:** These are TWO DIFFERENT Dockerfiles at TWO DIFFERENT paths. Railway.json points to `backend/Dockerfile` (uses `python -m uvicorn`). The root `Dockerfile` uses bare `uvicorn`. But the root Dockerfile has a DIFFERENT bug — it uses `--port $PORT` inside a JSON exec array, which passes the literal string `$PORT` to the process, not the environment variable value.

**Evidence to the contrary:**
- Root Dockerfile: `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]` — `$PORT` is NOT shell-expanded in exec form
- Railway injects `PORT` env var (caps), not `$port` (lowercase)
- `backend/Dockerfile` hardcodes port 8080: `CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]`
- `railway.json` override: `--host 0.0.0.0 --port $PORT`

**Red Herring Risk:** LOW — this is likely THE bug. If Railway's deploy command is passing `$PORT` as a literal string to uvicorn, it will fail to start. But note: Railway.json overrides the CMD with `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (shell form, which DOES expand). So if Railway uses railway.json's `startCommand`, port expansion works.

**Verdict:** The double-Dockerfile situation is confusing but railway.json's startCommand may compensate. Still worth verifying Railway's actual deployed start command.

---

### Assumption 4: "Vercel Postgres is fine — connection string didn't rotate"

**Assumption:** The DATABASE_URL is stable. Vercel Rotate doesn't apply to Postgres, only preview databases.

**Challenged:** `instance.ts` has explicit handling for `P2021` (table missing) and `P2022` (column missing) — these are schema drift errors that happen when Prisma migrations haven't run against prod. But also `P1001` ("Can't reach database server at...") is handled. If DATABASE_URL is wrong or the host is unreachable, you'd see P1001.

**Evidence to the contrary:**
- `onboarding.ts` and `page.tsx` both have `.catch()` blocks that swallow database errors and continue with defaults
- The backend's `database.py` uses `asyncpg` directly — if DATABASE_URL is wrong, the backend won't even initialize
- AGENTS.md canonical flow says to run `npm run diagnose:db` to verify DB connectivity — has this been run on the deployed Railway instance?

**Red Herring Risk:** MEDIUM. The `.catch()` blocks make it seem like DB errors are handled gracefully, but if the backend can't reach the database on startup, it might crash silently (502 without logging).

**Verdict:** DB is a plausible culprit. The `getInstanceDbReadiness()` function in `instance.ts` specifically checks for schema drift — if that returns false, migrations haven't run.

---

### Assumption 5: "The .catch() blocks handle all failures gracefully"

**Assumption:** `page.tsx` has extensive `.catch(() => [])` and `.catch(() => null)` error handling, so DB failures won't crash the page.

**Challenged:** The error handling is defensive for READ operations (getPlayerThreads, getPlayerPacks, etc.). But the WRITE operations in onboarding and instance actions (`advanceOnboardingState`, `upsertInstance`, etc.) throw or redirect on error. If the backend is returning 500s instead of 200s, those won't even reach the catch blocks — the fetch itself fails.

**Evidence to the contrary:**
- `page.tsx` runs 15+ DB queries wrapped in Promise.all with catch-fallbacks
- But the actual user-facing error depends on what `db.player.findUnique` does when the connection fails — if it throws a connection error at the Prisma level, the whole page might still 500
- The `isPrismaConnectionError()` guard only covers specific error codes — novel connection errors might slip through

**Red Herring Risk:** MEDIUM. The catch blocks cover individual query failures, but if Prisma can't establish a connection at all on cold start, you might get a 500 at the page level, not graceful degradation.

**Verdict:** The catch blocks help but are not a complete shield. A backend 502 means the Next.js server can't proxy to Railway — the page's own DB queries (against Vercel Postgres directly) are separate and may still work.

---

### Assumption 6: "The env refresh regenerated registry.json safely"

**Assumption:** The registry.json regeneration during env refresh is benign — just a side effect of pulling fresh env vars.

**Challenged:** The NIGHT_SHIFT timeline says `d0df9fb` committed at ~00:53 UTC. If `build-registry.ts` ran as part of `npm run build` (which includes `npm run build:registry`), the registry could have been regenerated with a different schema or different content. If the frontend build picked up this new registry but the Railway backend is still serving old code, there could be an API contract mismatch.

**Evidence to the contrary:**
- `build:registry` runs `tsx scripts/build-registry.ts`
- `page.tsx` doesn't directly import from `public/registry.json` in the visible code
- The registry is used for route/annotation metadata — not runtime API calls

**Red Herring Risk:** HIGH for the 502, LOW for broader instability. The registry regeneration is likely unrelated to the Railway 502 but could cause other issues.

**Verdict:** Registry regeneration is probably NOT the 502 cause but should be verified with `git show d0df9fb --stat`.

---

### Assumption 7: "Railway's healthz endpoint should return 200"

**Assumption:** Since `backend/app/main.py` defines a `/healthz` endpoint that returns `{"status": "ok"}` with no dependencies, Railway should get a 200 if the container is running.

**Challenged:** If uvicorn crashes on startup (wrong port, missing env vars, import error), `/healthz` never gets reached. A 502 from Railway's load balancer means the container is either not responding or is returning an error before the request reaches the app.

**Evidence to the contrary:**
- Railway 502 = load balancer can't connect to backend process
- Could be: wrong port, process crashed, process not started

**Verdict:** The 502 means Railway can't reach the backend at all. Check Railway logs for startup errors, crash loops, or port binding failures.

---

## Most Dangerous Assumption

### "Railway is the active production backend and is receiving the current codebase"

Nothing in the GitHub Actions workflow deploys to Railway. Railway deployments must be triggered either by:
1. Railway's GitHub integration (which must be explicitly connected and configured per-project)
2. Manual `railway up` from a local terminal
3. Railway's auto-deploy on detected Dockerfile changes (if enabled)

If none of these were set up, Railway might be running a VERY old version of the backend — or might not have a deployment at all and the 502 is Railway's default "no deployed service" response.

**The team should verify:** What is Railway actually running? When was the last successful Railway deployment? Did somebody's local `railway up` trigger it? Is Railway connected to the GitHub repo?

---

## Things Nobody Is Asking

1. **"What does Railway's actual deployment logs show?"** — The 502 is from Railway's load balancer. Railway's deploy logs will show why the process isn't starting or is crashing. Nobody has mentioned fetching Railway logs.

2. **"Is Railway even connected to this GitHub repo?"** — If Railway's GitHub integration isn't set up, commits don't trigger deployments. The last Railway deployment could be days or weeks old.

3. **"What was the state of the Railway deployment BEFORE the env refresh?"** — The timeline shows Railway deployment triggered ~01:00 UTC and GitHub Actions ~01:15 UTC. If Railway was already broken before these commits, the timeline is misleading.

4. **"What is the actual deployed start command on Railway?"** — Is Railway using `railway.json`'s `startCommand` override? Or the Dockerfile's CMD? These differ in port handling.

5. **"What environment variables does Railway actually have set?"** — Railway injects `PORT`, `RAILWAY_PRIVATE_DOMAIN`, etc. Does Railway have `DATABASE_URL`, `OPENAI_API_KEY`, `CORS_ORIGINS`? Without these, uvicorn might start but crash on first request.

6. **"When was the last successful deployment to Railway, and what commit was it?"** — The deployment history in Railway's dashboard shows this. If the last successful deploy was weeks ago, the current code isn't deployed.

7. **"Is the Vercel frontend actually pointing to the Railway backend?"** — The `NEXT_PUBLIC_BACKEND_URL` might point to Railway, but if Railway is 502, the frontend's server actions that proxy to the backend are all failing silently behind `.catch()` blocks.

8. **"Is there a `RAILWAY_PUBLIC_DOMAIN` env var that should be used for CORS?"** — The backend CORS is configured from `settings.cors_origins`. If Railway's public URL isn't in CORS_ORIGINS, CORS will block browser requests even if the backend is up.

9. **"Is Railway's `$PORT` actually matching what the Dockerfile/railway.json expects?"** — Railway injects PORT as an env var. If the Dockerfile exec form passes literal `$PORT` to uvicorn (not shell-expanded), the process fails.

10. **"What does the Railway health check actually return?"** — Railway has configurable health check paths (`/healthz`). If it's checking `/` instead of `/healthz`, and `/` requires CORS or DB, it might fail even though `/healthz` would pass.

---

## Top 3 Provocations for the Morning Session

### Provocation 1: "Stop looking at the code. Go to railway.app and check the Deployment History."

The code is fine. The question is: **what is actually deployed on Railway right now?** The deployment history tab shows commits, timestamps, and build logs. If the last deploy was before the env refresh commits, the 502 is Railway running stale code. If the deploy just failed, the logs will show why.

**Action:** Open Railway dashboard → select project → Deployment History. Tell the team: what commit is deployed, and what do the build/run logs say?

---

### Provocation 2: "The GitHub Actions workflow doesn't deploy to Railway. So who or what triggered the Railway deployment at 01:00 UTC?"

If GitHub Actions isn't deploying to Railway, what did? Railway's auto-deploy on commit requires GitHub integration to be configured per-project. If that isn't set up, the Railway deployment at 01:00 UTC is unexplained — and might be a phantom, or might be Railway running an older deploy while the team assumes it's running the new one.

**Action:** Check Railway project settings → GitHub integration. Is it connected? Which repo and branch? Does it auto-deploy?

---

### Provocation 3: "The backend has TWO Dockerfiles with different CMDs. Which one is Railway actually building?"

There is `backend/Dockerfile` (uses `python -m uvicorn`, hardcodes 8080) and `bars-engine/Dockerfile` (uses bare `uvicorn`, `$PORT` in exec form). Railway.json specifies `backend/Dockerfile`. But: if somebody changed Railway's build configuration to use the root Dockerfile, or if Railway is auto-detecting a Dockerfile at the repo root, the wrong CMD might be running.

**Action:** In Railway project settings → Build → check "Dockerfile path" and "Start command." Verify it points to `backend/Dockerfile` and uses the `startCommand` from `railway.json`.

---

## Summary Scorecard

| Assumption | Risk | Verdict |
|---|---|---|
| GitHub Actions deploys to Railway | HIGH if believed | WRONG — no such workflow |
| Railway is the intended backend | MEDIUM | UNVERIFIED — Render also configured |
| Dockerfile CMD change is harmless | HIGH if wrong port | POSSIBLE ROOT CAUSE |
| Vercel Postgres is fine | MEDIUM | UNVERIFIED |
| .catch() blocks handle failures | LOW for 502 | COVERS PAGE, NOT RAILWAY PROXY |
| registry.json regen is benign | LOW for 502 | UNLIKELY CAUSE |
| Railway healthz should return 200 | HIGH if process not starting | THE 502 PROVES IT DOESN'T |

**Bottom line:** The 502 is Railway's load balancer saying "I can't reach the backend process." The most likely causes, in order:
1. Railway is running stale code from an old deploy (nobody actually deployed new code)
2. Railway's build/start command is wrong (port, env vars, CMD mismatch)
3. Railway's environment variables are missing (DATABASE_URL, OPENAI_API_KEY)

The env refresh and registry regen are probably NOT the cause — but they make it look like the team did something, when the Railway deploy might have been broken before any of those changes.
