# Spec: Phase 1 Face Moves Remainder (Challenger, Architect, Diplomat)

## Purpose

Implement the remaining Phase 1 Game Master Face Moves: Challenger (issue challenge, propose move), Architect (offer blueprint), and Diplomat (offer connection, host event). Each move produces a CustomBar with `gameMasterFace` set. Shaman, Regent, and Sage moves are already implemented.

**Parent**: [game-master-face-moves/spec.md](../game-master-face-moves/spec.md)

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Integration style | Server actions call `createFaceMoveBar`; wire to existing flows or minimal UI |
| Architect blueprint | Trigger on `forkQuestPrivately` — original quest is blueprint; fork is player copy |
| Challenger propose move | Deterministic: pick from `ALL_CANONICAL_MOVES`; no Challenger agent call for Phase 1 |
| Diplomat offer connection | MVP: self-directed "Consider reaching out to X"; full target-player routing in Phase 2 |

## API Contracts (API-First)

### issueChallenge

**Input**: `{ title: string; description: string; questId?: string }`  
**Output**: `{ success: true; barId: string } | { error: string }`

```ts
function issueChallenge(input: { title: string; description: string; questId?: string }): Promise<FaceMoveBarResult | FaceMoveBarError>
```

- Server Action; creates Challenger `issue_challenge` BAR.

### proposeMove

**Input**: `{ moveId?: string; energyNote?: string }`  
**Output**: `{ success: true; barId: string } | { error: string }`

```ts
function proposeMove(input: { moveId?: string; energyNote?: string }): Promise<FaceMoveBarResult | FaceMoveBarError>
```

- Server Action; if `moveId` omitted, pick random from `ALL_CANONICAL_MOVES`. Creates Challenger `propose_move` BAR.

### offerConnection

**Input**: `{ suggestedPlayerName: string; message: string }`  
**Output**: `{ success: true; barId: string } | { error: string }`

```ts
function offerConnection(input: { suggestedPlayerName: string; message: string }): Promise<FaceMoveBarResult | FaceMoveBarError>
```

- Server Action; creates Diplomat `offer_connection` BAR for current player (self-directed).

### hostEvent

**Input**: `{ title: string; description: string }`  
**Output**: `{ success: true; barId: string } | { error: string }`

```ts
function hostEvent(input: { title: string; description: string }): Promise<FaceMoveBarResult | FaceMoveBarError>
```

- Server Action; creates Diplomat `host_event` BAR.

### forkQuestPrivately (extend existing)

- **Change**: After creating fork, call `createFaceMoveBar('architect', 'offer_blueprint', ...)` with original quest as blueprint. No new action; extend [src/actions/gameboard.ts](../../src/actions/gameboard.ts).

## User Stories

### P1: Challenger Issue Challenge

**As a player**, I want to issue a challenge (time-bound dare or bid), so others can respond and I have a BAR record.

**Acceptance**: Form on hand page; submit creates CustomBar with `gameMasterFace: 'challenger'`, `completionEffects.faceMove.moveType: 'issue_challenge'`.

### P2: Challenger Propose Move

**As a player**, I want a move recommendation from the Challenger, so I can validate energy before action.

**Acceptance**: "Get move" button creates BAR with recommended canonical move (name, energy delta, narrative); `gameMasterFace: 'challenger'`.

### P3: Architect Offer Blueprint

**As a player**, when I fork a quest from the gameboard, I want the Architect to record the blueprint offering, so the fork lineage is legible.

**Acceptance**: `forkQuestPrivately` creates Architect `offer_blueprint` BAR; metadata includes `questId` (original) and `forkedQuestId`.

### P4: Diplomat Offer Connection

**As a player**, I want to record a connection suggestion ("consider reaching out to X"), so I can act on it later.

**Acceptance**: Form creates Diplomat `offer_connection` BAR; `gameMasterFace: 'diplomat'`.

### P5: Diplomat Host Event

**As a player**, I want to host an event (community reflection), so others see the invitation.

**Acceptance**: Form creates Diplomat `host_event` BAR; `gameMasterFace: 'diplomat'`.

## Functional Requirements

### Phase 1

- **FR1**: `issueChallenge` action creates CustomBar with `gameMasterFace: 'challenger'`, `completionEffects.faceMove.moveType: 'issue_challenge'`.
- **FR2**: `proposeMove` action creates CustomBar; uses `ALL_CANONICAL_MOVES` from [src/lib/quest-grammar/move-engine.ts](../../src/lib/quest-grammar/move-engine.ts); random pick when `moveId` omitted.
- **FR3**: `forkQuestPrivately` creates Architect `offer_blueprint` BAR after fork creation.
- **FR4**: `offerConnection` action creates CustomBar with `gameMasterFace: 'diplomat'`, `moveType: 'offer_connection'`.
- **FR5**: `hostEvent` action creates CustomBar with `gameMasterFace: 'diplomat'`, `moveType: 'host_event'`.
- **FR6**: Hand page includes collapsible "Face Moves" section with forms for: Issue challenge, Get move, Offer connection, Host event.

## Dependencies

- [game-master-face-moves](../game-master-face-moves/spec.md) — parent spec; `createFaceMoveBar` exists
- [src/actions/face-move-bar.ts](../../src/actions/face-move-bar.ts)
- [src/lib/face-move-bar.ts](../../src/lib/face-move-bar.ts)
- [src/lib/quest-grammar/move-engine.ts](../../src/lib/quest-grammar/move-engine.ts)

## References

- [game-master-face-moves/plan.md](../game-master-face-moves/plan.md)
- [game-master-face-moves/tasks.md](../game-master-face-moves/tasks.md)
- [src/app/hand/page.tsx](../../src/app/hand/page.tsx)
- [src/actions/gameboard.ts](../../src/actions/gameboard.ts) — forkQuestPrivately
