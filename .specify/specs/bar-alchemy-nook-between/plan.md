# Plan: BAR, Emotional Alchemy, Nook, and Between Integration

## Approach

Build one private, reversible provenance loop before building any matchmaking or collective crafting. Reuse the existing BAR EA fields and 3-2-1 handoff rather than making a competing Emotional Alchemy system. Treat the Thought String workbench as the BAR's private pattern grammar: it maps charged regions, positive regions, and player-selected bridges between them. Put elemental spirits into this first loop as embodied companion and progression vessels: an EA reading can invite a matching owned spirit from the Nook; completed Thought String practice yields optional elemental embers and pattern ingredients; fed embers grow spirits toward ally state and unlock player-chosen recipes. Daemon families supply each spirit's editorial jobs and style; 3-2-1 plus Thought String evidence lets the player identify that family before an eligible animal form is randomly drawn. Treat the Between as a strict consent boundary that receives only a newly authored distilled offer or agreed crafted upgrade.

## Files touched

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add private BAR-practice / constellation provenance and sealed-offer records after contract review. |
| `src/app/.../bar` | BAR detail actions and return summary. Exact route identified during Phase 1. |
| `src/app/shadow/321/Shadow321Runner.tsx` | Preserve BAR return context; do not duplicate EA logic. |
| `src/app/dojo/triangle-workshop/*` | Create/open a BAR-scoped constellation and return a selected outcome. |
| `public/between/garden.js` and Between API | Add sealed offer preview/accept/decline interaction only after the private loop works. |
| `content/ontology-game/cave/spirit-store.js` / Nook + Between spirit surfaces | Elemental companion bond, ember inventory/feed action, daemon-family lineage, animal draw, level/ally state, and unlocked crafting capacity. |
| `.specify/specs/bar-alchemy-nook-between/*` | Keep contract, migration decisions, and verification current. |

## Order

1. Run the visibility storyboard falsification test from `spec.md`.
2. Define `BarPracticeLink` and `DistilledOffer` persistence contracts; review the existing `CustomBar`, `BetweenPrivate`, and `BetweenItem` ownership semantics.
3. Build the Nook entry chooser and prove a no-BAR/no-spirit player can make, settle, or discard a private seed.
4. Build the BAR → existing EA → same BAR return route and verify no raw text is copied.
5. Build the BAR → private dojo constellation → one outcome return route, including a deliberately selected charged-to-positive bridge ingredient.
6. Add the Nook spirit companion and elemental ember loop; verify its inputs are player-authored and private, and that a player may hold an ember without a spirit.
7. Define the daemon-family roster, its Thought String editing jobs/styles, first animal pools, and 3-2-1/evolution-choice evidence screen.
8. Define the first spirit level curve, ally-state threshold, and three previewable recipes: one BAR upgrade, one Nook upgrade, and one sealed Between upgrade.
9. Persist player-authorized craft ingredients and show explainable compatibility among that player’s own BARs.
10. Add sealed Between offers with accept/decline/withdraw and visibility tests.
11. Only then evaluate anonymous templates or cross-player affinity.

## What Wendell does, and when

1. After Phase 1, Wendell runs a real BAR through EA and the dojo, then checks whether the returned outcome feels like it changed the BAR rather than merely documenting a reflection.
2. Before the lineage pass, Wendell confirms the first daemon families, their editing jobs/styles, and which animal forms are eligible for each.
3. Before Phase 1’s spirit pass, Wendell decides the first spirit level curve, ally-state threshold, and the first three recipes it unlocks.
4. Before Phase 3, Wendell decides the initial allowed shared offer forms and whether a care ember has any written dedication visible to the other person.
5. After Phase 3, Wendell tests an offer with another human and decides whether the Between feels protected from private-work spillover.
