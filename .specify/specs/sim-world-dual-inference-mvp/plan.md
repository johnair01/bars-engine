# Plan: Sim World Dual Inference MVP

## Summary

Add a **pluggable inference layer** and **minimal telemetry** so one custodian can run BARs against **OpenAI APIs** and against a **self-hosted OpenAI-compatible** endpoint, using the **same** product flows. Pick **one or two** high-value call sites for Phase 1 to avoid boiling the ocean; expand call sites in later tasks.

## Implementation Order

### Phase 1: Design + env contract

1. **Finalize env var names** (proposal — adjust in implementation to match repo conventions):
   - `INFERENCE_PROVIDER=openai | openai_compatible | stub` (or reuse existing patterns where `stub` = current no-key behavior).
   - `OPENAI_API_KEY` — unchanged for hosted OpenAI.
   - `INFERENCE_BASE_URL` — optional; when set with `openai_compatible`, use Chat Completions–compatible server.
   - `INFERENCE_API_KEY` — optional secondary key for local gateway auth.
   - `INFERENCE_MODEL` — optional override for model id string per provider.
2. **Implement provider module** — extend or wrap `src/lib/openai.ts` (or add `src/lib/inference/provider.ts`) so callers ask for a **model executor** rather than hard-coding `getOpenAI()`.
3. **SSRF / trust** — local-only or allowlisted hosts for `INFERENCE_BASE_URL` in server contexts.

### Phase 2: MVP call-site migration

4. **Select MVP slice** (pick at least one in tasks, verify in PR):
   - **Candidate A**: `src/lib/threshold-encounter/generator.ts` (`generateText`) — contained, high signal for “simulated world” prose.
   - **Candidate B**: One Python `bars-agents` or FastAPI path the custodian demos — **if** Phase 1 stays TS-only, document Python as Phase 2b with matching env.
5. **Wire** chosen path(s) to provider module; preserve existing error messages for missing `OPENAI_API_KEY` where provider is `openai`.

### Phase 3: Instrumentation

6. **Log structure** — use existing logger if present; else `console` JSON lines behind `DEBUG_INFERENCE=1` or always-on server log with low PII (no full prompts in prod logs unless admin flag).
7. **Doc** — `docs/INFERENCE_PROVIDERS.md`: how to point at vLLM / llama.cpp; example curl; burn estimation worksheet (link to spec FR5).

### Phase 4: Verification + narrative

8. **Run** `npm run check`; add **tiny** unit or integration test if feasible (mock fetch).
9. **Update** BACKLOG / ARCHIVE if scope done; link from residency or Kickstarter prep docs when ready.

## File Impacts (anticipated)

| Action | File / area |
|--------|-------------|
| Create | `.specify/specs/sim-world-dual-inference-mvp/{spec,plan,tasks}.md` |
| Create | `docs/INFERENCE_PROVIDERS.md` (or section in `docs/ENV_AND_VERCEL.md`) |
| Edit | `src/lib/openai.ts` or new `src/lib/inference/*` |
| Edit | `src/lib/threshold-encounter/generator.ts` (if selected) |
| Edit | `.env.example` if present; `docs/ENV_AND_VERCEL.md` |
| Optional | `backend/` settings + one route — if Phase 2b accepted |

## Verification

- [ ] Toggle `INFERENCE_PROVIDER` + base URL locally; confirm one MVP path returns model output from local server (manual okay for MVP).
- [ ] Hosted OpenAI path still works with key-only config.
- [ ] Logs show provider + timing + token fields when API returns usage.
- [ ] `npm run check` passes

## Open Questions

- **Python parity**: Full parity in one PR vs TS-first + documented follow-up — resolve in `tasks.md` with one checked approach.
- **Which single path** is the residency demo’s “AI moment” — confirm with custodian (threshold encounter vs quest generation vs MCP strand).
