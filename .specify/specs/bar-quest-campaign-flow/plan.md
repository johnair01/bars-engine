# Plan: BAR → Quest → Campaign Flow

## Summary

Implement the BAR-to-quest-to-campaign flow in four phases: (1) InsightBAR type from 321, (2) campaign tagging (goal + domain), (3) subquest-based gameboard linkage, (4) funding-goal-driven stage advance.

## Phase 1: InsightBAR Type (321 → BAR)

**Goal**: BARs created from the 321 flow are typed as `insight`, not `vibe`.

### 1.1 Extend BarType

**File**: `src/lib/bars.ts`

- Add `'insight'` to `BarType`: `export type BarType = 'vibe' | 'story' | 'insight'`

### 1.2 createCustomBar logic

**File**: `src/actions/create-bar.ts`

- When `metadata321` is present (parsed from FormData), set `type: 'insight'` instead of `'vibe'` in `customBar.create` data.
- No UI change; type derived from flow context.

### 1.3 Verification

- Create BAR via 321 flow (Import metadata) → verify `type === 'insight'`.
- Create BAR without metadata321 → verify `type === 'vibe'` (unchanged).

---

## Phase 2: Campaign Tagging (Goal + Domain)

**Goal**: Allow quests to be tagged with campaign goal + domain.

### 2.1 Schema

**File**: `prisma/schema.prisma`

- Add `campaignRef String?` to CustomBar.
- Add `campaignGoal String?` to CustomBar.
- Run `npm run db:sync`.

### 2.2 Link action

**File**: `src/actions/create-bar.ts` or new `src/actions/campaign-link.ts`

- `linkQuestToCampaign(questId, campaignRef, campaignGoal, allyshipDomain)` — updates CustomBar.
- Validate: player owns quest or has permission; campaignRef is valid.

### 2.3 UI

- Add "Link to campaign" section to quest detail (or create flow).
- Fields: campaignRef selector (e.g. bruised-banana), campaignGoal text input, allyshipDomain selector (reuse existing).
- Call link action on submit.

---

## Phase 3: Gameboard Linkage (Subquest-Based)

**Goal**: Players add their quests as subquests to quests already on gameboard slots.

### 3.1 Extend addCustomSubquestToGameboard

**File**: TBD (gameboard actions — may not exist yet; create or extend)

- Accept optional `existingQuestId` parameter.
- When provided: verify quest has `campaignRef` + `campaignGoal`; verify player owns or has access; set `parentId = slotQuestId`; do not create new CustomBar.
- When not provided: create new CustomBar as subquest (existing behavior per gameboard spec).
- Cost: 1 vibeulon (unchanged).

### 3.2 Slot → parent quest

- Gameboard slot holds a quest (from deck). That quest is the parent.
- Player's quest becomes child via `parentId`.

### 3.3 UI

- On gameboard slot card: "Add your quest" button.
- Modal: list player's campaign-tagged quests (campaignRef + campaignGoal set).
- Select quest → confirm → deduct vibeulon, set parentId.

---

## Phase 4: Funding-Driven Stage Advance

**Goal**: Completing subquests that collect funds advances stage when threshold is met.

### 4.1 Per-stage thresholds

**Option A**: Instance JSON field `stageGoalsCents String?` — e.g. `{"1":50000,"2":100000}` (stage → cents).

**Option B**: Separate model `CampaignStageGoal(instanceId, kotterStage, goalAmountCents)`.

**Recommendation**: Start with Option A (Instance JSON) for simplicity.

### 4.2 Completion handler

**File**: `src/actions/quest-thread.ts` or quest completion entry point

- On `completeQuestForPlayer` when `source === 'gameboard'`:
  - If quest has `parentId` (is subquest), check `completionEffects` for `fundsRaisedCents` or `amountCents`.
  - Resolve instance from campaign (thread.adventure.campaignRef → instance).
  - Add amount to `Instance.currentAmountCents`.
  - Call `advanceCampaignStageIfFundingMet(instanceId)`.

### 4.3 advanceCampaignStageIfFundingMet

- Read `stageGoalsCents` for current `kotterStage`.
- If `currentAmountCents >= threshold`: increment `kotterStage` (cap at 8), optionally reset or roll over `currentAmountCents` for next stage.
- Clear slot, draw replacement (per gameboard spec).

### 4.4 Quest completion payload

- Subquest completion (e.g. fundraiser) must include funds in `completionEffects`: `{ fundsRaisedCents: 5000 }` or similar.
- UI or completion flow must collect/pass this when completing fund-raising quests.

---

## Implementation Order

1. **Phase 1** (small): InsightBAR type — 2–3 files.
2. **Phase 2** (medium): Campaign tagging — schema + action + UI.
3. **Phase 3** (medium): Subquest linkage — extend addCustomSubquestToGameboard + UI.
4. **Phase 4** (medium): Funding-driven stage advance — completion handler + advance logic.

---

## Open Questions

1. **Per-stage funding thresholds**: Store as Instance JSON or separate model?
2. **Subquest contribution**: How does completion pass `amountCents`? Via `completionEffects` JSON or dedicated field?
3. **Slot clearing**: Does completing a subquest clear the slot immediately, or only when parent goal is fully met?
