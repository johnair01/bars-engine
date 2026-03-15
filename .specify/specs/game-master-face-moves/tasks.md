# Tasks: Game Master Face Moves

## Phase 1: Game Moves — Each Produces a BAR

### 1.1 BAR creation contract

- [ ] Define `createFaceMoveBar(face, moveType, input)` — creates CustomBar with gameMasterFace, type vibe/insight
- [ ] Ensure CustomBar.gameMasterFace is set on all face-move BARs
- [ ] Add metadata fields (questId, playerId, instanceId) to BAR for linking

### 1.2 Shaman

- [ ] Create ritual: Add ritual step before quest take/start; create BAR on submit
- [ ] Name shadow belief: Extend 321/EFA completion to create BAR (type: insight)

### 1.3 Challenger

- [ ] Issue challenge: Challenge UI; create BAR + optional quest with challenge metadata
- [ ] Propose move: Extend Challenger agent or add "Get move" action; create BAR on output
- **Implementation spec**: [phase-1-face-moves-remainder](../phase-1-face-moves-remainder/tasks.md)

### 1.4 Regent

- [ ] Declare period: On Kotter stage advance, create BAR (period declaration)
- [ ] Grant role: On takeSlotQuest (steward), create BAR; or explicit Grant role action

### 1.5 Architect

- [ ] Offer blueprint: Blueprint library or Architect-aligned flow; create BAR + forkable template
- [ ] Design layout: (Lower priority) BAR for layout suggestion
- **Implementation spec**: [phase-1-face-moves-remainder](../phase-1-face-moves-remainder/tasks.md)

### 1.6 Diplomat

- [ ] Offer connection: "Offer connection" action; create BAR; display to player
- [ ] Host event: Event creation creates BAR; or link to Event model
- **Implementation spec**: [phase-1-face-moves-remainder](../phase-1-face-moves-remainder/tasks.md)

### 1.7 Sage

- [ ] Witness: On completion, optional "Request witness" → create BAR; or Sage agent produces BAR
- [ ] Cast hexagram: Extend CastingRitual / I Ching flow to create BAR on completion

## Phase 2: Codebase Moves

- [ ] Shaman: Run 321 script; Map emotional channel
- [ ] Challenger: Flag blocked; Suggest unblock
- [ ] Regent: Court view
- [ ] Architect: Steward backlog (extend sage:brief)
- [ ] Diplomat: Match player; Create invitation
- [ ] Sage: Run as face (mask implementation)

## Phase 3: Domain Constraint

- [ ] Route out-of-domain actions to Sage
- [ ] Sage counsel or mask before cross-domain act

## Verification

- [ ] npm run build
- [ ] npm run check
- [ ] Manual: Execute each Phase 1 move; verify BAR created with correct gameMasterFace
