# Tasks: Backend–Vercel Integration

## Phase 1: Documentation

- [x] **1.1** Add "Python Backend (Game Master Agents)" section to `docs/ENV_AND_VERCEL.md`
  - Document `NEXT_PUBLIC_BACKEND_URL` (Vercel)
  - Document backend env: `DATABASE_URL`, `OPENAI_API_KEY`, `CORS_ORIGINS`
- [x] **1.2** Add `CORS_ORIGINS` to `backend/.env.example` with example production value

## Phase 2: Deployment Config

- [x] **2.1** Create `backend/railway.json` for Railway deploy
- [x] **2.2** Ensure backend listens on `PORT` when set (Railway/Render inject `PORT`)
  - railway.json startCommand uses `${PORT:-8000}`; render.yaml dockerCommand uses `$PORT`
- [x] **2.3** Create `backend/render.yaml` for Render deploy

## Phase 3: Verification

- [ ] **3.1** Local: `curl http://localhost:8000/api/health` returns 200
- [ ] **3.2** Local: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npm run dev` — agent calls hit backend
- [ ] **3.3** Production: Deploy backend, set env, verify from Vercel app
