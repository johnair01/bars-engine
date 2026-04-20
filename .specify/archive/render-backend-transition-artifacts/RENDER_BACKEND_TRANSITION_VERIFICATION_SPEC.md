# Render Backend Transition Verification Spec

## 1) Objective
Formally transition BARs Engine backend hosting from Railway to Render with no frontend regression, no data path breakage, and clear rollback criteria.

## 2) Scope
In scope:
- Python FastAPI backend deployed on Render from `backend/`
- Frontend backend pointer (`NEXT_PUBLIC_BACKEND_URL`) on Vercel
- Runtime health, DB connectivity, CORS, and core agent endpoints
- Operational readiness (logs, ownership, rollback)

Out of scope:
- Feature development unrelated to hosting migration
- Schema redesign or non-backend infra refactors

## 3) Success Criteria (Definition of Done)
1. Render service is healthy for 24h with no sustained 5xx spikes.
2. Frontend production traffic resolves to Render backend URL only.
3. Core endpoints pass smoke checks:
   - `GET /healthz`
   - `GET /api/health`
   - `GET /api/health/db`
   - `POST /api/agents/architect/compile` (or current primary agent endpoint used in UI)
4. CORS allows production frontend origin(s) and blocks unknown origins as expected.
5. Railway backend is removed from active routing and documented as decommissioned/standby.
6. Runbook + env source of truth updated to Render.

## 4) Required Inputs
- Render service URL (example: `https://bars-backend.onrender.com`)
- Vercel production frontend URL
- Confirmed production `DATABASE_URL` (same data plane expected)
- Render env vars set:
  - `DATABASE_URL`
  - `OPENAI_API_KEY`
  - `CORS_ORIGINS` (must include prod frontend URL)

## 5) Transition Plan

### Phase A — Pre-Cutover Validation (Render in parallel)
1. Deploy backend to Render from `backend/` using `backend/render.yaml`.
2. Verify health on Render directly:
   ```bash
   curl -fsS "$RENDER_URL/healthz"
   curl -fsS "$RENDER_URL/api/health"
   curl -fsS "$RENDER_URL/api/health/db"
   ```
3. Verify response contracts (status codes + expected JSON keys).
4. Run one agent endpoint against Render with a known-good payload.
5. Validate logs/observability in Render dashboard (startup, request logs, DB connectivity).

Exit gate A:
- All checks pass and no blocking errors in Render logs.

### Phase B — Controlled Cutover
1. Update Vercel production env:
   - `NEXT_PUBLIC_BACKEND_URL=$RENDER_URL`
2. Trigger frontend redeploy.
3. Confirm new deployment uses Render URL.
4. Run production smoke tests from browser + curl.

Exit gate B:
- Frontend and backend integration verified in production.

### Phase C — Post-Cutover Monitoring (24h)
1. Monitor error rates, latency, and timeout patterns.
2. Check critical user flows at least twice (immediately post-cutover + after traffic period).
3. Keep Railway rollback path available until monitoring window closes.

Exit gate C:
- No Sev-1/Sev-2 incidents and acceptable performance baseline.

## 6) Test Matrix

### T1 — Liveness
- Purpose: Confirm service process is alive.
- Command:
  ```bash
  curl -i "$RENDER_URL/healthz"
  ```
- Pass: `200` and JSON includes `status: "ok"`.
- Fail: timeout, non-200, malformed response.

### T2 — App Health
- Purpose: Confirm app-level health and config load.
- Command:
  ```bash
  curl -i "$RENDER_URL/api/health"
  ```
- Pass: `200`, includes `status`, `environment`, `openai_configured`.
- Fail: non-200 or missing fields.

### T3 — Database Connectivity
- Purpose: Confirm backend can reach production DB.
- Command:
  ```bash
  curl -i "$RENDER_URL/api/health/db"
  ```
- Pass: `200`, `{"status":"ok","database":"connected"}`.
- Fail: `503` or DB unreachable.

### T4 — Startup Diagnostic
- Purpose: Validate startup dependencies and route mounting.
- Command:
  ```bash
  curl -i "$RENDER_URL/api/health/startup"
  ```
- Pass: `200`, includes config + database + app routes.
- Fail: `500` with dependency errors.

### T5 — Agent Endpoint (Functional)
- Purpose: Ensure primary AI route used by frontend works on Render.
- Endpoint example:
  `POST /api/agents/architect/compile`
- Payload: Use known-good fixture from prior successful run.
- Pass: `200` with expected `AgentResponse` shape and non-empty `output`.
- Fail: non-200, schema mismatch, or timeout > 20s (unless known workload).

### T6 — CORS (Positive)
- Purpose: Confirm frontend origin is allowed.
- Command:
  ```bash
  curl -i -X OPTIONS "$RENDER_URL/api/health" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET"
  ```
- Pass: response includes `access-control-allow-origin: $FRONTEND_URL`.
- Fail: missing/incorrect CORS header.

### T7 — CORS (Negative)
- Purpose: Confirm unknown origin is not allowed (if policy is restrictive).
- Command:
  ```bash
  curl -i -X OPTIONS "$RENDER_URL/api/health" \
    -H "Origin: https://unauthorized.example" \
    -H "Access-Control-Request-Method: GET"
  ```
- Pass: unauthorized origin not whitelisted.
- Fail: open CORS when policy requires strict allowlist.

### T8 — Frontend Integration
- Purpose: Verify production frontend end-to-end requests resolve through Render.
- Steps:
  1. Open production frontend.
  2. Execute one user flow that triggers backend agent call.
  3. Confirm request host in browser network tab is Render URL.
- Pass: flow succeeds and targets Render host.
- Fail: flow broken, or still calling Railway.

### T9 — Regression Spot Check
- Purpose: Verify no breakage in high-value paths.
- Minimum paths:
  - Home load
  - Login path
  - Campaign load path used in current release
  - One agent-assisted generation path
- Pass: all paths functional.
- Fail: any blocker in core path.

## 7) Rollback Criteria and Procedure
Trigger rollback if any of:
- Sustained 5xx or timeout rates above baseline for >10 minutes
- DB connectivity instability
- Agent endpoints failing in production flow
- Critical journey broken with no hotfix in <30 minutes

Rollback steps:
1. Set `NEXT_PUBLIC_BACKEND_URL` in Vercel back to prior Railway URL.
2. Redeploy frontend.
3. Re-run T1, T2, T3, T8.
4. Open incident note with root-cause hypothesis and next attempt plan.

## 8) Decommission Checklist (after stable window)
1. Remove Railway URL from active env vars and docs.
2. Update runbooks to Render as canonical backend host.
3. Archive Railway config as legacy (do not route traffic).
4. Capture final transition report:
   - Cutover timestamp
   - Test evidence
   - Owner sign-off

## 9) Ownership & Sign-off
- Release owner: __________________
- Backend owner: __________________
- Frontend owner: _________________
- QA owner: ______________________

Approvals required:
- [ ] Backend owner
- [ ] Frontend owner
- [ ] QA owner
- [ ] Release owner

## 10) Evidence Log Template
- Render URL:
- Frontend URL:
- Cutover timestamp (UTC):
- T1 result:
- T2 result:
- T3 result:
- T4 result:
- T5 result:
- T6/T7 result:
- T8 result:
- T9 result:
- Rollback required? (Y/N):
- Final decision: Go / No-Go