# Spec: Game Loop — Charge → Quest → Campaign

## Purpose

Fix the capture charge flow so players can complete the loop: **321 → metabolize charge → quest generation → add quest to campaign**. The flow currently breaks when players do a 321 and try to make a quest—they cannot move their charge into aligned action toward campaign needs. The dashboard should show "Campaigns I'm responsible for" and "next effective milestone" per campaign.

**Practice**: Deftness Development — spec kit first, API-first, evolve without breaking existing flows.

**Source**: [STRAND_CONSULT.md](./STRAND_CONSULT.md) — Game Master consultation (Architect, Regent, Challenger, Diplomat, Shaman, Sage).

## Problem Statement

- **321 → quest flow breaks**: Players metabolize charge but cannot complete the path to quest creation and campaign placement.
- **Quests orphaned**: `createQuestFrom321Metadata` creates a quest but it has no path into Thread or Campaign.
- **Dashboard gap**: No overview of "campaigns I'm responsible for" or "next effective milestone" per campaign.
- **Overwhelm**: User's charge was "overwhelmed by options"—the flow should reduce choice paralysis with clarity, not add more options.

## Design Decisions (from GM analysis)

| Topic | Decision |
|-------|----------|
| **321→quest flow** | Dedicated quest-from-charge flow. After create, show placement options (Add to thread, Add as subquest to gameboard). |
| **Placement timing** | Placement happens after quest creation—from Hand, quest detail, or post-create modal. Player chooses when. |
| **Hand as hub** | Extend Hand with personal quests (from 321/BARs), placement actions. Welcoming interface for post-321 players. |
| **Dashboard overview** | Add "Campaigns I'm responsible for" (campaigns where player is leader/owner). "Next effective milestone" = key quest or Kotter stage. Start minimal—progress bar for key campaign quests. |
| **Overwhelm** | Guided choice; milestone orientation; 2–3 prioritized options. Shaman: "What is the next smallest honest action?" |
| **Quick win** | Fix 321→quest conversion first; placement can follow. Unblock users before full campaign integration. |

## User Stories

### P1: 321 → Quest succeeds and offers placement

**As a player**, when I complete a 321 and choose "Turn into Quest", I want the quest to be created and see options to add it to a thread or campaign, so I can move my charge toward aligned action.

**Acceptance**: `handleTurnIntoQuest` in Shadow321Form succeeds; redirect to Hand or show placement modal. "Add to thread" / "Add as subquest to gameboard" visible for the new quest.

### P2: Place quest from 321 into campaign

**As a player**, I want to add a quest I created from 321 as a subquest to a campaign gameboard slot, so I can contribute my metabolized charge to the campaign.

**Acceptance**: From Hand or quest detail, "Add as subquest to gameboard" shows campaign slots. Selecting one attaches the quest. Quest appears under the slot.

### P3: Place quest from 321 into thread

**As a player**, I want to add a quest I created from 321 to a thread I'm in, so it becomes part of my sequential journey.

**Acceptance**: "Add to thread" shows my threads. Selecting one adds the quest. Quest appears in the thread.

### P4: Dashboard shows campaigns I'm responsible for

**As a player** who leads or owns campaigns, I want the dashboard to show "Campaigns I'm responsible for" with the next effective milestone for each, so I can focus on what matters without overwhelm.

**Acceptance**: Dashboard section lists campaigns where player is leader/owner. Each shows next milestone (key quest or Kotter stage). Minimal—progress bar or single next action. Start simple.

### P5: Reduce overwhelm in placement flow

**As a player** who just completed 321, I want the placement flow to offer 2–3 prioritized options (not everything), so I'm not paralyzed by choice.

**Acceptance**: Placement UI limits options; suggests threads/campaigns aligned with player's recent activity. Diplomat: collaborative framing ("joining forces"), not obligation.

## Functional Requirements

### Phase 1: Diagnose and fix 321→quest

- **FR1**: **Diagnose** — Add logging to `createQuestFrom321Metadata`; verify Shadow321Form "Turn into Quest" path. Identify any failure (nation/archetype gate, extractCreationIntent, DB error).
- **FR2**: **Fix 321→quest** — Ensure `handleTurnIntoQuest` succeeds and redirects to Hand with `?quest=<id>` or shows placement modal. No regression to Create BAR path.
- **FR3**: **Post-create placement** — After `createQuestFrom321Metadata` succeeds, show placement options (Add to thread, Add as subquest to gameboard, Done). Reuse or add placement UI.

### Phase 2: Placement API and Hand integration

- **FR4**: `addQuestToThread(questId, threadId, position?)` — Server Action. Appends quest to thread. Player must own quest.
- **FR5**: `addQuestAsSubquestToGameboard(questId, slotQuestId)` — Server Action. Sets `parentId = slotQuestId`, `campaignRef` from slot. Player must own quest.
- **FR6**: `getPlacementOptionsForQuest(questId)` — Returns threads and gameboard slots the player can add the quest to. Limit to 2–3 suggested options when possible.
- **FR7**: Extend Hand — Show personal quests (from 321/BARs, unplaced). "Add to thread" / "Add as subquest to gameboard" for orphan quests.
- **FR8**: Extend `createQuestFrom321Metadata` — Optional `target?: { type, threadId?, slotQuestId? }`. When provided, after create, call placement API.

### Phase 3: Dashboard campaign overview

- **FR9**: **Campaigns I'm responsible for** — Query campaigns where player is leader/owner (instance membership, role). Display on dashboard.
- **FR10**: **Next effective milestone** — Per campaign: key quest to complete, or Kotter stage. Minimal data shape. Start with progress bar for key campaign quests.
- **FR11**: **Reduce overwhelm** — Limit dashboard campaign list; prioritize 2–3. Milestone orientation: "What is the next smallest honest action?"

## Non-Functional Requirements

- No breaking changes to existing 321, Create BAR, or charge capture flows.
- Placement is additive; quests can remain in Hand if player skips.
- Evolve deftly—feature flag or gradual rollout if needed.

## Dependencies

- [Game Loop BARS↔Quest↔Thread↔Campaign](../game-loop-bars-quest-thread-campaign/spec.md) — placement API, Hand extension
- Shadow321Form, createQuestFrom321Metadata, charge-metabolism
- Instance, QuestThread, ThreadQuest, GameboardSlot schema

## References

- **Game Master analysis**: [STRAND_CONSULT.md](./STRAND_CONSULT.md)
- **Hand**: `src/app/hand/page.tsx`
- **321 flow**: `src/components/shadow/Shadow321Form.tsx`, `src/actions/charge-metabolism.ts`
- **Quest placement**: `src/actions/quest-thread.ts`, `src/actions/quest-nesting.ts`
