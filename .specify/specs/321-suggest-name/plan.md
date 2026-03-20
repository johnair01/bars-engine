# Plan: 321 Suggest Name — Grammar + NPC / Daemon Bridge

## Phase 1–4 (done): Deterministic grammar

- TS + Python grammar; frontend primary path; timeout on legacy API.
- See `tasks.md` checked items.

## Phase 5: Multi-suggest (resonance loop)

- Add `attempt` (uint) to `deriveShadowName` / `derive_shadow_name`; mix into hash (e.g. `hash(combined + '\0' + String(attempt))`).
- `Shadow321Runner`: local state `suggestionAttempt`, increment on each Suggest click; reset attempt when charge or mask text changes (optional UX).
- Port integer parity to `backend/app/shadow_name_grammar.py`.
- Unit tests: same inputs + different attempts → different names (for typical range); same triple → stable.

## Phase 6: Persist name resolution on session

- Prisma: extend `Shadow321Session` with `finalShadowName` (optional `String`), `nameResolution` (`String` enum-like), optionally `suggestionCount`.
- On 321 step completion / transition after “Give it a name”, persist final string + resolution kind.
- Wire `ShadowNameFeedback` (existing) or extend for `attempt` + session link if useful for SNL.

## Phase 7: NPC metadata ingest (matching + merge log)

- Define normalized match key from `phase2Snapshot` / `phase3Snapshot` (reuse existing 321 metadata helpers if present).
- Implement `merge321NameIntoMatchingNpcs` server-side:
  - Find NPCs: `Player.creatorType === 'agent'`, matching nation + archetype (ids from snapshot or name resolution lookup).
  - Write append-only **`Npc321InnerWorkMerge`** (or approved alternate) per NPC affected.
- Optional v1 UI: none; admin or debug route to list merges.
- Document privacy: excerpt length caps; no full charge by default.

## Phase 8: Daemon linkage + graduation (spec-first, implement after Phase 7)

- When `Daemon` created from 321, ensure `name` + session reference carry through; store `innerWorkSummary` JSON on daemon if schema extended.
- **Graduation**: when `Daemon.level >= THRESHOLD` (and gates TBD with design), create or link `Player` NPC (`creatorType: 'agent'`), seed `name` from daemon, copy accumulated merge-style metadata; set `promotedToPlayerId` on daemon.
- Coordinate thresholds with [NPC & Simulated Player Content Ecology](../npc-simulated-player-content-ecology/spec.md) and daemons spec.

## Phase 9: Verification

- `npm run build` / `npm run check`
- `cd backend && make check && make test` (Python grammar tests if added)
- Manual: multi-click suggests differ; complete flow creates merge rows for seeded test NPC with matching nation/archetype

## File impacts ( anticipated )

| Phase | Files |
|-------|--------|
| 5 | `src/lib/shadow-name-grammar.ts`, `backend/app/shadow_name_grammar.py`, `Shadow321Runner.tsx`, tests |
| 6–7 | `prisma/schema.prisma`, migration, server action or `src/app/api/...`, 321 completion handler |
| 8 | `prisma/schema.prisma` (daemon fields), daemon service / completion hooks |
