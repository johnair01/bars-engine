> ⚠️ **[ARCHIVED — Railway backend DEPRECATED 2026-04-18]**
> Railway was replaced by Render as the production backend. All Railway references are historical. Current production backend: `https://bars-backend-5fhb.onrender.com`

# 🎭 Diplomat — Service Contract Analysis

*Investigation date: 2026-04-17 | Focus: bars-engine deployment crisis*

---

## Service Map (who provides what)

### Service 1 — Vercel Next.js Frontend (Vercel Serverless)
**Provides:**
- React Server Component pages (`page.tsx` — the dashboard home)
- Next.js API routes (TypeScript) at `/api/*`
- Server Actions (`src/actions/*.ts`)
- Direct Prisma DB access from Server Components and actions
- Static asset serving

**Tech stack:** Next.js 14+ App Router, TypeScript, Prisma ORM

---

### Service 2 — Railway Python/FastAPI Backend (`backend/`)
**Provides:**
- Game Master AI agents (6 faces: Architect, Challenger, Diplomat, Regent, Sage, Shaman)
- Narrative generation (quest drafts, passage generation, emotional alchemy readings)
- Campaign generation from narrative kernels
- Sprite system (avatar generation)
- Strand runner (persistent agentic loops)
- Health checks (`/healthz`, `/`)

**Tech stack:** Python 3.11+, FastAPI, PydanticAI, SQLAlchemy (async), OpenAI

**Routes exposed:**
```
GET  /healthz                          — Railway probe, no deps
GET  /                                 — Root health
POST /api/agents/architect/draft       — Quest draft generation
POST /api/agents/architect/analyze-chunk
POST /api/agents/architect/compile
POST /api/agents/challenger/propose    — Available moves
POST /api/agents/shaman/read           — Emotional alchemy
POST /api/agents/shaman/identify        — Nation/archetype from text
POST /api/agents/shaman/suggest-shadow-name
POST /api/agents/regent/assess         — Campaign assessment
POST /api/agents/diplomat/guide         — Story bridge
POST /api/agents/diplomat/refine-copy   — Campaign copy refinement
POST /api/agents/mapping_proposer       — Face field affinity
POST /api/agents/generate-campaign      — Multi-passage from kernel
POST /api/agents/generate-passage       — Single passage
POST /api/strands/*                    — Strand runner routes
POST /api/sprites/*                    — Sprite routes
```

**Database access:** Own SQLAlchemy connection to the **same** Prisma-managed Postgres DB (configured via `DATABASE_URL` env var).

---

### Service 3 — Prisma Postgres DB (shared)
**Provides:**
- Single source of truth for all entities: Player, Bar, Quest, Instance, Thread, AppConfig, etc.
- Shared connection string — both Vercel (via `@/lib/db`) and Railway (via `app/database.py`) connect here

**Connection strings:**
- Vercel: `DATABASE_URL` (via `@/lib/db` — Prisma client)
- Railway: `DATABASE_URL` (via SQLAlchemy async)

---

## API Contracts (what each endpoint promises)

### Contract: Vercel → Railway (`NEXT_PUBLIC_BACKEND_URL`)
**Intended shape:**
```
POST {NEXT_PUBLIC_BACKEND_URL}/api/agents/{face}/{action}
Body: { player_id?, instance_id?, narrative_lock?, ... }
Response: { agent, output, deterministic, legibility_note, usage_tokens? }
```

**What Railway promises:**
- Returns `AgentResponse[T]` with deterministic fallback when `OPENAI_API_KEY` is not set
- All agent endpoints have dual-track: AI path + deterministic fallback
- DB errors during agent sub-tasks (composting check, WAVE move discernment) are fail-soft — they return `None`/`[]` rather than 500ing
- Requires `player_id` via header or body (auth: `get_current_player_id()` reads Vercel-deployed cookie)

**What Vercel promises:**
- Sends `player_id` (from Vercel cookie) so Railway can authorize and personalize

---

### Contract: Railway → Prisma DB
**Intended shape:**
- Railway agent deps (`AgentDeps`) carry a SQLAlchemy `AsyncSession`
- Agents query the same Postgres DB as Vercel
- Schema is managed by Vercel/Prisma migrations — Railway is a consumer

---

### Contract: `page.tsx` (Server Component) → Prisma
**Promised shape:**
- `db.player.findUnique(...)` for authenticated player data
- `db.vibulon.count(...)` for wallet
- `db.customBar.findMany(...)` for bar vault
- `db.ichingReadings`, `db.threadProgress`, etc.
- All wrapped in `Promise.all([...])` with `.catch(() => [])` defensive fallbacks

---

### Contract: Server Actions → Prisma
**Promised shape:**
- All `src/actions/*.ts` files (`'use server'`) call Prisma via `@/lib/db`
- No HTTP calls to external services — pure DB operations
- `revalidatePath()` triggers Next.js cache invalidation

---

