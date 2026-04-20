# Render Backend Transition Evidence — 2026-04-18

## Execution Metadata
- Executed at (UTC): 2026-04-18T16:55:51Z
- Render URL tested: `https://bars-backend-5fhb.onrender.com`
- Frontend URL tested: `https://bars-engine.vercel.app`
- Spec: `docs/RENDER_BACKEND_TRANSITION_VERIFICATION_SPEC.md`

## Results

### T1 — Liveness `/healthz`
- Status: PASS
- Evidence: `200` + `{"status":"ok"}`

### T2 — App Health `/api/health`
- Status: PASS
- Evidence: `200` + `{"status":"ok","environment":"development","openai_configured":true}`

### T3 — DB Connectivity `/api/health/db`
- Status: PASS (with transient instability observed)
- Initial evidence: first run returned `503` + `{"status":"error","database":"unreachable"}`
- Recheck evidence: 5/5 immediate retries returned `200` + `{"status":"ok","database":"connected"}`
- Interpretation: connectivity is currently good, but one transient failure occurred and should be monitored.

### T4 — Startup Diagnostic `/api/health/startup`
- Status: PASS
- Evidence: `200`, reports config loaded, database connected, routes mounted.

### T5 — Agent Functional `/api/agents/architect/compile`
- Status: PASS
- Evidence: `200`, valid `AgentResponse` payload, non-empty `output`, `deterministic:false`.

### T6 — CORS Positive (frontend origin)
- Status: FAIL
- Request origin: `https://bars-engine.vercel.app`
- Evidence: `400 Disallowed CORS origin`
- Likely cause: backend reports `cors_origins:"bars-engine.vercel.app"` (missing scheme).

### T7 — CORS Negative (unauthorized origin)
- Status: PASS
- Request origin: `https://unauthorized.example`
- Evidence: `400 Disallowed CORS origin`.

### T8 — Frontend Integration (is prod frontend pointing at Render?)
- Status: FAIL
- Evidence from production env pull:
  - `EXPO_PUBLIC_BACKEND_URL="https://bars-backend-5fhb.onrender.com"`
  - `NEXT_PUBLIC_BACKEND_URL="bars-enginecore-production.up.railway.app"`
- Interpretation: frontend runtime variable used by server/client agent calls (`NEXT_PUBLIC_BACKEND_URL`) is still Railway.

### T9 — Frontend Regression Spot Check
- Status: PASS
- Evidence:
  - `/` -> `200`
  - `/login` -> `200`
  - `/campaign?ref=bruised-banana` -> `307` redirect to `/campaign/twine?ref=bruised-banana` (expected route migration behavior)

## Gate Decision
- Current decision: **NO-GO for formal Render cutover**.
- Blocking failures:
  1. T6 (CORS positive) failing for production frontend origin.
  2. T8 (frontend still routed to Railway via `NEXT_PUBLIC_BACKEND_URL`).

## Required Fixes Before Re-Run
1. Set backend `CORS_ORIGINS` on Render to include full scheme origin(s), e.g.:
   - `https://bars-engine.vercel.app`
   - (and any preview domains needed)
2. Set Vercel Production `NEXT_PUBLIC_BACKEND_URL` to:
   - `https://bars-backend-5fhb.onrender.com`
3. Redeploy frontend and re-run T1–T9.

## Artifact Paths
- Raw terminal output: `/tmp/render_transition_test_results_20260418T165551Z.txt`