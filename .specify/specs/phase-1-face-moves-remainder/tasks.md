# Tasks: Phase 1 Face Moves Remainder

## Phase 1: Server Actions

- [x] Add `issueChallenge(input)` to src/actions/face-move-bar.ts — calls createFaceMoveBar('challenger', 'issue_challenge', ...)
- [x] Add `proposeMove(input)` to src/actions/face-move-bar.ts — imports ALL_CANONICAL_MOVES; random pick when moveId omitted; calls createFaceMoveBar('challenger', 'propose_move', ...)
- [x] Add `offerConnection(input)` to src/actions/face-move-bar.ts — calls createFaceMoveBar('diplomat', 'offer_connection', ...)
- [x] Add `hostEvent(input)` to src/actions/face-move-bar.ts — calls createFaceMoveBar('diplomat', 'host_event', ...)
- [x] Extend forkQuestPrivately in src/actions/gameboard.ts — after fork creation, call createFaceMoveBar('architect', 'offer_blueprint', { title, description, questId: original.id, metadata: { forkedQuestId: fork.id } })

## Phase 2: Hand Page UI

- [x] Add collapsible "Face Moves" section to src/app/hand/page.tsx
- [x] Add Issue challenge form (title, description, optional questId) → issueChallenge
- [x] Add "Get move" button → proposeMove({})
- [x] Add Offer connection form (suggestedPlayerName, message) → offerConnection
- [x] Add Host event form (title, description) → hostEvent

## Verification

- [ ] npm run build
- [ ] npm run check
- [ ] Manual: Execute each move; verify BAR created with correct gameMasterFace
- [ ] Manual: Fork quest from gameboard; verify Architect offer_blueprint BAR created
