# Backend Deployment

The Python FastAPI backend runs the Game Master agents. Deploy to Render (canonical), Railway (legacy/rollback), or Fly.io (Vercel does not support Python).

## Canonical Production Target

Use **Render** as the default production backend host.

## Render

1. Create a Web Service at [render.com](https://render.com)
2. Connect repo, set root directory to `backend/`
3. Render uses `render.yaml` or configure manually (Dockerfile, port 8000)
4. Set env vars in Render dashboard
5. Use the Render URL for `NEXT_PUBLIC_BACKEND_URL` in Vercel.

## Legacy / Rollback: Railway

Use Railway only for rollback or explicit parallel testing.

1. Create a new project at [railway.app](https://railway.app)
2. Add a service from the `backend/` directory (or connect GitHub repo, set root to `backend/`)
3. Railway uses `railway.json` for build/deploy config
4. Set env vars: `DATABASE_URL`, `OPENAI_API_KEY`, `CORS_ORIGINS`
5. Deploy. Railway assigns a URL; use it for `NEXT_PUBLIC_BACKEND_URL` in Vercel only during rollback/testing.

## Change-Impact Checklist (Required)

When a PR touches backend deploy/runtime/env behavior:

1. Verify Render behavior first (`backend/render.yaml`, Render env vars, health endpoint).
2. If you changed a Railway-specific setting, confirm equivalent Render impact or document why not needed.
3. Confirm the active production pointer (`NEXT_PUBLIC_BACKEND_URL`) still targets Render unless a rollback is active.

## Env Vars

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | Yes | Production Postgres (same as Vercel) |
| `OPENAI_API_KEY` | Yes | For AI agents |
| `CORS_ORIGINS` | Yes (prod) | Comma-separated, include `https://<app>.vercel.app` |
| `STRAND_RUNTIME_ENABLED` | Recommended | Kill switch for `POST /api/strands/run` (default `true`) |
| `STRAND_REQUIRE_AUTH_IN_PRODUCTION` | Recommended | Require `bars_player_id` auth cookie in production for strand runtime |
| `STRAND_MAX_SUBJECT_CHARS` | Optional | Input cap for strand `subject` (default `600`) |
| `STRAND_MAX_SECTS` | Optional | Max allowed sect count in `sects` override (default `6`) |
| `STRAND_ALLOWED_SECTS` | Optional | Comma-separated allowlist for runtime sect overrides |
| `STRAND_RATE_LIMIT_ENABLED` | Optional | Enable per-actor in-process rate limiting for `/api/strands/run` |
| `STRAND_RATE_LIMIT_WINDOW_SECONDS` | Optional | Sliding window size for rate limiting |
| `STRAND_RATE_LIMIT_MAX_REQUESTS` | Optional | Max strand run requests allowed per actor/window |
| `STRAND_IDEMPOTENCY_TTL_SECONDS` | Optional | Replay cache TTL for `Idempotency-Key` responses |
| `STRAND_IDEMPOTENCY_LOCK_SECONDS` | Optional | TTL for in-flight idempotency lock |
| `STRAND_RUNTIME_STORE` | Optional | Guard store backend: `memory` (default) or `redis` |
| `REDIS_URL` | Required if store=redis | Redis connection string for shared runtime guard state |
| `STRAND_RUNTIME_STORE_KEY_PREFIX` | Optional | Key prefix namespace for runtime guard keys |
| `PORT` | Auto | Injected by Railway/Render |

See [docs/ENV_AND_VERCEL.md](../docs/ENV_AND_VERCEL.md) for full documentation.
