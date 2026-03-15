# Plan: Game Master Face Moves

## Summary

Implement explicit moves for each Game Master face in both codebase and game. Each move produces a BAR (CustomBar). Phase 1 focuses on game moves with BAR output; slight emphasis on game first. Faces do not leave their domains except with Sage counsel. Sage can run as another face (mask) when that lens serves the aim.

## Phase 1: Game Moves — Each Produces a BAR

### 1.1 BAR creation contract

- Every face move creates a CustomBar with `gameMasterFace` set
- BAR types: `vibe` (default for face moves), `insight` (Shaman shadow belief, Sage witness)
- Optional metadata: `questId`, `playerId`, `instanceId`, `moveType` for linking

### 1.2 Shaman moves

**Create ritual** — Moment before quest (e.g. name a belief, light a candle)
- Trigger: Player enters "ritual" step before taking/starting a quest
- Output: BAR (type: vibe) — title: "Ritual: [belief or moment]"; description: player input; gameMasterFace: shaman
- Integration: Add ritual step to gameboard take flow or quest start flow

**Name shadow belief** — Player names/acknowledges shadow belief; Shaman witnesses
- Trigger: 321 flow or Emotional First Aid completion
- Output: BAR (type: insight) — shadow belief text; gameMasterFace: shaman
- Integration: Extend 321/EFA completion to create BAR

### 1.3 Challenger moves

**Issue challenge** — Time-bound quest, bid, or dare
- Trigger: Challenger (or player with Challenger lens) issues a challenge
- Output: BAR (type: vibe) — challenge text, expiry; optionally links to quest
- Integration: Challenge UI; create BAR + optional quest with challenge metadata

**Propose move** — Recommend one of 15 canonical moves
- Trigger: Player asks for move recommendation (or Challenger agent)
- Output: BAR (type: vibe) — recommended move, energy assessment; gameMasterFace: challenger
- Integration: Extend Challenger agent output to create BAR; or player-facing "Get move" action

### 1.4 Regent moves

**Declare period** — "We are in Coalition"
- Trigger: Admin advances Kotter stage; or Regent agent assesses readiness
- Output: BAR (type: vibe) — period declaration; gameMasterFace: regent; links to instanceId
- Integration: On stage advance, create BAR; display in campaign/event

**Grant role** — Steward, quest-owner, campaign contributor
- Trigger: Player takes gameboard slot (steward); or admin assigns
- Output: BAR (type: vibe) — role granted, to whom, for what; gameMasterFace: regent
- Integration: On takeSlotQuest, create BAR; or explicit "Grant role" action

### 1.5 Architect moves

**Offer blueprint** — Quest template players can fork
- Trigger: Architect offers blueprint; or player browses blueprint library
- Output: BAR (type: vibe) — blueprint description; players fork as quest
- Integration: Blueprint library or "Offer blueprint" from Architect-aligned quest; create BAR + forkable quest template

**Design layout** — Gameboard layout, slot order (inform design)
- Lower priority; BAR captures design suggestion for admin/dev
- Output: BAR (type: vibe) — layout suggestion; gameMasterFace: architect

### 1.6 Diplomat moves

**Offer connection** — "Consider reaching out to X"
- Trigger: Diplomat suggests connection; or system matches players by domain
- Output: BAR (type: vibe) — connection suggestion, target player/campaign; gameMasterFace: diplomat
- Integration: "Offer connection" action; create BAR; notify or display to player

**Host event** — Community event, shared reflection
- Trigger: Diplomat or admin creates event
- Output: BAR (type: vibe) — event invitation; gameMasterFace: diplomat
- Integration: Event creation flow creates BAR; or link to existing Event model

### 1.7 Sage moves

**Witness** — Hold paradox; witness completion; meta-perspective
- Trigger: Quest completion; or player requests witness
- Output: BAR (type: vibe/insight) — witness note; gameMasterFace: sage
- Integration: On completion, optional "Request witness" → create BAR; or Sage agent produces BAR

**Cast hexagram** — I Ching reading for player decision
- Trigger: Player requests reading; or before major decision
- Output: BAR (type: vibe) — hexagram, interpretation; gameMasterFace: sage
- Integration: Extend CastingRitual / I Ching flow to create BAR on completion

## Phase 2: Codebase Moves

- Shaman: Run 321 script; Map emotional channel
- Challenger: Flag blocked; Suggest unblock
- Regent: Advance stage (exists); Court view
- Architect: Steward backlog (extend sage:brief)
- Diplomat: Match player; Create invitation
- Sage: Run as face (mask implementation)

## Phase 3: Domain Constraint

- Route out-of-domain actions to Sage
- Sage counsel or mask before cross-domain act

## Dependencies

- CustomBar schema (gameMasterFace exists)
- createCustomBar or equivalent for BAR creation
- 321 flow, Emotional First Aid, gameboard, CastingRitual (existing)

## Out of Scope (Phase 1)

- Sage mask (Phase 2)
- Full codebase moves (Phase 2)
- Domain constraint enforcement (Phase 3)
