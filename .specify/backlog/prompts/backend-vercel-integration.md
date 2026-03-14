# Prompt: Backend–Vercel Integration

**Use this prompt when deploying the Python backend for production or wiring it to Vercel.**

## Objective

Implement the Backend–Vercel Integration per [.specify/specs/backend-vercel-integration/spec.md](../specs/backend-vercel-integration/spec.md). Document env vars, add deployment config (Railway/Render), and ensure the Next.js app can call the Python backend in production. Preserve the three-tier fallback (Backend → Direct OpenAI → Deterministic).

## Checklist

- [ ] Add "Python Backend" section to `docs/ENV_AND_VERCEL.md`
- [ ] Update `backend/.env.example` with `CORS_ORIGINS`
- [ ] Create `backend/railway.json` (or `render.yaml`)
- [ ] Ensure backend uses `PORT` env when set
- [ ] Verify local and production flows

## Reference

- Spec: [.specify/specs/backend-vercel-integration/spec.md](../specs/backend-vercel-integration/spec.md)
- Plan: [.specify/specs/backend-vercel-integration/plan.md](../specs/backend-vercel-integration/plan.md)
- Agent client: [src/lib/agent-client.ts](../../src/lib/agent-client.ts)
