# Strand Troubleshooting

## What’s happening

The strand API (`POST /api/strands/run`) runs a Shaman → Sage → Architect pipeline. Each sect makes an LLM call. With real OpenAI calls, a full strand typically takes **3–10 minutes**.

## Common issues

### 1. Client timeout (curl / fetch)

**Symptom**: Request hangs, then times out. No response.

**Cause**: Strand takes 3–10 min; default client timeouts (e.g. 30–180s) are too short.

**Fix**:
- Use a long timeout (e.g. 600s = 10 min)
- Or run in background and poll for results

```bash
# Diagnostic script (health + optional strand run)
npx tsx scripts/strand-diagnose.ts --local
npx tsx scripts/strand-diagnose.ts --local --run-strand "short subject"
```

### 2. Wrong health URL

**Symptom**: Health check fails or times out.

**Cause**: Health is at `/api/health`, not `/health`.

```bash
# Correct
curl http://localhost:8000/api/health

# Wrong
curl http://localhost:8000/health  # 404
```

### 3. Backend not responding (all requests hang)

**Symptom**: Even `/api/health` times out.

**Possible causes**:
- **Backend not running**: Start with `npm run dev:backend`
- **Backend overloaded**: Multiple strand requests can tie up workers. Kill hung `curl` processes and restart the backend.
- **DB connection pool exhausted**: Strands hold DB sessions until commit. Too many concurrent strands can exhaust the pool.

**Check**:
```bash
lsof -i :8000   # See what's connected
# Kill hung curl: kill <pid>
# Restart backend: Ctrl+C in backend terminal, then npm run dev:backend
```

### 4. Strand completes but client never gets response

**Symptom**: Strand BAR appears in DB, but curl/fetch timed out.

**Cause**: Client gave up before the server finished. The strand ran to completion.

**Fix**: Query the DB for the strand BAR and fetch results:

```bash
# List recent strands (requires DATABASE_URL)
npx tsx -e "
import './require-db-env'
import { db } from './src/lib/db'
const s = await db.customBar.findMany({
  where: { type: 'strand' },
  orderBy: { createdAt: 'desc' },
  take: 5,
  select: { id: true, title: true, createdAt: true }
})
console.log(s)
"

# Fetch strand results
npx tsx scripts/fetch-strand-results.ts <strand_bar_id>
```

**Note**: `fetch-strand-results.ts` expects `audit_trail` entries with `data.output_preview`, `data.synthesis_preview`, `data.output_bar_id`. The runner stores these under `data`; the script may need updating if the schema differs.

### 5. OpenAI key not set — still calling LLM?

**Symptom**: Strand hangs even with no `OPENAI_API_KEY`.

**Cause**: The runner checks `if settings.openai_api_key`. With Pydantic `SecretStr`, an empty key might still be truthy. The runner should use `settings.openai_api_key.get_secret_value()` for consistency with the health route.

**Fix**: Ensure the strand runner uses `bool(settings.openai_api_key.get_secret_value())` when deciding whether to call real agents vs deterministic fallbacks.

### 6. Different databases (backend vs frontend)

**Symptom**: Strand runs but doesn’t appear when querying from Next.js/scripts.

**Cause**: Backend loads env from `backend/.env` and repo `.env.local`. If `DATABASE_URL` differs, strands are written to a different DB.

**Fix**: Confirm both use the same `DATABASE_URL` (e.g. in `.env.local`).

## Recommended workflow

1. **Start backend**: `npm run dev:backend`
2. **Verify health**: `curl http://localhost:8000/api/health` (should return quickly)
3. **Run strand** with long timeout:
   ```bash
   curl -X POST http://localhost:8000/api/strands/run \
     -H "Content-Type: application/json" \
     -d '{"type":"diagnostic","subject":"your subject"}' \
     --max-time 600
   ```
4. **If timeout**: Check DB for new strand BARs; use `fetch-strand-results.ts` with the `strand_bar_id`.

## Async strand execution (future)

A more robust approach: return `202 Accepted` immediately with a job ID, then poll for completion. That would avoid client timeouts and make long-running strands easier to manage.
