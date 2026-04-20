> ⚠️ **[ARCHIVED — Railway backend DEPRECATED 2026-04-18]**
> Railway was replaced by Render as the production backend. All Railway references are historical. Current production backend: `https://bars-backend-5fhb.onrender.com`

# 📖 Sage — Solution Paths

**Crisis:** Railway 502 / healthchecks failing / GitHub Actions deploy in progress / Vercel frontend needs healthy backend

---

## Solution 1: Pinpoint the Railway 502 Root Cause

**What problem it solves:**
- Directly addresses "Railway backend returning 502" and "healthchecks failing"
- If Railway is crashing on startup, no other solution matters — the service is down
- The `check_backend_http_ready()` in `mcp_health.py` probes `/api/health`; if Railway is 502, this gate blocks all strand runners

**What it risks breaking:**
- Nothing — this is pure investigation, no code changes
- Risk is wasted time if the root cause turns out to be a trivial env var

**Build / Integrate / Defer:** Build — this must be the first action. You cannot triage solutions without knowing why Railway is 502.

**Effort:** Low
**Risk if wrong:** Low
**First step to validate:** `curl -v https://bars-enginecore-production.up.railway.app/api/health` and `curl -v https://bars-enginecore-production.up.railway.app/healthz` — capture exact HTTP status codes, response bodies, and timing. Also check Railway dashboard logs for startup errors (import failures, port binding, DB connection).

---

## Solution 2: Verify the Dockerfile CMD Mismatch Hypothesis

**What problem it solves:**
- The `backend/Dockerfile` (used by Railway) has: `CMD ["uvicorn", "app.main:app", ...]`
- The root `Dockerfile` (for the monolithic image) has: `CMD ["python", "-m", "uvicorn", "app.main:app", ...]`
- If Railway is building from `backend/Dockerfile` but the module path resolution fails because the working directory context is wrong, uvicorn silently exits — producing 502
- Also: `EXPOSE 8080` in `backend/Dockerfile` but Railway injects `$PORT` which may be 80/443, causing a binding failure

**What it risks breaking:**
- Nothing if done carefully — verify before changing
- Could introduce new issues if Railway's port mapping doesn't match `$PORT`

**Build / Integrate / Defer:** Integrate — align the two Dockerfiles and confirm Railway port binding. This is a single-file fix.

**Effort:** Low
**Risk if wrong:** Low — the mismatch is documented, alignment is safe
**First step to validate:** Check Railway dashboard for the actual deployed start command and assigned `$PORT`. Compare against what `uvicorn app.main:app --host 0.0.0.0 --port $PORT` expects.

---

## Solution 3: Add a Bare `/healthz` Liveness Probe (No FastAPI Routing)

**What problem it solves:**
- Railway's healthchecks may be probing `/` or `/healthz` before the FastAPI router is mounted
- `main.py` defines `healthz()` as a bare `@app.get()` with no routing prefix — this is correct for Railway's liveness probe
- But if Railway is hitting `/api/health` (the prefixed router path) and the health router isn't mounted yet, it returns 404 → Railway marks unhealthy → 502
- Adding `/healthz` (no prefix) as a true liveness probe satisfies Railway without depending on the app router

**What it risks breaking:**
- Nothing — this is an additive safety net with zero side effects
- The existing `/api/health` route (which requires DB access) continues to work; this new one doesn't use the router at all

**Build / Integrate / Defer:** Build — a single `@app.get("/healthz")` function already exists in `main.py` but is named `healthz` and at `/healthz`. The concern is whether Railway probes the right path. Verify the Railway healthcheck path.

**Effort:** Low
**Risk if wrong:** Low
**First step to validate:** Confirm what path Railway's healthcheck is configured to probe (check Railway service settings). If it's `/` → already fine. If it's `/healthz` → already fine. If Railway has no healthcheck configured → add one pointing at `/healthz`.

---

## Solution 4: Ensure Railway Has All Required Env Vars

**What problem it solves:**
- `DATABASE_URL` — if missing, asyncpg fails silently or crashes on first DB call
- `OPENAI_API_KEY` — if missing, all AI agent tools return deterministic fallbacks (not fatal)
- `CORS_ORIGINS` — if missing, defaults to `["http://localhost:3000", "http://localhost:3001"]`, blocking Vercel frontend calls → perceived as 502
- `PORT` — Railway injects this automatically, but if the app binds to hardcoded 8080 instead of `$PORT`, startup fails

**What it risks breaking:**
- Nothing — env var validation is read-only
- Could break if `CORS_ORIGINS` was intentionally omitted and the site relies on permissive CORS, but that's a security risk to fix

**Build / Integrate / Defer:** Integrate — check Railway environment variable dashboard. This is a 10-minute audit.

**Effort:** Low
**Risk if wrong:** Low
**First step to validate:** Railway dashboard → service → variables. Confirm `DATABASE_URL` is present and is `postgresql+asyncpg://` (not raw `postgres://`). Confirm `CORS_ORIGINS` includes the Vercel frontend URL.

---

## Solution 5: Frontend Fallback — Make Vercel Serverless Python the Primary Backend

**What problem it solves:**
- Vercel serverless Python backend exists as an alternative to Railway
- If Railway is down, switching `NEXT_PUBLIC_BACKEND_URL` to point to the Vercel serverless backend restores frontend functionality without waiting for Railway fix
- This is a runtime config change — no redeploy needed if Vercel serverless is already live

