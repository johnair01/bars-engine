# Backend Deployment

The Python FastAPI backend runs the Game Master agents. Deploy to Railway, Render, or Fly.io (Vercel does not support Python).

## Railway

1. Create a new project at [railway.app](https://railway.app)
2. Add a service from the `backend/` directory (or connect GitHub repo, set root to `backend/`)
3. Railway uses `railway.json` for build/deploy config
4. Set env vars: `DATABASE_URL`, `OPENAI_API_KEY`, `CORS_ORIGINS`
5. Deploy. Railway assigns a URL; use it for `NEXT_PUBLIC_BACKEND_URL` in Vercel.

## Render

1. Create a Web Service at [render.com](https://render.com)
2. Connect repo, set root directory to `backend/`
3. Render uses `render.yaml` or configure manually (Dockerfile, port 8000)
4. Set env vars in Render dashboard
5. Use the Render URL for `NEXT_PUBLIC_BACKEND_URL` in Vercel.

## Env Vars

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | Yes | Production Postgres (same as Vercel) |
| `OPENAI_API_KEY` | Yes | For AI agents |
| `CORS_ORIGINS` | Yes (prod) | Comma-separated, include `https://<app>.vercel.app` |
| `PORT` | Auto | Injected by Railway/Render |

See [docs/ENV_AND_VERCEL.md](../docs/ENV_AND_VERCEL.md) for full documentation.