## Broken Contracts (where promises are broken)

### 🔴 CRITICAL: Railway backend is never called

**Finding:** There is **zero** HTTP calls from the Next.js frontend to `NEXT_PUBLIC_BACKEND_URL` anywhere in the codebase.

Evidence:
- `getCampaignMilestoneGuidance` (the most likely candidate for Railway integration) calls Prisma directly: `db.gameboardSlot.count(...)`, `getActiveInstance()`, `getOnboardingStatus()` — no HTTP to Railway
- `grep_search` for `NEXT_PUBLIC_BACKEND_URL` returns no matches
- `grep_search` for `backend_url` returns no matches
- `grep_search` for `fetch` with `vercel.json` context returns no matches

**What this means:** The Railway backend is deployed and healthy (health checks pass), but it is a **ghost service** — running with no consumers. The Game Master agents exist but cannot be invoked from the current frontend code path.

**Impact:** Players cannot access AI-generated quest drafts, emotional alchemy readings, campaign guidance, or sprite generation. All of these fall back to deterministic stubs or are unreachable.

---

### 🟡 MEDIUM: Two separate Prisma/schema consumers with no coordination

**Finding:** Railway uses SQLAlchemy (Python) directly on the same Postgres DB that Vercel manages via Prisma (TypeScript).

**Problem:** 
- Prisma migrations are the source of truth for schema
- Railway consumes but does not participate in migration lifecycle
- If a migration adds a column or table that Railway's SQLAlchemy models don't know about, Railway queries silently fail or return wrong data
- `backend/app/models/` has hand-written SQLAlchemy models — these can drift from the Prisma schema

**Contract at risk:** Railway → Prisma DB. Railway's SQLAlchemy models must track Prisma schema changes.

---

### 🟡 MEDIUM: Railway auth depends on Vercel cookie, but they're separate domains

**Finding:** Railway's `get_current_player_id()` reads a cookie from the Railway deployment's own HTTP request. But the `bars_player_id` cookie is set by Vercel on a different origin.

**Problem:**
- Player logs into Vercel frontend → cookie set for `*.vercel.app`
- Player's browser calls Railway directly → cookie NOT sent (different origin)
- Railway auth fails → agent calls fail for authenticated players
- Railway would need its own auth system, or Vercel must proxy ALL Railway calls

**Contract at risk:** Vercel → Railway auth. Unless Railway is **only** called server-side (not from browser), this auth mismatch breaks the contract.

---

### 🟡 LOW: No evidence of Vercel serverless Python backend

**Finding:** The context mentioned commits `4fc86ff` and `3955e99` as "Vercel serverless Python backend." No such thing exists in the current codebase. Vercel is Node.js/Next.js only for this project. Railway is the Python backend, and it runs on Railway (not Vercel).

**This may indicate:** The crisis being investigated is partly based on stale context. Railway exists and is deployed, but the "two backends" narrative may be wrong — there's one Python backend (Railway) and one Next.js API layer (Vercel). They are not redundant; they serve different purposes.

---

## Boundary Violations (where frontend/backend contract is violated)

### ✅ What IS working correctly: proper Server Component boundary

`page.tsx` is a React Server Component (no `'use client'` directive). It correctly:
- Reads cookies server-side
- Makes direct Prisma calls (acceptable in Next.js App Router for Server Components)
- Passes serializable data to Client Components as props

This is a valid architecture pattern for Next.js App Router — Server Components CAN call the database directly. The boundary is correctly drawn between the Server Component and Client Components (marked `'use client'`).

---

### 🔴 Violation: Railway's intended purpose is not being fulfilled

Railway's `/api/agents/*` routes exist to be called by the frontend. The contract is:

```
Frontend calls Railway → Railway generates AI content → Railway returns content
```

This contract is **not being exercised at all**. The ghost service problem.

---

### 🟡 Violation: Campaign milestone guidance — action vs. external API ambiguity

`getCampaignMilestoneGuidance` in `src/actions/campaign-milestone-guidance.ts` calls:
- `getActiveInstance()` → Prisma
- `buildMilestoneSnapshot()` → local computation
- `db.gameboardSlot.count()` → Prisma

There is **no call to Railway**, despite "milestone guidance" sounding like something a Game Master agent should provide. The function computes guidance locally from DB state. If the intent was for the Regent or Diplomat agent to provide this guidance, the contract is broken — it's not calling Railway.

---

## Graceful Degradation (what happens when a contract is unmet)

### Railway agent endpoints — ✅ Graceful degradation built in
Every agent endpoint in Railway has deterministic fallback:

```python
if not settings.openai_api_key:
    return AgentResponse[QuestDraft](
        agent="architect",
        output=deterministic_architect_draft(...),
        deterministic=True,
        legibility_note="Deterministic fallback — no AI model configured.",
    )
```

Similarly, sub-operations like composting checks and WAVE move discernment fail softly.