**What it risks breaking:**
- Vercel serverless Python has cold starts and memory limits — may not handle strand runners or heavy agent calls
- The MCP server (`mcp_server.py`) runs as a separate process and may not be deployed on Vercel serverless — strand_run would break
- CORS configuration on Vercel serverless may not match Railway's

**Build / Integrate / Defer:** Defer — only if Railway is down for >1 hour and the Vercel serverless backend is confirmed production-ready. Do NOT switch blindly.

**Effort:** Medium
**Risk if wrong:** High — switching backends mid-flight corrupts player state if they have open sessions on both
**First step to validate:** Test the Vercel serverless backend: `curl https://<app>.vercel.app/api/health` — confirm it returns 200 and responds correctly.

---

## Solution 6: Protect the Homepage `.catch()` Gaps

**What problem it solves:**
- `page.tsx` has `.catch(() => [])` on `Promise.all([getPlayerThreads, getPlayerPacks, ...])` — but if `db.player.findUnique` (the auth check) throws before the `playerId` check, the whole page crashes with a 500
- `getActiveInstance()` in `instance.ts` wraps its DB call in try/catch but the `getAppConfig()` call inside it is NOT wrapped — if `app_config` table doesn't exist yet (schema drift during rollouts), it 500s
- The `getInstanceDbReadiness()` function exists precisely to detect this but is never called before the broken path

**What it risks breaking:**
- Nothing — defensive coding improvement
- Could mask real auth failures if the catch block is too broad

**Build / Integrate / Defer:** Build — add a top-level try/catch around the `db.player.findUnique` call in `page.tsx` that renders `<DatabaseUnreachable>` on failure (already imported). This is ~5 lines.

**Effort:** Low
**Risk if wrong:** Low
**First step to validate:** Deliberately misconfigure the DB URL locally and load the homepage — confirm it renders a graceful error instead of crashing.

---

## Solution 7: Railway Redeploy via GitHub Actions (If Deploy is Stuck)

**What problem it solves:**
- GitHub Actions deployment is in progress — if it's stuck or looping, cancelling and triggering a clean redeploy may fix a partial deploy state
- A clean Railway redeploy rebuilds the Docker image from scratch, eliminating any stale layer cache issues

**What it risks breaking:**
- If the Actions deploy is in progress for a reason (e.g., it's waiting for Railway to finish), cancelling it could lose the deploy progress
- If Railway is 502 because of a bad image, a redeploy would fix it — but also could fail for the same reason if the Dockerfile is broken

**Build / Integrate / Defer:** Integrate — only if Railway dashboard shows a failing/looping deploy and the 502 is caused by a broken image.

**Effort:** Low
**Risk if wrong:** Medium — redeploy takes 3-5 minutes; if done unnecessarily, wastes time
**First step to validate:** Check Railway service status. If the deploy history shows repeated failures, redeploy is justified. If only one failure, investigate first.

---

## Recommended Priority Order

1. **First:** Solution 1 (Pinsetpoint Railway 502 root cause) + Solution 4 (Verify Railway env vars) — these are fast checks that determine whether Railway is even reachable. Do these simultaneously in parallel at 08:00.
2. **Second:** Solution 2 (Dockerfile CMD mismatch) + Solution 3 (healthz probe) — these address the most likely cause of Railway 502 (startup crash or healthcheck misconfiguration).
3. **Third:** Solution 6 (catch() gaps on homepage) — defensive fix for the page.tsx auth crash path. Low effort, high resilience.
4. **Fourth:** Solution 7 (Railway redeploy) — only if steps 1-2 reveal a broken image.
5. **Fifth:** Solution 5 (switch to Vercel serverless) — only if Railway is down >1 hour and Vercel serverless is confirmed working.

---

## What NOT to Do (Paths That Look Tempting But Are Traps)

- **Don't switch `NEXT_PUBLIC_BACKEND_URL` to Vercel serverless without confirming Vercel serverless is healthy first.** You risk splitting player sessions across two different backend states.
- **Don't add more `.catch()` blocks to page.tsx without first identifying WHICH call actually crashes.** More catch blocks without diagnosis hides the real failure.
- **Don't redeploy Railway without checking the logs first.** A redeploy during a 502 masks the root cause and may not fix it.
- **Don't assume the GitHub Actions deploy is the problem.** The deploy being "in progress" is normal — the 502 is likely a Railway runtime issue, not a CI issue.
- **Don't disable Railway healthchecks to make the service appear healthy.** It will still be 502 for actual users.

---

## Morning Jump-Off (the exact first 3 things to do at 08:00 UTC)

1. **Run:** `curl -v https://bars-enginecore-production.up.railway.app/healthz` and `curl -v https://bars-enginecore-production.up.railway.app/api/health` — capture the exact HTTP status, response body, and timing for each.
2. **Check Railway dashboard logs** (service → deploys → logs) for the last 50 lines — look for: import errors, port binding failures, database connection errors, or uvicorn exit codes.
3. **Check Railway env vars** (service → variables) — confirm `DATABASE_URL` uses `postgresql+asyncpg://`, `CORS_ORIGINS` includes the Vercel frontend URL, and `OPENAI_API_KEY` is present.

**Then decide based on what you find:**
- If `/healthz` returns 200 → Railway is up but `/api/health` fails → DB connection issue
- If `/healthz` returns 502 → uvicorn crashed on startup → Dockerfile/port issue
- If `/healthz` returns 404 → Railway is routing to wrong path → healthcheck misconfiguration
- If all curl requests timeout → Railway service is genuinely down → redeploy
