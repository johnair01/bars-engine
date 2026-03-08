# Spec: Gameboard Quest Generation — Kotter-Aligned, Subquest-Ready

## Purpose

Define how gameboard quests are generated, filtered, and improved for the Bruised Banana Residency. The gameboard should show only quests aligned with the current Kotter stage (period). Each quest must support subquests. This spec provides a model for quest generation quality and improvement feedback.

**Practice** (persistence/UI/API): Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Period definition | `instance.kotterStage` (1–8); deck filtered by period |
| Deck sources | CustomBar with campaignRef + ThreadQuest (adventure.campaignRef) |
| Feedback mechanism | Option B (Admin Edit link) implemented; Option A (Report Issue) deferred |

## Context / Goal

- **Gameboard** = 8 slots per period; campaign quests complete here (CT restriction).
- **Period** = `instance.kotterStage` (1–8). When in period 1, only Stage 1 (Urgency) quests should appear.
- **Current gap**: Deck draws from all 8 Q-MAP quests regardless of period; gameboard shows a mix of stages instead of stage-aligned work.
- **Model**: Bruised Banana Residency, GATHERING_RESOURCES, Kotter 8-stage change model.

## Conceptual Model (Game Language)

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Player (completer), Campaign Owner (Bruised Banana) |
| **WHAT** | Quests — container (Q-MAP-N) + starter subquests + player-added subquests |
| **WHERE** | GATHERING_RESOURCES, Bruised Banana Residency |
| **Energy** | Vibeulons — minted on completion |
| **Personal throughput** | 4 moves (Wake Up, Clean Up, Grow Up, Show Up) per stage |

**Stage alignment**: Period N → deck = quests with `kotterStage = N`. No cross-stage mixing.

## User Stories

### P1: Gameboard filtered by Kotter stage

**As a player**, I want the gameboard to show only quests for the current Kotter stage (period), so the work I see matches the campaign phase we're in.

**Acceptance**: When `instance.kotterStage = 1`, deck includes only quests with `kotterStage = 1` (e.g. Q-MAP-1 + Q-MAP-1-WAKE, Q-MAP-1-CLEAN, Q-MAP-1-GROW, Q-MAP-1-SHOW). Slots draw from this filtered deck.

### P2: Each quest supports subquests

**As a player**, I want to add subquests under any gameboard quest, so I can contribute work that nests under the campaign structure.

**Acceptance**: Gameboard cards for container quests (Q-MAP-N) expose "Add subquest" → `createSubQuest(parentId)`. Subquests appear under the parent; completion flows through existing quest-engine.

### P3: Starter subquests per stage

**As a campaign owner**, I want pre-seeded starter subquests for each Kotter stage, so players have concrete work to pick up immediately.

**Acceptance**: Stage 1 has Q-MAP-1-WAKE, Q-MAP-1-CLEAN, Q-MAP-1-GROW, Q-MAP-1-SHOW (one per move). Stages 2–8 have analogous starters. Seed script idempotent.

### P4: Feedback for quest generation quality

**As a campaign owner or player**, I want to give feedback on how these quests are generated and described, so we can improve the content over time.

**Acceptance**: Mechanism to report issues or suggest improvements (e.g. Report Issue on gameboard, admin edit, or certification-style feedback). Feedback triaged into backlog or spec updates.

## Functional Requirements

### FR1: Deck filtered by period (kotterStage)

- `getCampaignDeckQuestIds(campaignRef, period)` — when `period` provided, filter to quests with `kotterStage = period`.
- `drawFromCampaignDeck` passes `period` to deck query.

### FR2: Subquest support on gameboard

- Gameboard card for quests with no `parentId` (containers) shows "Add subquest" action.
- Action calls `createSubQuest(parentId)` (cost: 1 vibeulon per existing quest-nesting logic).
- New subquest appears in player's hand or under parent in UI.

### FR3: Starter subquests seed

- Extend `data/bruised_banana_quest_map.json` or seed script with starter subquests per stage.
- Stage 1: Q-MAP-1-WAKE, Q-MAP-1-CLEAN, Q-MAP-1-GROW, Q-MAP-1-SHOW (`parentId: Q-MAP-1`, `kotterStage: 1`).
- Stages 2–8: analogous structure (defer or implement incrementally).

### FR4: Improvement feedback mechanism

- **Option B (implemented)**: Admin Edit link on gameboard cards → Admin → Quests. Admins can edit quest title/description.
- **Option A (deferred)**: Report Issue on gameboard (reuse cert feedback pattern).
- **Option C**: Feedback triage into `.specify/specs/gameboard-quest-generation/` or backlog.

## API Contracts

### getCampaignDeckQuestIds (extended)

```ts
function getCampaignDeckQuestIds(
  campaignRef: string,
  period?: number
): Promise<string[]>
```

- When `period` provided: filter to `CustomBar.kotterStage = period`.
- When omitted: current behavior (all campaign quests).

### createSubQuest (existing)

```ts
function createSubQuest(parentId: string, data: { title: string; description: string }): Promise<...>
```

- Used from gameboard "Add subquest" action.

## Quest Generation Quality (Improvement Loop)

| Input | Output | Feedback |
|-------|--------|----------|
| Campaign Owner unpacking (Q1–Q6) | QuestPacket (Epiphany Bridge) | Onboarding CYOA generator |
| Kotter stage + domain (GATHERING_RESOURCES) | Container + starter subquests | Seed data, admin edit |
| Player completion | Vibeulons, thread advance | Completion metrics |

**Improvement levers**:
1. Edit seed data (`bruised_banana_quest_map.json`) — descriptions, move applications.
2. Admin edit CustomBar (title, description) from Admin → Quests.
3. Report Issue → triage into spec or backlog.
4. Future: AI-assisted generation from Campaign Owner input + Kotter matrix.

## Verification Quest (required for UX features)

- **ID**: `cert-gameboard-quest-generation-v1`
- **Steps**: (1) Open gameboard at period 1; (2) Confirm only Stage 1 quests appear; (3) Add subquest under container; (4) Complete verification.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/spec.md)

## References

- [Bruised Banana Quest Map](../bruised-banana-quest-map/spec.md)
- [Bruised Banana Quest Map Stage 1 Design](../bruised-banana-quest-map/STAGE_1_DESIGN.md)
- [Gameboard and Campaign Deck](../gameboard-campaign-deck/spec.md)
- [Campaign Kotter Domains](../campaign-kotter-domains/spec.md)
- Quest nesting: [src/actions/quest-nesting.ts](../../src/actions/quest-nesting.ts)
