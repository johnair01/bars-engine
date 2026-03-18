# Spec: Game Loop BARS↔Quest↔Thread↔Campaign

## Purpose

Wire the main game loop so players can extend BARS into Quests, Quests into Threads, and Threads into Campaigns—and so campaigns can generate grammatical quests that attract BARs and subquests. The loop is currently broken: quests created from charge capture are orphaned (not in threads or campaigns), and the reverse flow (campaign → quest → BAR) is not fully connected.

**Problem**: Explore after capturing charge creates a quest, but the quest has no path into Thread or Campaign. Players cannot complete the loop BARS → Quest → Thread → Campaign. The reverse (Campaign → Quest → attract BARs) is partially specified but not wired. **There is no dedicated place for personal quests**: The **Hand** (`/hand`, "Quest Wallet") exists and shows Private Drafts (BARs) and links to Daily Hand, Moves Library, Forge Invitation—but it does not surface the flow BAR → quest → subquest on gameboard. Charge captures and quests-from-BARs are not integrated. Extend the Hand, don't create a new page.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Hand as Personal Quest Hub** | Extend the existing **Hand** (`/hand`, "Quest Wallet")—it already has Private Drafts (BARs), CreateBarForm, FaceMovesSection. Add: charge captures, personal quests (from BARs), "Turn BAR into quest" (Explore), "Add as subquest to gameboard". No new page. |
| **Forward flow scope** | Phase 1: BAR → Quest → Thread/Campaign (including subquest to gameboard). Add "Add to thread" and "Add as subquest to gameboard" when quest is created from BAR. |
| **Reverse flow scope** | Phase 2: Campaign → generate quests; quests attract BARs. Defer to follow-on spec. |
| **Quest placement** | Player chooses: add to thread, add as subquest to gameboard slot, or keep in personal hub. No auto-assignment. |
| **Thread vs Campaign** | Thread = sequential quest journey (QuestThread). Campaign gameboard = slots; adding as subquest (`parentId = slotQuestId`) is the primary campaign contribution path. |

## Conceptual Model (Game Language)

| Dimension | Meaning | Schema |
|-----------|---------|--------|
| **WHO** | Player (creator), Campaign (instance) | Player, Instance |
| **WHAT** | Charge BAR, Quest (CustomBar), Thread (QuestThread), Campaign (campaignRef) | CustomBar, QuestThread, ThreadQuest |
| **WHERE** | Allyship domain | allyshipDomain |
| **Energy** | Vibeulons | Vibulon |
| **Personal throughput** | 4 moves (Wake Up, Clean Up, Grow Up, Show Up) | moveType |

**Forward flow**: BAR → turn into quest → Add to thread OR Add as subquest to gameboard slot.

**Personal Quest Hub**: A dedicated place where players (1) see their personal BARs, (2) turn BARs into quests (Explore flow), (3) place quests as subquests on the gameboard or add to threads. Wallet stays for vibeulons and quick links; the hub is the home for the BAR→Quest→Gameboard loop.

**Reverse flow** (Phase 2): Campaign → generate quests → quests attract BARs (response, subquest).

## API Contracts (API-First)

### createQuestFromSuggestion (existing, extend)

**Input**: `barId: string`, `suggestionIndex: number`  
**Output**: `{ success: true; questId: string } | { error: string }`

**Extension**: Add optional `target?: { type: 'thread' | 'campaign'; threadId?: string; campaignRef?: string; slotQuestId?: string }`. When provided, after creating the quest, call `addQuestToThread` or `addQuestToCampaign` and return the placement info.

### addQuestToThread

**Input**: `questId: string`, `threadId: string`, `position?: number`  
**Output**: `{ success: true } | { error: string }`

- Appends quest to thread via ThreadQuest (or inserts at position).
- Player must own or have access to the quest.
- Thread must accept new quests (not orientation-only if we restrict).

### addQuestToCampaign

**Input**: `questId: string`, `campaignRef: string`, `slotQuestId?: string`  
**Output**: `{ success: true } | { error: string }`

- Sets `campaignRef`, `campaignGoal` on quest; optionally attaches as subquest to `slotQuestId` (gameboard slot).
- Player must own the quest.

### getPlacementOptionsForQuest

**Input**: `questId: string`  
**Output**: `{ threads: Array<{ id, title }>; gameboardSlots: Array<{ campaignRef, slotQuestId, slotTitle, campaignTitle }> }`

- Returns threads player has access to and gameboard slots (campaign + slot quest) the player can add the quest to as a subquest.

### addQuestAsSubquestToGameboard

**Input**: `questId: string`, `slotQuestId: string`  
**Output**: `{ success: true } | { error: string }`

- Sets `parentId = slotQuestId` on the quest (makes it a subquest of the slot). Sets `campaignRef` from the slot's campaign. Player must own the quest; slot must be on an active gameboard.

- **Server Action** (`'use server'`): All of the above. Forms, React `useTransition`.

## User Stories

### P1: Hand — place for BARs and personal quests

**As a player**, I want the Hand (Quest Wallet) to show my personal BARs and quests, so I can create a BAR, turn it into a quest, and add that quest as a subquest to the gameboard.

**Acceptance**: The Hand (`/hand`) shows (1) my BARs (charge captures, private drafts), (2) my personal quests (created from BARs, not yet placed), (3) actions: "Turn BAR into quest" (Explore), "Add to thread", "Add as subquest to gameboard". Extend existing Hand page; no new page.

### P2: BAR → Quest → Subquest on gameboard

**As a player**, I want to create a BAR, turn it into a quest, and add that quest as a subquest to a gameboard slot, so I can contribute my personal work to the campaign.

