# Strand: Game Loop BARS↔Quest↔Thread↔Campaign

**Strand ID**: `wzeucv2iqtxbjaa83v987q4m`  
**Output BAR**: `ycpylvonjbxx6svs8hh7wc80`  
**Subject**: Main game loop broken — Explore after capturing charge does not give players ability to create a quest. Players cannot extend BARS into Quests, Quests into Threads, Threads into Campaigns. Reverse flow also broken: campaigns should generate grammatical quests that attract BARS and subquests.

---

## Architect (diagnostic spec)

**Title**: BARS↔Quest↔Thread↔Campaign Flow Diagnostic

**Description**:
Investigate the disruptions in the main game loop affecting the creation and extension abilities of players from BARS to Campaigns. Analyze both the forward process of extending BARS into Quests, Threads, and Campaigns as well as the reverse flow from Campaigns generating quests that lead to BARS and subquests. This quest aims to identify the root cause and realign the game loop.

---

## Problem (from user)

1. **Explore after capturing charge** — does not give people the ability to create a quest
2. **Forward flow broken**: BARS → Quests → Threads → Campaigns
3. **Reverse flow broken**: Campaigns → grammatical quests → attract BARS and subquests

---

## Current state (from codebase exploration)

- **Charge capture → Explore** *does* have quest creation: `ChargeExploreFlow` and `ChargeCaptureForm` both show "Create quest" from `createQuestFromSuggestion`. The created quest has `sourceBarId` and goes to wallet.
- **Gap**: Quest from charge is standalone — not added to a Thread or Campaign. No path from Quest → Thread → Campaign.
- **Reverse**: Campaign gameboard slots, quest generation from campaign context, and "attract BARs" flows are partially specified but not fully wired.

---

## Next steps (updated in spec)

1. **Extend Hand** (`/hand`) — Existing "Quest Wallet" page. Add charge captures, personal quests, "Turn BAR into quest" (Explore), "Add as subquest to gameboard"
2. Add "Add to thread" / "Add as subquest to gameboard" flow when quest is created from BAR
3. `addQuestAsSubquestToGameboard(questId, slotQuestId)` — attach quest as subquest to gameboard slot
4. Wire campaign → generate grammatical quests (Phase 2)
5. Wire quests to attract BARs (Phase 2)
