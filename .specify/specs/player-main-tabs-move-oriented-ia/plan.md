# Plan: Player Main Tabs — Move-Oriented IA

## Summary

Phase 0 is **analysis-only**: six-face review of Now, Vault, and Play against the game loop, captured in `SIX_FACE_ANALYSIS.md`. Phases 1+ implement move-first IA and sub-affordances per tab, reusing Vault nested-room work where applicable.

## Phase 0 — Analysis (blocking)

1. Inventory live routes and major components for:
   - **Now:** `/` (dashboard and related entry)
   - **Vault:** `/hand`, `/bars`, `/wallet`, `/daemons`, `/capture` (NavBar “Vault” active region)
   - **Play:** `/adventures` and in-play adventure routes
2. Draft six-face sections per tab (see `spec.md` table).
3. Synthesize gap → move → priority table; agree P0 scope.
4. Optional: one design pass sketch (wireframe) for **one** tab to validate the four-move shell.

## Phase 1 — Shell (low risk)

1. Introduce shared **MoveRail** or **MoveQuadrant** layout component (props: current move, children per quadrant/tab).
2. Apply to **one** tab first (recommend **Now** — smallest blast radius) behind feature flag or incremental rollout.

## Phase 2 — Vault alignment

1. Map [vault-page-experience](../vault-page-experience/spec.md) nested rooms to move-based IA; avoid duplicate competing nav metaphors.
2. Ensure `/hand/moves` or equivalent educational content links consistently from each move region.

## Phase 3 — Play alignment

1. `/adventures` listing and adventure chrome: filter or section by move; surface “next action” in Show Up.
2. Coordinate with [game-map-gameboard-bridge](../game-map-gameboard-bridge/spec.md) if map and tab IA share the four-slot metaphor.

## Files (expected)

| File | Purpose |
|------|---------|
| `SIX_FACE_ANALYSIS.md` | Deliverable from Phase 0 |
| `src/components/...` | Shared move shell components (Phase 1+) |
| `src/app/page.tsx`, `src/app/hand/...`, `src/app/adventures/...` | Tab-specific integration |

## Risks

- **Navigation overload:** four moves × three tabs can feel like 12 contexts — mitigate with **one primary move emphasis** per tab (e.g. Vault emphasizes Clean Up + Show Up for drafts/quests).
- **Terminology drift:** keep move labels consistent with `/hand/moves` and registry language.
