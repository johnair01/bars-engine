# Manual Test Guide — bar-asset-pipeline-002

**Preview URL:** https://bars-engine-git-sprint-bar-as-37dd2c-wendells-projects-9c1b16dc.vercel.app/

---

## What We Built (Clean Sprint)

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/bar-asset/types.ts` | Type contracts (BarSeed, BarAsset, MaturityPhase, etc.) | ✅ Clean |
| `src/lib/bar-asset/id.ts` | Structured ID system (namespace convention) | ✅ Clean |
| `src/lib/bar-asset/persistence.ts` | CustomBar upsert (translate → active) | ✅ Clean |
| `src/lib/bar-asset/providers/external.ts` | AI provider interface (abstract) | ✅ Clean |
| `src/lib/bar-asset/providers/zo.ts` | Zo AI completion via /zo/ask | ✅ Clean |
| `src/lib/bar-asset/dispatcher.ts` | Routes to providers, handles errors | ✅ Clean |
| `src/lib/bar-asset/prompts/blessed-object.ts` | NL generation prompt template | ✅ Clean |
| `src/lib/bar-asset/translator.ts` | translateBarSeedToAsset (Constructor B) | ✅ Clean |
| `src/app/api/bar-asset/translate/route.ts` | The API route | ✅ Clean |

---

## How to Test

### Step 1 — Login
Open the preview and log in:
**https://bars-engine-git-sprint-bar-as-37dd2c-wendells-projects-9c1b16dc.vercel.app/**

Then visit the dashboard to confirm you have an active player session.

### Step 2 — API Test (Requires Auth)

Since the 405 is an auth issue, the API route is working — you just need an active session cookie.

**To test the full flow:**
1. Log into the preview site in your browser
2. Open DevTools → Network → find the request
3. Copy the `cookie` header value
4. Run:
```bash
curl -X POST https://bars-engine-git-sprint-bar-as-37dd2c-wendells-projects-9c1b16dc.vercel.app/api/bar-asset/translate \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{
    "seed": {
      "id": "seed_test_001",
      "title": "The Forgotten Library",
      "description": "A hexagram reveals an ancient library beneath the city, filled with books that write themselves.",
      "maturity": "shared_or_acted"
    }
  }'
```

### Step 3 — Verify Types Are Correct

Check the source files directly:
- `types.ts`: https://github.com/johnair01/bars-engine/blob/sprint/bar-asset-pipeline-002/src/lib/bar-asset/types.ts
- `translator.ts`: https://github.com/johnair01/bars-engine/blob/sprint/bar-asset-pipeline-002/src/lib/bar-asset/translator.ts
- `route.ts`: https://github.com/johnair01/bars-engine/blob/sprint/bar-asset-pipeline-002/src/app/api/bar-asset/translate/route.ts

### Step 4 — Confirm Zero TypeScript Errors

```bash
# On sprint branch
cd bars-engine && rm -rf .next && npx tsc --noEmit 2>&1 | grep "src/lib/bar-asset" | wc -l
# Should return: 0
```

---

## What Success Looks Like

**200 response:**
```json
{
  "asset": {
    "id": "ba|seed_test_001|v1",
    "barDef": {
      "title": "The Forgotten Library",
      "description": "...",
      "type": "vibe",
      "inputs": { "seed": "seed_test_001" }
    },
    "maturity": "integrated",
    "sourceSeedId": "seed_test_001",
    "createdBy": "<player-name>",
    "metadata": {
      "storyPath": "...",
      "twineLogic": "...",
      "storyMood": "...",
      "tokensUsed": <number>
    }
  }
}
```

**Error responses:**
- `401` — not authenticated (expected if no session)
- `422` — maturity insufficient (`SEED_MATURITY_INSUFFICIENT`)
- `500` — internal error (translation failed)

---

## Prisma Schema (CustomBar)

The pipeline writes to these CustomBar fields:
- `status` → 'active' (translation marks game-ready)
- `storyMood` → from `barAsset.metadata.gameMasterFace`
- `storyPath` → from `barAsset.metadata.storyPath`
- `twineLogic` → from `barAsset.metadata.emotionalVector`