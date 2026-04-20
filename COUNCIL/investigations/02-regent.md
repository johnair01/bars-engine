⚠️ **[ARCHIVED — Railway backend DEPRECATED 2026-04-18]**
> Railway was replaced by Render as the production backend. All Railway references are historical. Current production backend: `https://bars-backend-5fhb.onrender.com`

# 🏛 Regent — Failure Mode Analysis

**Signal:** Railway backend returns 502 on `/api/` — healthchecks failing, Vercel frontend recently rebuilt.
**Context:** Dockerfile CMD changed from `python -m uvicorn` to bare `uvicorn`; registry.json regenerated April 18.

---

## Failure Modes (ranked: #1 most likely first)

---

### #1 — Railway uvicorn crash on startup (Wrong module path)

**Severity:** Critical | **Likelihood:** Very Likely

**Evidence:**
- `railway.json` `startCommand`: `"uvicorn app.main:app --host 0.0.0.0 --port $PORT"`
- New `Dockerfile` CMD: `["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]`
- Old Dockerfile (inferred from description): `python -m uvicorn` or `python -m uvicorn app.main:app`
- `uvicorn` binary invoked directly with `app.main:app` works when running from `/app` directory, but the Railway *startCommand* in `railway.json` is what Railway actually executes — and it uses the raw module path `app.main:app` without the Python namespace prefix
- **This is the key:** Railway's startCommand runs `uvicorn app.main:app` but Python's `app/` package `__init__.py` may not properly expose the `app` object, OR the `$PORT` variable expansion may fail if Railway doesn't inject it at the right layer
- The module `app.main` exists at `/app/app/main.py` — `uvicorn app.main:app` looks for `app.main` as a Python importable path, which from WORKDIR `/app` should work, BUT the Docker container's `CMD` was changed to bare `uvicorn` which omits the module resolution context
- A 502 from Railway's load balancer means uvicorn is either not binding the port or crashing before accepting connections

**Confirms at:**
```bash
# SSH into Railway container or check Railway logs
railway logs --service <backend-service-id>

# Or locally:
cd /home/workspace/bars-engine/backend && docker build -t bars-backend-test . && docker run --rm -e PORT=8080 bars-backend-test
# Watch for: "Application startup complete" vs "ModuleNotFoundError"
```

**Fix:** Revert Dockerfile CMD to use `python -m uvicorn app.main:app` or ensure `railway.json` startCommand is `"python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"`.

---

### #2 — Railway healthcheck hitting `/api/` (not `/healthz`)

**Severity:** Critical | **Likelihood:** Very Likely

**Evidence:**
- `main.py` has two endpoints: `/healthz` (always 200, no deps) and `/` (simple 200), but `/api/` is NOT defined in `main.py`
- Railway's default healthcheck probes `/` by default, but if the deploy was configured to probe `/api/` specifically, it will 404 → Railway kills the container → 502
- The context says "healthchecks are failing on Railway" — this is the symptom, not the cause

**Confirms at:**
```bash
# Check Railway deploy config for healthcheck path
railway env --service <backend-service-id> 2>/dev/null || railway show <backend-service-id>
# Look for RAILWAY_HEALTHCHECKPATH or Railway dashboard → Service → Health Check

# Manual check against live Railway URL:
curl -v https://<railway-backend-url>/healthz
curl -v https://<railway-backend-url>/api/
```

**Fix:** Set Railway healthcheck path to `/healthz` (or `/`), not `/api/`.

---

### #3 — Prisma schema drift / missing `instances` or `app_config` table

**Severity:** High | **Likelihood:** Likely

**Evidence:**
- `instance.ts` `getActiveInstance()` has explicit try/catch for P1001/P1002 ("Can't reach database server") and logs `"likely schema drift"`
- `instance.ts` has a `getInstanceDbReadiness()` function that checks for `instances` table and `activeInstanceId` column in `app_config` — this was added as a defensive measure precisely because schema drift has happened before
- Homepage calls `getActiveInstance()` before auth check on every page load
- `page.tsx` line ~95: `appConfig = await getAppConfig()` + `activeInstance = await getActiveInstance()` wrapped in try/catch — if `getAppConfig()` crashes, the whole page gets `{}` for config, which may cascade into broken redirects

**Confirms at:**
```bash
# Run the readiness check:
node -e "
const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');
async function main() {
  const db = new PrismaClient();
  try {
    const [t1] = await db.\$queryRaw\`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='instances') AS exists\`;
    const [t2] = await db.\$queryRaw\`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='app_config' AND column_name='activeInstanceId') AS exists\`;
    console.log('instances table:', t1.exists);
    console.log('app_config.activeInstanceId:', t2.exists);
  } finally { await db.\$disconnect(); }
}
main().catch(console.error);
"

# Or check via Prisma:
DATABASE_URL="<prod-url>" npx prisma db execute --stdin <<< "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='instances')"
```

**Fix:** Run `prisma migrate deploy` against production DB.

---

### #4 — `NEXT_PUBLIC_BACKEND_URL` pointing to stale/wrong Railway URL after redeploy

**Severity:** High | **Likelihood:** Likely

**Evidence:**
- Railway assigns a new URL on each redeploy unless a custom domain is configured
- Vercel frontend was rebuilt (registry.json regenerated April 18) — if env vars were pulled at that point and Railway had just redeployed, Vercel may be pointing to an old dead URL
- The backend returns 502 — this is exactly what happens when Vercel's server-side `fetch` calls `NEXT_PUBLIC_BACKEND_URL/api/...` and Railway's old instance is gone