**Acceptance**: From the Hand (or Explore flow): create BAR → Explore → Create quest → "Add as subquest to gameboard" → select campaign + slot → quest becomes subquest of that slot. Quest appears under the slot on the gameboard.

### P3: Add quest from charge to thread

**As a player**, I want to add a quest I created from Explore (charge capture) to a thread I'm in, so the quest becomes part of my sequential journey.

**Acceptance**: After creating a quest from `createQuestFromSuggestion`, I see "Add to thread" with a list of my threads. Selecting one adds the quest to that thread. The quest appears in the thread's quest list.

### P4: Add quest as subquest to gameboard

**As a player**, I want to add a quest I created from a BAR to a campaign gameboard slot as a subquest, so I can contribute to the campaign.

**Acceptance**: After creating a quest (or from the Hand), I see "Add as subquest to gameboard" with campaign slots. Selecting a slot attaches the quest as subquest (`parentId = slotQuestId`). The quest appears under the slot on the gameboard.

### P5: Placement options after quest creation

**As a player**, I want to see where I can add my newly created quest (threads, gameboard slots), so I can choose how to extend the game loop.

**Acceptance**: After `createQuestFromSuggestion` succeeds, the UI shows placement options (threads, gameboard slots). I can add to one, or skip and keep the quest in my Hand.

### P6: Explore flow surfaces quest creation (verify)

**As a player**, I want the Explore flow after capturing charge to clearly offer quest creation, so I can turn my charge into a quest.

**Acceptance**: Charge capture → Explore shows quest suggestions with "Create quest" buttons. Creating a quest succeeds and redirects to Hand (or placement flow). No regression.

## Functional Requirements

### Phase 1: Personal Quest Hub + Forward Flow (BARS → Quest → Thread/Gameboard)

- **FR1**: **Extend Hand** (`/hand`) — Add to the existing Hand page: (a) charge captures (type=charge_capture) in BARs section, (b) personal quests (sourceBarId, no parentId, not in thread), (c) actions per BAR: "Turn into quest" (Explore) for charge captures, (d) actions per quest: "Add to thread", "Add as subquest to gameboard". Hand already has Private Drafts, CreateBarForm, FaceMovesSection; extend, don't replace.
- **FR2**: `addQuestToThread(questId, threadId, position?)` — Server Action. Appends quest to thread. Creates ThreadQuest record. Player must own quest; thread must be joinable.
- **FR3**: `addQuestAsSubquestToGameboard(questId, slotQuestId)` — Server Action. Sets `parentId = slotQuestId` on quest; sets `campaignRef` from slot's campaign. Player must own quest; slot must be on active gameboard.
- **FR4**: `addQuestToCampaign(questId, campaignRef, slotQuestId?)` — Server Action. Sets `campaignRef`, `campaignGoal` on quest. If `slotQuestId` provided, sets `parentId = slotQuestId` (subquest to gameboard slot). Alias or wrapper for FR3 when slot is known.
- **FR5**: `getPlacementOptionsForQuest(questId)` — Server Action. Returns threads and gameboard slots (campaignRef, slotQuestId, slotTitle) the player can add the quest to.
- **FR6**: Extend `createQuestFromSuggestion` to accept optional `target` param. When provided, after creating quest, call `addQuestToThread` or `addQuestAsSubquestToGameboard`.
- **FR7**: ChargeExploreFlow and ChargeCaptureForm: after successful quest creation, show placement options (Add to thread, Add as subquest to gameboard, Done). Wire to `addQuestToThread` and `addQuestAsSubquestToGameboard`.
- **FR8**: Hand and quest detail: for quests with `sourceBarId` and no `parentId`/thread, show "Add to thread" / "Add as subquest to gameboard" actions.

### Phase 2: Reverse Flow (deferred)

- Campaign → generate grammatical quests (gameboard slot generation, `generateGrammaticQuestFromReading`).
- Quests attract BARs (BAR response, subquest attachment). See bar-quest-generation-engine, bar-response-threading-raci.

## Non-Functional Requirements

- No breaking changes to existing charge capture, Explore, or quest creation flows.
- Placement actions are additive; quests can remain in wallet if player skips placement.

## Verification Quest (required for UX features)

- **ID**: `cert-game-loop-placement-v1`
- **Steps**: (1) Create BAR (charge capture), (2) Explore, (3) Create quest from suggestion, (4) Add as subquest to gameboard slot, (5) Verify quest appears under slot. Optional: (6) Add to thread path. Narrative: "Verify the game loop so players can extend their BAR into a quest and add it as a subquest to the gameboard—preparing the party for the Bruised Banana Fundraiser."
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/spec.md)

## Dependencies

- [321 Shadow Process](../321-shadow-process/spec.md) — charge capture, Explore
- [Bruised Banana Quest Map](../bruised-banana-quest-map/spec.md) — campaign structure, Kotter stages
- [BAR → Quest → Campaign Flow](../bar-quest-campaign-flow/spec.md) — campaign tagging, subquest to slot

## References

- **Hand** — `src/app/hand/page.tsx` (Quest Wallet): Private Drafts, CreateBarForm, FaceMovesSection, links to /hand/deck, /hand/moves, /hand/forge-invitation. Dashboard links to /hand when >5 active quests.
- `src/actions/charge-capture.ts` — createQuestFromSuggestion, generateQuestSuggestionsFromCharge
- `src/components/charge-capture/ChargeExploreFlow.tsx`, `ChargeCaptureForm.tsx`
- `src/actions/quest-thread.ts` — getPlayerThreads, startThread, advanceThread
- `src/actions/quest-nesting.ts` — createSubQuest, appendExistingQuest
- `src/app/hand/page.tsx` — existing Hand (Quest Wallet); extend with charge captures, personal quests, placement actions
- Strand output: [STRAND_OUTPUT.md](STRAND_OUTPUT.md)
