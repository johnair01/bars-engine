# Tasks: Game Master Face Moves

## Phase 1: Game Moves — Each Produces a BAR

### 1.1 BAR creation contract

- [x] Define `createFaceMoveBar(face, moveType, input)` — creates CustomBar with gameMasterFace, type vibe/insight
- [x] Ensure CustomBar.gameMasterFace is set on all face-move BARs
- [x] Add metadata fields (questId, playerId, instanceId) to BAR for linking

### 1.2 Shaman

- [x] `createRitual(belief, questId?)` — BAR (type: vibe), title: "Ritual: {belief}"
  - Wired: `takeSlotQuest(slotId, ritualText?)` in `src/actions/gameboard.ts`
- [x] `nameShadowBelief(belief, questId?)` — BAR (type: insight), title: "Shadow belief: {belief}"
  - Wired: `useEffect` on `phase === 'artifact'` in `src/app/shadow/321/Shadow321Runner.tsx`

### 1.3 Challenger

- [x] `issueChallenge(title, description, questId?)` — BAR (type: vibe) + optional quest link
  - Wired: "Issue challenge" form in `src/components/hand/FaceMovesSection.tsx`
- [x] `proposeMove(moveId?, energyNote?)` — BAR (type: vibe) with canonical move name + energy delta
  - Wired: "Get move" button in `src/components/hand/FaceMovesSection.tsx`

### 1.4 Regent

- [x] `declarePeriod(period, instanceId?, creatorId?)` — BAR (type: vibe), "We are in {period}"
  - Wired: Kotter stage advance in `src/actions/instance.ts` via `createFaceMoveBarAs`
- [x] `grantRole(targetPlayerName, role, questId?, instanceId?, creatorId?)` — BAR (type: vibe)
  - Wired: `takeSlotQuest` in `src/actions/gameboard.ts` (steward role)

### 1.5 Architect

- [x] `offerBlueprint(title, description, questId?)` — BAR (type: vibe), forkable template
  - Wired: "Offer blueprint" form in `src/components/hand/FaceMovesSection.tsx`
- [x] `designLayout(suggestion, instanceId?)` — BAR (type: vibe), "Blueprint: {suggestion}"
  - Wired: "Design layout" form in `src/components/hand/FaceMovesSection.tsx`

### 1.6 Diplomat

- [x] `offerConnection(suggestedPlayerName, message)` — BAR (type: vibe), "Consider reaching out to X"
  - Wired: "Offer connection" form in `src/components/hand/FaceMovesSection.tsx`
- [x] `hostEvent(title, description)` — BAR (type: vibe)
  - Wired: "Host event" form in `src/components/hand/FaceMovesSection.tsx`

### 1.7 Sage

- [x] `witness(note, questId?)` — BAR (type: insight), "Witnessed: {note}"
  - Wired: "Witness" form in `src/components/hand/FaceMovesSection.tsx`
- [x] `castHexagram(hexagramId, interpretation, transformedHexagramId?)` — BAR (type: vibe)
  - Wired: `acceptReading()` in `src/actions/cast-iching.ts`

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

- [x] npm run check (0 new errors — 2 pre-existing in verify-avatar-lockstep.ts)
- [ ] npm run build
- [ ] Manual: Execute each Phase 1 move; verify BAR created with correct gameMasterFace
