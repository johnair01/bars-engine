# Spec Kit Prompt: Quest Grammar Action Node Refactor

## Role

You are a Spec Kit agent implementing the action node refactor per [.specify/specs/quest-grammar-action-node/spec.md](../specs/quest-grammar-action-node/spec.md). This is a high-leverage deftness item: one schema change propagates through types, compiler, tests, and unlocks campaign-aware quest quality scoring.

## Objective

Generalize "donation node" to "action node". Donation is one specific action—the basic move for a fundraising campaign. Other campaigns have different actions: signup, complete quest, publish, study. The refactor makes the quest grammar campaign-agnostic.

## Requirements

- **Types**: Add `ActionType`; replace `isDonationNode` with `isActionNode`; add `actionType?: ActionType` to `QuestNode`
- **Compiler**: Set `actionType` on transcendence/wins nodes from `campaignId` (bruised-banana → donation; default → donation)
- **Tests**: Update `compileQuest.test.ts` assertions; all tests pass
- **Docs**: Update questGrammarSpec.md; add deftness checklist entry
- **Verification**: `npm run test:quest-grammar` && `npm run build` && `npm run check`

## Deliverables

- [ ] types.ts — ActionType, isActionNode, actionType
- [ ] compileQuestCore.ts — getActionTypeForCampaign, set actionType on action nodes
- [ ] compileQuest.test.ts — updated assertions
- [ ] questGrammarSpec.md — terminology update
- [ ] deftness-development/reference.md — checklist entry

## Reference

- Spec: [.specify/specs/quest-grammar-action-node/spec.md](../specs/quest-grammar-action-node/spec.md)
- Plan: [.specify/specs/quest-grammar-action-node/plan.md](../specs/quest-grammar-action-node/plan.md)
- Tasks: [.specify/specs/quest-grammar-action-node/tasks.md](../specs/quest-grammar-action-node/tasks.md)
- Quest Quality Automation: [.cursor/plans/quest_quality_automation_25128b01.plan.md](../../.cursor/plans/quest_quality_automation_25128b01.plan.md)
