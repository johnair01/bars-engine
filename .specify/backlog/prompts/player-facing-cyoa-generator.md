# Backlog prompt: Player-facing CYOA generator (PFCG)

> Implement per [.specify/specs/player-facing-cyoa-generator/spec.md](../specs/player-facing-cyoa-generator/spec.md), [.specify/specs/player-facing-cyoa-generator/plan.md](../specs/player-facing-cyoa-generator/plan.md), and [.specify/specs/player-facing-cyoa-generator/tasks.md](../specs/player-facing-cyoa-generator/tasks.md).

**API-first:** Lock Phase 0 artifact + dominion matrix before Prisma/UI. Private draft + validate before unlisted share before campaign queue.

**Dependencies:** [cyoa-modular-charge-authoring](../specs/cyoa-modular-charge-authoring/spec.md), [bar-quest-generation-engine](../specs/bar-quest-generation-engine/spec.md), [dominion-style-bar-decks](../specs/dominion-style-bar-decks/spec.md).

**Optional:** Run bars-agents `strand_run` (research) and append highlights to `STRAND_OUTPUT.md` in the spec folder.

After `BACKLOG.md` edits: `npm run backlog:seed`.
