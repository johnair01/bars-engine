# Python Backend & DB Connection — Research Summary

Research into whether the Python backend introduction (commit d29a947) or related changes could have affected where the database is supposed to connect.

---

## Summary

**The Python backend and related tooling do not directly change where the Next.js app connects.** They share `.env.local` and use the same `DATABASE_URL`. However, the **switch-db-mode script** (introduced with the backend) **overwrites** `DATABASE_URL` in `.env.local`, and there are edge cases that could cause confusion or wrong-DB usage.

---

## What Was Introduced with the Python Backend (d29a947)

| Addition | Purpose | DB impact |
|----------|---------|-----------|
| `backend/` | FastAPI + Pydantic AI agents | Shares same DB as Next.js via `.env.local` |
| `scripts/switch-db-mode.ts` | Switch between local Docker and Vercel DB | **Overwrites `DATABASE_URL` in `.env.local`** |
| `dev:local` | `switch -- local` + `db:seed` + `dev` | Points at local Docker, seeds it |
| `dev:vercel` | `switch -- vercel` + `dev` | Restores `DATABASE_URL` from backup |
| `ensureBackendReady` (later) | Auto-start backend for agent scripts | Passes `process.env` to backend; no env file changes |

---

## How the Backend Gets Its DB URL

**Backend config** (`backend/app/config.py`):

```python
model_config = {
    "env_file": (".env", "../.env.local"),  # loads from backend/.env and repo_root/.env.local
    ...
}
```

- `database_url` maps to env var `DATABASE_URL`
- When running `npm run dev:backend`, cwd is `backend/`, so `../.env.local` = repo root `.env.local`
- **Backend uses the same `.env.local` as Next.js** — same DB

**Backend does NOT:**
- Use `PRISMA_DATABASE_URL` (Accelerate) — it needs a direct Postgres URL for asyncpg
- Run migrations, seeds, or destructive operations
- Modify `.env.local` or any env files

---

## How switch-db-mode Affects the DB

**`npm run switch -- local`**:
1. Reads `.env.local`
2. If `DATABASE_URL` is not localhost: backs up to `.env.local.backup`
3. Sets `DATABASE_URL = postgresql://postgres:postgres@localhost:5432/bars_engine`
4. **Overwrites** `.env.local` with the full env (all vars preserved, only `DATABASE_URL` changed)

**`npm run switch -- vercel`**:
1. Reads `.env.local`
2. If `.env.local.backup` exists: restores `DATABASE_URL` from it, deletes backup
3. If **no backup**: prints "No backup found. Re-run: npm run env:pull" and **returns without writing**
4. **Result**: `.env.local` stays as-is — if it was previously switched to local, you remain on local

**`switch` only touches `DATABASE_URL`** — it does not modify `PRISMA_DATABASE_URL`, `POSTGRES_PRISMA_URL`, or `POSTGRES_URL`.

---

## Potential Confusion Scenarios

1. **`dev:vercel` with no backup**
   - You previously ran `switch -- local` (backup created).
   - You run `vercel env pull` (overwrites `.env.local` with fresh Vercel vars; backup might be overwritten or stale).
   - You run `dev:vercel` → `switch -- vercel` → no backup → script returns without writing.
   - **Result**: `.env.local` still has whatever Vercel env pull put there. You should be on Vercel. But if backup was deleted and you had run switch -- local before, you'd have local URL.

2. **Backup vs. `vercel env pull`**
   - `switch -- local` backs up `DATABASE_URL` to `.env.local.backup`.
   - Later `vercel env pull` overwrites `.env.local` with current Vercel vars.
   - `switch -- vercel` restores from `.env.local.backup` (old value), not from the freshly pulled `.env.local`.
   - **Result**: You could restore an outdated `DATABASE_URL` if Vercel env changed.

3. **Two different local Postgres setups**
   - `switch-db-mode`: `postgresql://postgres:postgres@localhost:5432/bars_engine`
   - Backend docker-compose: `bars:bars@postgres:5432` (service name), host port 5433
   - **Result**: If you use `switch -- local` but run backend via `docker compose up`, the backend in Docker uses its own Postgres container; Next.js uses localhost:5432. They can point at different DBs.

---

## Does the Backend Wipe Data?

**No.** The backend:
- Uses SQLAlchemy models that map to the same Prisma tables (`players`, `accounts`, etc.)
- Has no `TRUNCATE`, `DELETE FROM`, or schema reset logic
- Does not run migrations or seeds
- Only reads/writes via normal ORM operations

---

## Does ensureBackendReady Change DB Connection?

**No.** When `ensureBackendReady` spawns `npm run dev:backend`:
- It passes `env: process.env` (inherits parent env)
- Parent has already loaded `.env.local` (via dotenv in scripts)
- Backend loads `../.env.local` again in its config
- Same `DATABASE_URL` as Next.js

---

## Conclusion

| Question | Answer |
|----------|--------|
| Did the Python backend change where Next.js connects? | **No.** Next.js uses `db-resolve.ts`; the backend was not part of that. |
| Did switch-db-mode change where we connect? | **It can.** It overwrites `DATABASE_URL` in `.env.local` when you run `switch -- local` or `switch -- vercel`. |
| Could running `dev:local` by mistake point prod at local? | **No.** `dev:local` only changes your local `.env.local`. The deployed app uses Vercel env vars. |
| Could the backend wipe the DB? | **No.** No destructive operations. |
| Could switch/backend cause "wrong DB" locally? | **Yes.** Running `dev:local` points you at local Docker. Running `dev:vercel` without a backup leaves you on whatever was in `.env.local` before. |

**Recommendation:** If you're unsure which DB you're using, run `npm run diagnose:db` and `npm run diagnose:connection` before any destructive or sensitive operations.
