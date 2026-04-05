# Tasks: Game Map and Lobby Navigation

## Phase 1: Game Map / Lobby Hub UI

- [x] **T1.1** Create route `/game-map` (or `/lobbies`) with Game Map page
- [x] **T1.2** Implement four lobby cards component (Library, EFA, Dojos, Gameboard)
- [x] **T1.3** Each card: name, move label (Wake Up, Clean Up, Grow Up, Show Up), short description, link
- [x] **T1.4** Library card → /library or /docs
- [x] **T1.5** EFA card → /emotional-first-aid
- [x] **T1.6** Dojos card → /dojos (placeholder: "Coming soon")
- [x] **T1.7** Gameboard card → /campaign/board
- [x] **T1.8** Add Game Map link to dashboard (src/app/page.tsx)
- [x] **T1.9** Mobile-friendly layout

## Phase 2: Library Lobby

- [x] **T2.1** Create /library route
- [x] **T2.2** Library hub: Player Handbook link (/docs) + Public BARs (when available)
- [x] **T2.3** Update Library lobby card to link to /library

## Phase 3: Orientations

- [x] **T3.1** Add orientation copy for each lobby (tooltips or inline text)
- [x] **T3.2** Integrate with dashboard-orientation-flow (post-signup redirect, orientation threads)
- [ ] **T3.3** Optional: First-visit overlay or guided tour of four lobbies

## Phase 4: Adventure Relationship

- [x] **T4.1** Document in spec: Gameboard = primary completion surface
- [x] **T4.2** Document: Adventures = narrative nodes; may route to Gameboard
- [x] **T4.3** Verify quest-completion-context-restriction alignment

## Phase 5: Dojos (Deferred)

- [x] **T5.1** Dojos lobby card links to placeholder or "Coming soon" page
- [ ] **T5.2** Full Dojo UI deferred (quest-library-wave-routing)
