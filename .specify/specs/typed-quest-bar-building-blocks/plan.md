# Plan: Typed Quest (BAR) — Building Blocks & Quality

## Authority

Implement per **this spec kit** (`spec.md`, `tasks.md`). Research: [RESEARCH.md](./RESEARCH.md).

## Phase 0 — Decision records (ADR)

1. **Storage shape:** Normalized tables (`QuestEdge`, `QuestRevision`) vs. `CustomBar` JSON columns + validation — choose one with migration path from current `parentId` / `isKeyUnblocker`.
2. **Edge taxonomy:** Minimum set — e.g. `unblocks`, `requires`, `fork_of`, `merged_into`, `subtask_of` — map to existing Tetris key behavior.
3. **Quality:** Which attributes are **required** for campaign placement vs. hand-only.

## Phase 1 — Schema & invariants

- Prisma models + migrations (if any).
- Server-side `assertCanPlace(child, parent, actor)` and `onQuestComplete` edge updates.
- Unit tests for graph rules (no cycles where forbidden, unblock consistency).

## Phase 2 — API & actions

- Replace or wrap ad-hoc `parentId` updates in `quest-placement.ts` / `gameboard.ts` with typed placement API.
- Events for fork/merge (audit log).

## Phase 3 — UI

- Hand / vault: “Unblock” flow with **eligible parents** only.
- Steward: merge / reject UI (minimum for campaign quests).

## Phase 4 — Polish

- Templates + exemplar linking.
- Duplicate / near-duplicate detection (optional heuristic).

## File impacts (expected)

- `prisma/schema.prisma` — new models or fields
- `src/actions/quest-*.ts`, `quest-engine.ts`, `gameboard.ts`
- `src/lib/quest/` (new) — types, validators, graph helpers

## Risks

- Migration complexity for existing `CustomBar` rows.
- Performance of dependency queries at scale — index `parentId`, edge tables early.
