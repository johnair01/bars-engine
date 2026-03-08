# Prompt: BAR → Quest → Campaign Flow

**Use this prompt when implementing the BAR-to-quest-to-campaign flow. Extends 321 shadow process, campaign tagging, and gameboard subquest linkage.**

## Context

BARs from the 321 flow should be InsightBARs. Players can tag quests with campaign goal + domain. Gameboard linkage is subquest-based: players add their quests as subquests to quests already on gameboard slots. Completing fund-raising subquests adds to Instance funding; when threshold is met, advance kotterStage.

## Prompt text

> Implement the BAR → Quest → Campaign Flow per [.specify/specs/bar-quest-campaign-flow/spec.md](../specs/bar-quest-campaign-flow/spec.md). Phase 1: Add InsightBAR type; when metadata321 present in createCustomBar, set type: 'insight'. Phase 2: Add campaignRef and campaignGoal to CustomBar; create linkQuestToCampaign action; add "Link to campaign" form. Phase 3: Extend addCustomSubquestToGameboard to accept existingQuestId; attach player's campaign-tagged quest as subquest of slot quest. Phase 4: On subquest completion with source: gameboard, add funds from completionEffects to Instance.currentAmountCents; implement advanceCampaignStageIfFundingMet when threshold met. Run build and check.

## Checklist

- [ ] Phase 1: InsightBAR type
- [ ] Phase 2: Campaign tagging (schema + action + UI)
- [ ] Phase 3: Subquest linkage (attach existing quest to slot)
- [ ] Phase 4: Funding-driven stage advance
- [ ] Build, check, manual tests

## Reference

- Spec: [.specify/specs/bar-quest-campaign-flow/spec.md](../specs/bar-quest-campaign-flow/spec.md)
- Plan: [.specify/specs/bar-quest-campaign-flow/plan.md](../specs/bar-quest-campaign-flow/plan.md)
- Tasks: [.specify/specs/bar-quest-campaign-flow/tasks.md](../specs/bar-quest-campaign-flow/tasks.md)
- Related: [321-shadow-process](321-shadow-process.md), [gameboard-campaign-deck](gameboard-campaign-deck.md)
