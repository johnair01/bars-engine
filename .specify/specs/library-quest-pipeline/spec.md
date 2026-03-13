# Spec: Library Quest Pipeline — Local Agent Analysis

## Purpose

Activate the full agent-powered book analysis pipeline against production data restored to local DB. This closes the gap between the agent-admin wiring (implemented) and actual quest generation from the 12 uploaded books.

**Problem**: 5 books are "extracted" with zero quests. 1 analyzed book (The Skilled Helper) yielded 0 quests. The backend health check URL is wrong, so agent routing silently falls through to Tier-2 on every call. The pipeline has never run end-to-end with agents.

**Practice**: Deftness Development — spec kit first, API-first, fail-fix workflow.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Health check fix | `isBackendAvailable()` checks `/health` but backend serves `/api/health`. Fix the client. |
| Analysis target | Run against local DB (production mirror), not production directly. Protects production. |
| Agent tier | Tier-1 (backend agents) is the goal. Tier-2 (direct OpenAI) is fallback. |
| Book priority | Smallest books first → validate → then large books. Hearts Blazing (9K) → Holacracy (11K) → Integral Communication (47K) → Reinventing Orgs (152K) → 10000 Hours (139K) |
| Skilled Helper | Diagnose before re-analyzing. Check metadata and resume logs. |
| Script approach | Reuse existing `analyzeBook()` server action via tsx script calling it directly. |

## Generative Dependencies

Fixing the health check URL (FR1) is the **generative dependency** — it eliminates:
- Silent fallthrough on every agent call across the entire codebase
- The need to debug "why aren't agents working" in future features
- Misreporting of agent availability in all six Game Master endpoints

## API Contracts

### Existing — No new endpoints needed

Health check (backend): `GET /api/health` → `{ status: "ok", environment: string }`
Agent analyze: `POST /api/agents/architect/analyze-chunk` → `AgentResponse<QuestDraft>`

The only change is the client-side health check URL.

## Functional Requirements

### Phase 1: Fix Infrastructure

- **FR1**: Fix `isBackendAvailable()` in `src/lib/agent-client.ts` to check `/api/health` instead of `/health`
- **FR2**: Verify backend is running and accessible at `http://localhost:8000/api/health`

### Phase 2: Diagnose & Analyze

- **FR3**: Diagnose why The Skilled Helper (262K words, status=analyzed) produced 0 quests — check `bookAnalysisResumeLog` and `metadataJson`
- **FR4**: Run `analyzeBook()` on the 5 extracted books in priority order (Hearts Blazing → Holacracy → Integral Communication → Reinventing Organizations → 10000 Hours of Play)

### Phase 3: Verify Pipeline

- **FR5**: Confirm quests are created in `customBar` table with `completionEffects.source = 'library'`
- **FR6**: Verify agent routing logged in backend (Tier-1 path used, not fallthrough)

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | `generateObjectWithCache` caches responses; 2-batch parallelism with 6s delay already in `runChunkAnalysis` |
| Rate limits | 15-chunk sample cap per `analyzeBook()` call; `analyzeBookMore()` limited to 3 resumes/day |
| Request body | Book chunks ~2-5KB each; well within limits |
| Env | `OPENAI_API_KEY` needed in backend `.env`; `DATABASE_URL` for local postgres |

## Verification

- `curl http://localhost:8000/api/health` returns `{"status":"ok"}`
- After analysis: `SELECT count(*) FROM custom_bars WHERE completion_effects->>'source' = 'library'` increases
- Backend logs show agent calls (not just fallthrough)
- `npm run build` passes
- `npm run check` passes

## Dependencies

- [agent-admin-wiring](.specify/specs/agent-admin-wiring/) — implemented, provides the backend agents
- Production data restored to local DB — done (6,064 records)

## References

- [src/lib/agent-client.ts](src/lib/agent-client.ts) — health check fix location
- [src/actions/book-analyze.ts](src/actions/book-analyze.ts) — `analyzeBook()`, `runChunkAnalysis()`
- [backend/app/routes/agents.py](backend/app/routes/agents.py) — `/api/agents/architect/analyze-chunk`
- [backend/app/agents/architect.py](backend/app/agents/architect.py) — Architect agent
