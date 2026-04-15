# Plan: Game Map and Lobby Navigation

## Overview

Implement the Game Map / Lobby Hub as the primary entry to the game. Four lobbies (Library, EFA, Schools/Dojos, Gameboard) map to the 4 moves. Orientations help players discover and use each lobby. Adventures flow through the gameboard as the completion surface.

## Phases

### Phase 1: Game Map / Lobby Hub UI

- [ ] Route: `/game-map` or `/lobbies`
- [ ] Four lobby cards: Library, EFA, Schools/Dojos, Gameboard
- [ ] Each card: name, move label, short description, link
- [ ] Links: Library → /library or /docs; EFA → /emotional-first-aid; Dojos → placeholder; Gameboard → /campaign/board
- [ ] Dashboard links to Game Map (or integrates Game Map as primary nav)

### Phase 2: Library Lobby

- [ ] Implement /library as hub: Player Handbook + Public BARs
- [ ] Library = Wake Up lobby
- [ ] Depends on onboarding-bars-library-fix (Public BARs)

### Phase 3: Orientations

- [ ] Orientation content: explain each lobby and its move
- [ ] Integrate with dashboard-orientation-flow
- [ ] Optional: First-visit overlay or guided tour

### Phase 4: Adventure Relationship (Documentation + Clarification)

- [x] Document: Gameboard = primary completion surface
- [x] Document: Adventures = narrative/story nodes; may route to Gameboard
- [x] Ensure quest-completion-context-restriction alignment

### Phase 5: Dojos (Deferred)

- [ ] Schools/Dojos lobby links to placeholder or "Coming soon"
- [ ] Full Dojo UI deferred per quest-library-wave-routing

## Dependencies

- [Onboarding BARs + Library](.specify/specs/onboarding-bars-library-fix/spec.md) — Library with Public BARs
- [Quest Library Wave Routing](.specify/specs/quest-library-wave-routing/spec.md) — Dojo pool concept
- [Dashboard Orientation Flow](.specify/specs/dashboard-orientation-flow/plan.md) — Post-signup redirect, orientation threads
- [Campaign Map Phase 1](.specify/specs/campaign-map-phase-1/spec.md) — Campaign Map layers