**When Railway is unreachable from Vercel:** Players get deterministic stubs instead of AI content. Not catastrophic, but the AI features are effectively disabled.

---

### `page.tsx` DB calls — ✅ Graceful degradation present
The homepage wraps all DB calls in `Promise.all([...])` with `.catch(() => [])`:

```typescript
const [threads, packs, appreciationResult, chargeResult, archiveResult, todayCheckIn, myCampaignSeeds, campaignsResponsible] = await Promise.all([
    getPlayerThreads().catch(() => []),
    getPlayerPacks().catch(() => []),
    getAppreciationFeed(10).catch(() => ({ appreciations: [] })),
    // ...
])
```

If the DB is unreachable, the page renders with empty/default data rather than crashing.

**Edge case:** Early in the function (before the `Promise.all`), `getAppConfig()` and `getActiveInstance()` are called outside the defensive wrapper. If these fail, the try/catch around them catches it and uses fallbacks.

---

### `getCampaignMilestoneGuidance` — ✅ Fail-soft
```typescript
try {
    milestoneGuidance = await getCampaignMilestoneGuidance(playerId)
} catch {
    milestoneGuidance = null
}
```
When the function throws (DB error, schema drift), `null` is returned and the dashboard simply hides the milestone strip.

---

## Contract Priority (which broken contract, if fixed first, unlocks the most progress)

### 🥇 Priority 1: Verify Railway deployment health and URL configuration
**Why:** Before any integration work, confirm Railway is actually deployed and what its URL is. The `NEXT_PUBLIC_BACKEND_URL` env var must be set in Vercel's environment.

**Risk if broken:** Setting `NEXT_PUBLIC_BACKEND_URL` incorrectly points the frontend at a wrong/missing URL, causing all agent calls to 500.

**Should be:** Integrated (not custom) — set the Railway production URL as `NEXT_PUBLIC_BACKEND_URL` in Vercel env vars.

---

### 🥈 Priority 2: Railway auth cookie cross-origin fix
**Why:** Without this, even if Railway is called, authenticated player context is lost. Agents can't personalize, and some routes may 401.

**Options:**
- **Option A (preferred):** Never call Railway from the browser. All Railway calls happen in Next.js Server Components or API routes (server-to-server), where Vercel's internal routing can forward the cookie.
- **Option B:** Set `NEXT_PUBLIC_BACKEND_URL` to a same-origin proxy on Vercel (`/api/railway/*`) that forwards to Railway, so cookies are automatically included.
- **Option C:** Railway issues its own JWT/session token, separate from Vercel's cookie. High complexity.

**Should be:** Custom — requires architecture decision.

---

### 🥉 Priority 3: Actually call Railway from `getCampaignMilestoneGuidance` (or clarify intent)
**Why:** Either the Regent agent should be providing milestone guidance (Railway contract), or the current local computation is correct and the function should be renamed to remove the implication that it calls an agent.

**Options:**
- **If AI guidance intended:** Replace local `buildMilestoneSnapshot` with a call to `POST {BACKEND_URL}/api/agents/regent/assess` or a new milestone guidance endpoint
- **If local is correct:** Rename to `getLocalCampaignMilestoneGuidance` and remove the agent implication

**Should be:** Custom — requires product decision.

---

### Priority 4: Align Railway's SQLAlchemy models with Prisma schema drift
**Why:** When new columns/tables are added via Prisma migrations, Railway's Python models may not reflect them, causing silent failures in agent queries.

**Fix:** Add Railway to the migration pipeline, or ensure SQLAlchemy models are auto-generated from Prisma schema.

**Should be:** Deferred — low immediate impact since agents primarily write/log rather than read complex joined queries.

---

## Summary Table

| Contract | Status | Severity | Fix Priority |
|---|---|---|---|
| Vercel → Railway (HTTP calls) | ❌ Ghost service — never called | CRITICAL | P1 |
| Railway → Prisma DB | ⚠️ Separate consumers, drift risk | MEDIUM | P4 |
| Railway auth (cookie cross-origin) | ❌ Cookie not sent to Railway | CRITICAL | P2 |
| `getCampaignMilestoneGuidance` → Railway | ❌ Calls Prisma, not Railway | MEDIUM | P3 |
| `page.tsx` → Prisma (direct) | ✅ Acceptable in Next.js App Router | N/A | N/A |
| Server Actions → Prisma | ✅ Correct `'use server'` boundary | N/A | N/A |
| Railway deterministic fallbacks | ✅ Well-implemented | N/A | N/A |
| `page.tsx` defensive `.catch()` | ✅ Graceful degradation | N/A | N/A |

---

## Recommendation

The most impactful single fix is **Priority 1 + 2 combined**: decide whether Railway is meant to be called from the browser (requiring a same-origin proxy or cookie fix) or from server-side only (safer), then actually wire up `NEXT_PUBLIC_BACKEND_URL` and make one successful agent call from a test action. Until then, Railway is a deployed but completely unused ghost service.
