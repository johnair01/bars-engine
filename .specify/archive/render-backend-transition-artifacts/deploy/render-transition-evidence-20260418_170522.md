# Render Backend Transition Evidence — 2026-04-18

## Execution Metadata
- Executed at (UTC): 2026-04-18T17:05:22Z
- Render URL tested: `https://bars-backend-5fhb.onrender.com`
- Frontend URL tested: `https://bars-engine.vercel.app`

## Results

### T1 — Liveness /healthz
- Status: PASS
- Evidence: status=200 body={"status":"ok"}

### T2 — App health /api/health
- Status: PASS
- Evidence: status=200 body={"status":"ok","environment":"development","openai_configured":true}

### T3 — DB connectivity /api/health/db
- Status: PASS
- Evidence: #1: status=200 body={"status":"ok","database":"connected"}

### T4 — Startup diagnostics /api/health/startup
- Status: PASS
- Evidence: status=200 body={"status":"ok","results":{"config":{"environment":"development","database_url_present":true,"database_url_masked":"postgresql+asyncpg:/***","openai_configured":true,"cors_origins":"bars-engine.vercel.app"},"database":"connected","app_mounted":true,"app_routes":["/openapi.json","/docs","/docs/oauth2-redirect","/redoc","/healthz","/","/api/health","/api/health/db","/api/health/startup","/api/agents/architect/draft","/api/agents/challenger/propose","/api/agents/shaman/read","/ap

### T5 — Agent functional /api/agents/architect/compile
- Status: PASS
- Evidence: status=200 node_text_count=6 deterministic=false

### T6 — CORS positive (frontend origin)
- Status: FAIL
- Evidence: status=400 allow-origin=<none> body=Disallowed CORS origin

### T7 — CORS negative (unauthorized origin)
- Status: PASS
- Evidence: status=400 allow-origin=<none> body=Disallowed CORS origin

### T8 — Vercel env pointer check
- Status: WARN
- Evidence: Skipped by --skip-vercel-env-check

### T9 — Frontend regression spot check
- Status: PASS
- Evidence: /: status=200 bytes=14440 | /login: status=200 bytes=11541 | /campaign?ref=bruised-banana: status=200 bytes=34007

## Gate Decision
- Current decision: **NO-GO**
