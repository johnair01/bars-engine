# Phase 5 Audit: Game Map → Gameboard Flow

**Date**: 2026-03
**Spec**: [game-map-gameboard-bridge/spec.md](spec.md)

## Task 1: Audit game map 8 options — ensure each links to explorable nodes

### Current state

- **Game Map** (`/game-map`): Hub with 10+ zones (Campaign, Campaign Lobby, Daily Alchemy, Quest Wallet, etc.)
- **Campaign Lobby** (`/campaign/lobby?ref=bruised-banana`): **8 Portals** — one per hexagram (from `get8PortalsForCampaign`)
- Each portal: hexagram name, flavor, pathHint; "Enter →" links to `/adventure/[id]/play?start=Portal_N&ref=...`
- Portals require `portalAdventureId` on Instance; if null, shows "Campaign not ready — run seed:portal-adventure"

### Gaps

- Portals use `PORTAL_START_NODE_IDS` (`Portal_1`..`Portal_8`) — these must exist in the portal adventure
- If `portalAdventureId` is null, no explorable nodes
- **Action**: Verify portal adventure has nodes `Portal_1`..`Portal_8`; document seed requirement

---

## Task 2: Node exploration → quest generation

### Current state

- Adventure player: when player reaches passage with move choice, `createBarFromMoveChoice` can create BAR/quest
- `generateQuestFromReading(hexagramId)` exists — generates quest from I Ching cast (Dashboard Caster, etc.)
- Portal entry goes to adventure play; adventure passages can have `metadata.moveType` and trigger BAR creation

### Gaps

- No explicit "explore node → generate quest" flow wired from portal entry
- Quest generation from hexagram exists but is separate (Dashboard Caster, I Ching cast)
- **Action**: Wire portal exploration to quest generation — e.g. when player completes a portal path, offer to generate/add quest to campaign deck

---

## Task 3: Add BARS/QuestSeeds to quest — Show Up flow

### Current state

- Gameboard: steward completes Wake Up + Clean Up, then "3. Show Up — Complete" calls `completeGameboardQuest`
- `completeGameboardQuest` → `completeQuest` → `replaceSlotWithDraw`
- No UI to append BARs or quest seeds before completion

### Gaps

- Spec: "Show Up: player can add BARS/QuestSeeds to the quest OR complete it as-is"
- **Action**: Add optional "Add BAR" / "Add quest seed" step in Show Up flow before Complete button; persist linkage (e.g. `QuestBarLink` or `parentId` on BAR)

---

## Task 4: Shared metaphor — align copy

### Current state

- Gameboard: "Campaign Gameboard", "Period N", "Hexagram {id}" per slot
- Campaign Lobby: "8 Portals", "Choose a portal that speaks to you", hexagram names
- Game Map: "8 I Ching portals" (Campaign Lobby description)

### Gaps

- Inconsistent: "Portals" vs "Hexagrams" vs "Slots"
- Move language (Wake Up, Clean Up, Grow Up, Show Up) appears in quest cards, not in portal/gameboard headers
- **Action**: Align terminology — e.g. "8 Hexagram Portals" in lobby, "8 Hexagram Slots" on gameboard; add move-type labels where slots have moveType

---

## Task 5: Campaign deck — generated quests addable

### Current state

- `getCampaignDeckQuestIds`: quests from ThreadQuest (thread has adventure with campaignRef) + CustomBars with campaignRef
- `attachQuestToSlot`, `getPlayerCampaignQuestsForSlot`: player can attach campaign-tagged quests to slots
- Quest creation from gameboard context (`QuestWizard` with `gameboardContext`) sets campaignRef, campaignGoal

### Gaps

- Quests generated from portal exploration need `campaignRef` + `campaignGoal` to be deck-eligible
- **Action**: Ensure `generateQuestFromReading` (or portal-equivalent) sets campaignRef when in campaign context; add to thread with campaignRef for deck inclusion

---

## Summary

| Task | Status | Effort |
|------|--------|--------|
| 1. Audit 8 options | Partial — portals exist; need portal adventure seed | Low |
| 2. Node → quest gen | Not wired from portals | Medium |
| 3. Show Up + BARs | Not implemented | Medium |
| 4. Shared metaphor | Copy exists; needs alignment | Low |
| 5. Campaign deck | Mostly there; ensure generated quests tagged | Low |
