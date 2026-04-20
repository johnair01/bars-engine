# bars-engine Deployment Crisis — Morning Spec
**Jump-off point for 2026-04-18**

> ⚠️ **[ARCHIVED — Railway backend DEPRECATED 2026-04-18]**
> This spec was the jump-off document for the April 18 deployment crisis investigation. Railway was subsequently replaced by Render (`https://bars-backend-5fhb.onrender.com`). All Railway references below are historical — do not use for future triage. Current production backend: Render.

---

## What's Broken

Railway backend is returning **502**. Players can't access AI Game Master agents. The homepage may crash for incomplete players. The backend has been deployed but is unreachable.

---

## What the 6 GM Faces Found

| Face | Verdict |
|------|---------|
| 🧠 Architect | Railway is a ghost service — **zero frontend code calls `NEXT_PUBLIC_BACKEND_URL`**. The backend deploys but nothing talks to it. Two Dockerfiles with conflicting CMDs. Vercel serverless Python proxy is a broken stub. |
| 🏛 Regent | **#1 most likely: Railway uvicorn crashes on startup** (wrong CMD form, port binding, or missing env vars). **#2: Railway healthcheck probing `/api/` instead of `/healthz`**. **#3: stale `NEXT_PUBLIC_BACKEND_URL`** after Railway redeployed to a new URL. |
| ⚔️ Challenger | **GitHub Actions does NOT deploy to Railway** — it only runs lint/type-check. Railway deploys via Railway's own GitHub integration or manual `railway up`. The Railway deployment at ~01:00 UTC is unexplained. Railway might be running stale code. |
| 🎭 Diplomat | Railway is a **ghost service** — deployed but never called. The contract "frontend → Railway for AI agents" exists in the backend but **zero code exercises it**. The `getCampaignMilestoneGuidance` action computes locally instead of calling the Regent agent. Two DB consumers (Prisma + SQLAlchemy) with no migration coordination. |
| 🌊 Shaman | *(agent timed out — no report)* |
| 📖 Sage | Fix priority: (1) diagnose Railway 502 root cause + verify env vars, (2) align Dockerfile CMD + fix healthcheck path, (3) protect homepage catch() gaps, (4) redeploy only if image is broken, (5) Vercel serverless fallback only if Railway down >1hr. |

---

## Root Cause Hypothesis (ranked)

### H1: Railway uvicorn crashes on startup
**Likelihood: Very High**

Railway's `startCommand` in `railway.json` runs `uvicorn app.main:app --host 0.0.0.0 --port $PORT` as a shell command. This should expand `$PORT`. But:
- `backend/Dockerfile` has `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]` — in JSON exec form, `$PORT` is a literal string, not expanded
- Railway injects `PORT` (caps). If the process receives literal `$PORT`, binding fails
- If Railway's healthcheck probes `/` instead of `/healthz`, and `/` requires DB access on a cold start, it could 500 → Railway kills the container

**Confirm:** Check Railway logs for startup errors.

### H2: Railway is running stale code
**Likelihood: High**

GitHub Actions does not deploy to Railway. Railway deployments require Railway's own GitHub integration, manual `railway up`, or Railway auto-deploy on Dockerfile change. If Railway's GitHub integration isn't configured, the last deploy could be days/weeks old — running code that predates all the recent commits.

**Confirm:** Railway dashboard → Deployment History. What commit is deployed and when?

### H3: `NEXT_PUBLIC_BACKEND_URL` points to dead Railway URL
**Likelihood: High**

Railway assigns new URLs on each redeploy unless a custom domain is configured. If Railway redeployed (new URL) but Vercel's `NEXT_PUBLIC_BACKEND_URL` still points to the old URL, all backend calls 502.

**Confirm:** `curl <NEXT_PUBLIC_BACKEND_URL>/healthz` — does it return 200?

### H4: Railway missing required env vars
**Likelihood: Possible**

`DATABASE_URL` (asyncpg format), `OPENAI_API_KEY`, `CORS_ORIGINS` — if any are missing, Railway starts but crashes on first request or returns wrong responses.

**Confirm:** Railway dashboard → Variables. Are all required vars present?

### H5: Schema drift — DB tables missing
**Likelihood: Low-Medium**

