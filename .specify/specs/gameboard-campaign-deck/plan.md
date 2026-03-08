# Plan: Gameboard and Campaign Deck

## Summary

Implement the gameboard as the campaign quest completion surface. Each period, 8 quests are drawn from the campaign deck onto the gameboard. Completion replaces slots with new draws. Players spend vibeulons to convert cards to subquests or add custom subquests. Lower priority than I Ching grammatical content.

## Phase 1: Schema and Campaign Deck

### 1.1 Gameboard slot model (if needed)

**Option A**: New model `GameboardSlot` (instanceId, campaignRef, period, slotIndex, questId, drawnAt, createdAt). Unique on (instanceId, campaignRef, period, slotIndex).

**Option B**: Use existing structures. Campaign deck = filtered CustomBar/ThreadQuest. Slots = runtime state or PlayerAdventureProgress-like table keyed by period.

**Recommendation**: Start with Option A for clarity. Period = instance.kotterStage (campaign-scoped) or GlobalState.currentPeriod (global). Specify per campaign.

### 1.2 Campaign deck definition

- Deck = quests in threads with adventure.campaignRef = instance.campaignRef (e.g. bruised-banana)
- Or: CustomBars with visibility public, allyshipDomain, kotterStage matching instance
- Exclude already-drawn this period. Seed or admin populates eligible quests.

### 1.3 Draw logic

- `drawFromCampaignDeck(instanceId, campaignRef, period, count)` — returns up to `count` quest IDs
- Excludes quests already in GameboardSlot for this instance/campaign/period
- Random or deterministic (e.g. order by createdAt). No replacement within draw.

## Phase 2: Gameboard UI and Completion

### 2.1 Gameboard route

**File**: `src/app/campaign/board/page.tsx` or extend `src/app/campaign/page.tsx`

- Fetch 8 slots for current instance/campaign/period
- If slots empty, run initial draw (8)
- Render slots as cards; each card: quest title, description, Complete button

### 2.2 Completion action

- Complete button → `completeQuest(questId, inputs, { source: 'gameboard', threadId })`
- On success: call `replaceSlotWithDraw(slotId)` — draw 1, update slot
- Revalidate, refresh UI

### 2.3 Link from blocked flows

- AdventurePlayer and PassageRenderer already link to `/campaign` when campaign quest blocked
- Ensure `/campaign` routes to gameboard view or has clear entry to board

## Phase 3: Vibeulon Spend Actions

### 3.1 Convert card to subquest

**Action**: `convertGameboardCardToSubquest(slotId, playerId)`

- Verify player has ≥1 vibeulon (InstanceParticipation.localBalance or global)
- Deduct 1 vibeulon
- Set quest.parentId = gameboard container quest ID (or create container if missing)
- Optionally: mark slot as "subquest" so it stays on board
- Log VibulonEvent (source: 'gameboard_subquest_convert')

### 3.2 Add custom subquest

**Action**: `addCustomSubquestToGameboard(playerId, questInput?)`

- Verify player has ≥1 vibeulon
- Deduct 1 vibeulon
- Create CustomBar (or use existing from player) with parentId = gameboard container
- Add to next empty slot or append to board
- Log VibulonEvent (source: 'gameboard_custom_subquest')

### 3.3 Gameboard container quest

- Each campaign/instance may have a "gameboard container" CustomBar (e.g. Q-MAP-{stage} or generic)
- Subquests attach via parentId. Use existing quest-nesting (createSubQuest, appendExistingQuest).

## Phase 4: Period and Draw Lifecycle

### 4.1 Period definition

- Use `instance.kotterStage` for campaign-scoped period (Bruised Banana)
- Or `GlobalState.currentPeriod` for global period
- When period advances (admin): clear slots, redraw 8

### 4.2 Initial draw

- On first load of gameboard for period: if 0 slots, draw 8
- Idempotent: if slots exist, don't redraw

## Phase 5: Integration and Verification

### 5.1 CT integration

- Gameboard completion passes `source: 'gameboard'`
- Campaign quests complete successfully
- Verify build and check

### 5.2 Manual tests

- Draw 8, complete one, verify replace
- Spend vibeulon to convert, verify subquest
- Spend vibeulon to add custom, verify new card

## Deferred / Out of Scope

- I Ching grammatical fixes (higher priority)
- Full map visualization
- Adventure completion record (CU)
