# Spec: BAR → Quest → Campaign Flow

## Purpose

Implement the BAR-to-quest-to-campaign flow: (1) 321-created BARs as InsightBARs, (2) campaign tagging (goal + domain), (3) player-initiated gameboard linkage via subquests, and (4) funding-goal-driven story clock and stage unlock.

## Priority

- **Enhancement** — extends 321 shadow process, campaign deck, and gameboard
- **Depends on** gameboard-campaign-deck for slots and deck mechanics

## Context / Goal

- **Phase 1**: BARs from the 321 flow should be typed as InsightBARs (distinct from generic vibe BARs). Manual creation remains; type is derived from flow context.
- **Folding into campaign**: Tagging the quest with campaign goal + domain. Player still creates more quests to make it playable on the gameboard.
- **Gameboard linkage**: Implemented via **subquests**. Players can only link by appending their quest as a subquest to a quest already on a gameboard slot. Subquests move the needle and clear the slot when they contribute (e.g. funds).
- **Outcome**: Completing subquests that collect funds (e.g. fundraiser party) adds to Instance funding; when the stage's funding threshold is passed, advance `kotterStage` and unlock new stages.

## Conceptual Model (Game Language)

- **WHO**: Player (creator, completer), Campaign (quest source), Instance (funding, kotterStage)
- **WHAT**: InsightBAR (321-derived), Quest (CustomBar), Subquest (parentId), Gameboard slot
- **WHERE**: Market (general pool), Gameboard (8 slots from deck)
- **Energy**: Vibeulons — spent to add subquest; funds raised advance stage
- **Personal throughput**: 321 → BAR → Link to campaign → Add as subquest → Complete → Advance stage

## User Stories

### P1: InsightBAR from 321

**As a player**, I want BARs I create from the 321 flow to be typed as InsightBARs, so they are distinguishable from generic vibe BARs.

**Acceptance**: When creating a BAR with `metadata321` present (from 321 flow), `CustomBar.type` is set to `'insight'` instead of `'vibe'`.

### P2: Link quest to campaign

**As a player**, I want to tag my quest with campaign goal and domain, so it can be folded into the campaign and eventually linked to the gameboard.

**Acceptance**: CustomBar has `campaignRef`, `campaignGoal`, and `allyshipDomain`. "Link to campaign" form sets these. Creator and players can see campaign-linked quests.

### P3: Add quest as subquest to gameboard slot

**As a player**, I want to add my well-defined quest as a subquest to a quest already on a gameboard slot, so I can contribute to the campaign without cluttering the market.

**Acceptance**: On a gameboard slot, "Add your quest" allows attaching an existing campaign-tagged quest as subquest (`parentId` = slot quest). Subquest appears under the slot.

### P4: Subquest completion advances funding

**As a player**, I want completing my fundraiser subquest to add funds to the campaign and potentially advance the stage, so the story moves forward.

**Acceptance**: When a subquest completes on gameboard with `source: 'gameboard'` and contributes funds (e.g. via `completionEffects`), add to `Instance.currentAmountCents`. When threshold for current `kotterStage` is met, advance `Instance.kotterStage` and clear the slot.

## Functional Requirements

### FR1: InsightBAR type

- `CustomBar.type` accepts `'insight'` in addition to `'vibe'` and `'story'`.
- When `createCustomBar` receives `metadata321` in FormData, set `type: 'insight'`.
- Extend `BarType` in `src/lib/bars.ts` to include `'insight'`.

### FR2: Campaign tagging schema

- Add `campaignRef String?` to CustomBar (e.g. `"bruised-banana"`).
- Add `campaignGoal String?` to CustomBar (e.g. `"throw a party"`).
- Use existing `allyshipDomain` for domain (GATHERING_RESOURCES, RAISE_AWARENESS, SKILLFUL_ORGANIZING, DIRECT_ACTION).

### FR3: Link to campaign action

- Action: `linkQuestToCampaign(questId, campaignRef, campaignGoal, allyshipDomain)`.
- Updates CustomBar with campaign tags.
- UI: "Link to campaign" form on quest detail or create flow.

### FR4: Add existing quest as subquest to slot

- Extend `addCustomSubquestToGameboard` (or equivalent) to accept `existingQuestId`.
- When provided, set `CustomBar.parentId = slotQuestId` for the existing quest.
- Cost: 1 vibeulon (per gameboard spec).
- Player can only attach quests they own or have access to, with `campaignRef` + `campaignGoal` set.

### FR5: Funding contribution on subquest completion

- When subquest completes with `source: 'gameboard'`, read `amountCents` or `fundsRaisedCents` from `completionEffects` JSON.
- Add to `Instance.currentAmountCents` for the instance associated with the campaign.

### FR6: Stage advance on funding threshold

- Define per-stage funding thresholds (e.g. Instance JSON or config).
- When `currentAmountCents` >= threshold for current `kotterStage`, advance `Instance.kotterStage` (1–8).
- Clear the slot and draw replacement (per gameboard spec).

## Non-functional Requirements

- Integrate with existing 321 flow, create-bar, and gameboard-campaign-deck.
- No breaking changes to existing BAR creation or quest completion flows.

## Non-goals (this iteration)

- Auto-generation of BARs from 321 (manual creation remains).
- Direct deck inclusion of player quests (subquest-only linkage).
- Full gameboard UI (depends on gameboard-campaign-deck implementation).

## Dependencies

- [321 Shadow Process](../321-shadow-process/spec.md) — metadata321, deriveMetadata321
- [Gameboard and Campaign Deck](../gameboard-campaign-deck/spec.md) — slots, deck, addCustomSubquestToGameboard
- [Quest Completion Context Restriction](../quest-completion-context-restriction/spec.md) — source: gameboard

## Reference

- Plan: [plan.md](plan.md)
- Tasks: [tasks.md](tasks.md)