Prisma migrations may not have run against production. `getInstanceDbReadiness()` exists to detect this but is never called before the broken paths. Some DB queries would fail with P2021/P2022.

**Confirm:** `getInstanceDbReadiness()` or direct DB check for `instances` table and `app_config.activeInstanceId` column.

---

## Ghost Service Problem (Bigger Strategic Issue)

Even when Railway is healthy, **nothing in the frontend calls it**. `NEXT_PUBLIC_BACKEND_URL` exists in env but has zero code references. The backend agents (Architect, Regent, Diplomat, etc.) are deployed but unreachable from any user-facing flow.

**This is a separate crisis from the 502** — even if Railway comes up, the AI GM agents remain inaccessible unless somebody wires up the call sites.

---

## Immediate Action Plan (in order)

### Phase 1 — Triage (10 min, before any code changes)
- [ ] `curl -v https://bars-enginecore-production.up.railway.app/healthz`
- [ ] `curl -v https://bars-enginecore-production.up.railway.app/`
- [ ] `curl -v https://bars-enginecore-production.up.railway.app/api/`
- [ ] Railway dashboard → Deployment History → what commit + when?
- [ ] Railway dashboard → Logs (last 50 lines) → look for startup errors
- [ ] Railway dashboard → Variables → confirm `DATABASE_URL`, `CORS_ORIGINS`, `OPENAI_API_KEY`

### Phase 2 — Railway Fix (if H1 confirmed: startup crash)
- [ ] Align `backend/Dockerfile` CMD to use `python -m uvicorn` form
- [ ] Verify Railway healthcheck path is `/healthz` (not `/api/` or `/`)
- [ ] Redeploy Railway
- [ ] Confirm `/healthz` returns 200 before proceeding

### Phase 3 — URL Fix (if H3 confirmed: stale URL)
- [ ] Update `NEXT_PUBLIC_BACKEND_URL` in Vercel env vars to current Railway URL
- [ ] Verify: `curl <new-url>/healthz` returns 200
- [ ] Trigger Vercel redeploy to pick up new env var

### Phase 4 — Ghost Service Fix (after Railway is healthy)
- [ ] Find where `getCampaignMilestoneGuidance` should call Railway's Regent agent
- [ ] Find where any `/api/agents/*` route should be called from the frontend
- [ ] Wire up ONE successful agent call as a proof-of-concept
- [ ] Or: decide to delete Railway entirely and rely on Vercel serverless Python

### Phase 5 — DB Schema Check (if time allows)
- [ ] Run `getInstanceDbReadiness()` or direct SQL check against prod DB
- [ ] Run `prisma migrate deploy` if tables/columns are missing

---

## What NOT to Do

- ❌ Don't redeploy Railway without checking logs first — masks root cause
- ❌ Don't add more `.catch()` blocks without diagnosing which call actually crashes
- ❌ Don't switch `NEXT_PUBLIC_BACKEND_URL` to Vercel serverless without confirming it's healthy
- ❌ Don't assume GitHub Actions deploys to Railway — it doesn't
- ❌ Don't disable Railway healthchecks to make the service appear healthy

---

## Decision Points for Morning

1. **Is Railway's GitHub integration configured?** If yes → commits auto-deploy. If no → somebody must manually `railway up` or configure the integration.

2. **Is Railway running current code or stale code?** Check deployment history.

3. **Is Railway healthy enough to serve `/healthz`?** If yes → H1/H2 ruled out, focus on H3 (URL). If no → H1 (startup crash), fix Dockerfile.

4. **Does the team want Railway as the canonical backend, or should the Vercel serverless Python be the fallback target?** This determines whether to wire up `NEXT_PUBLIC_BACKEND_URL` or remove it.

5. **Is the ghost service problem a priority?** If yes → wire up at least one agent call. If no → Railway can stay as an unused deployment for now.

---

## Files in This Investigation

```
COUNCIL/investigations/
├── NIGHT_SHIFT.md      — this file, timeline + agent roster
├── 01-architect.md    — infrastructure topology
├── 02-regent.md        — failure mode analysis
├── 03-challenger.md    — assumption audit
├── 04-diplomat.md      — service contract analysis
├── 05-shaman.md        — (agent timed out — no report)
└── 06-sage.md          — solution paths + morning jump-off
```