**Confirms at:**
```bash
# Check what URL the frontend is actually using (Vercel dashboard → env vars or local .env.local)
grep -r "NEXT_PUBLIC_BACKEND_URL" /home/workspace/bars-engine/.env* 2>/dev/null

# Curl the suspected Railway backend URL:
curl -sv https://<railway-url>/healthz
curl -sv https://<railway-url>/api/

# If 502 on /api/ but /healthz works → backend is up but /api/ route doesn't exist
# If connection refused → wrong URL or backend down
```

**Fix:** Update `NEXT_PUBLIC_BACKEND_URL` in Vercel env vars to the current Railway URL.

---

### #5 — Database connection failure (credentials, network, Accelerate)

**Severity:** High | **Likelihood:** Possible

**Evidence:**
- Production uses `PRISMA_DATABASE_URL` with Accelerate (`prisma+postgres://`) — this requires network access to Prisma's cloud proxy
- If `DATABASE_URL` (direct Postgres) is being used instead of Accelerate in production, connection string may be wrong
- `db-resolve.ts` shows production prefers `PRISMA_DATABASE_URL` then `POSTGRES_PRISMA_URL` then `DATABASE_URL` — but the actual Prisma client setup uses `datasources: { db: { url: dbConfig.url } }` which overrides the schema URL
- `PrismaClientInitializationError` with "Can't reach database server" would cause the homepage's DB queries to fail

**Confirms at:**
```bash
# Test DB connectivity (from a machine with network access to prod DB):
DATABASE_URL="<prod-url>" npx prisma db execute --stdin <<< "SELECT 1"

# Or via psql:
PGPASSWORD=<password> psql "<prod-url>" -c "SELECT 1"
```

**Fix:** Verify `PRISMA_DATABASE_URL` or `DATABASE_URL` is correct in Railway env vars.

---

### #6 — CORS origin mismatch after rebuild

**Severity:** Medium | **Likelihood:** Possible

**Evidence:**
- `main.py` CORS origins: `_cors_origins = settings.cors_origins.split(",") if settings.cors_origins else _default_origins`
- Default origins are only `localhost:3000` and `localhost:3001` — not Vercel
- If `CORS_ORIGINS` env var was not set during the Railway redeploy, CORS blocks all browser API calls
- This wouldn't cause a 502 — it would cause CORS errors in the browser console, but the 502 is from Railway healthcheck failing, which could be a separate root cause compounding it

**Confirms at:**
```bash
curl -sv -X OPTIONS https://<railway-url>/ \
  -H "Origin: https://<vercel-frontend-url>" \
  -H "Access-Control-Request-Method: GET"
# Look for Access-Control-Allow-Origin in response headers
```

**Fix:** Set `CORS_ORIGINS=https://<vercel-app>.vercel.app,<other-origins>` in Railway env vars.

---

### #7 — Sticky redirect gates on page.tsx firing incorrectly (nationId/archetypeId null)

**Severity:** Medium | **Likelihood:** Unlikely (defensive code present)

**Evidence:**
- Lines 318–324 in `page.tsx` have sticky redirect gates based on `player.nationId` and `player.archetypeId`
- These should redirect to `/onboarding` for incomplete setups
- But `player` is fetched after auth check (line ~140 `const player = await getCurrentPlayer()`), and if auth fails, the redirect to `/arrival` fires first
- The page has extensive try/catch wrapping on all DB calls — it is defensively written
- However: `ensureWallet()` call at line ~180 could throw if DB is unreachable, crashing the page even for authenticated users

**Confirms at:**
```bash
# Test with a known player ID that has incomplete onboarding:
curl -b "bars_player_id=<test-player-id>" https://<frontend-url>/

# Check Railway logs for redirect targets:
railway logs --service <backend-service-id> 2>&1 | grep -i "redirect\|nationId\|archetype"
```

**Fix:** These are unlikely to be the primary failure — they are defensive redirects that work as designed.

---

### #8 — Vercel rebuild introduced breaking changes (registry.json regenerated April 18)

**Severity:** Medium | **Likelihood:** Unlikely (no deploy hooks info)

**Evidence:**
- `registry.json` regenerated could mean a new Prisma client was generated, but the schema hasn't changed
- Vercel frontend rebuild alone wouldn't cause a 502 on the Railway backend
- Unless the rebuild changed `NEXT_PUBLIC_BACKEND_URL` or other env var defaults

**Confirms at:**
```bash
# Compare old vs new registry.json:
git show HEAD~1:registry.json 2>/dev/null | head -50
git show HEAD:registry.json 2>/dev/null | head -50

# Check if .env.local was updated after the rebuild:
ls -la /home/workspace/bars-engine/.env.local
```

**Fix:** Re-pull env vars from Vercel: `npx vercel env pull .env.local --yes`

---

## 🏛 Regent Verdict

**Most likely killing the deployment (in order):**

1. **Wrong CMD in Dockerfile** (`uvicorn` vs `python -m uvicorn`) — uvicorn can't find the module, Railway's startCommand fails, healthcheck dies, 502 fires
2. **Railway healthcheck probing `/api/`** instead of `/healthz` — default healthcheck path doesn't exist, Railway kills the container thinking it's dead
3. **Stale `NEXT_PUBLIC_BACKEND_URL`** after Railway redeploy — Vercel points to the old dead Railway instance

**Fastest confirmation path:**
```bash
# Step 1: Check Railway logs — this answers 3 questions at once
railway logs --service <backend-service-id>

# Step 2: Curl the Railway healthz endpoint
curl -sv https://<railway-url>/healthz

# Step 3: Check what URL Vercel is configured to call
npx vercel env var list 2>/dev/null | grep BACKEND
```

**If I had to fix one thing right now:** Revert the Dockerfile CMD back to `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT` and confirm Railway healthcheck path is `/healthz`. That's the 502.
