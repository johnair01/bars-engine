# Prompt: Quest Completion Context Restriction — Campaign vs Personal vs CYOA

**Use this prompt when implementing the quest completion context restriction so campaign quests complete only on the gameboard.**

## Context

The CYOA that explores the game map does not complete quests at the end of nodes. Map nodes are for BAR creation, BAR play, and routing. Campaign quests (which move the campaign forward) can only be completed on the gameboard. Personal and public quests can be completed from the dashboard and quest wallet. Currently, ending a Twine passage triggers quest completion globally; completion must be limited by quest type and context.

## Prompt text

> Implement the Quest Completion Context Restriction per [.specify/specs/quest-completion-context-restriction/spec.md](../specs/quest-completion-context-restriction/spec.md). Add `isCampaignQuest(questId)` in `src/lib/quest-scope.ts` (quest in thread with adventure.campaignRef). Extend `QuestCompletionContext` with `source`: dashboard, quest_wallet, twine_end, adventure_passage, gameboard. In `completeQuestForPlayer`: if campaign quest and source !== 'gameboard', return error. In `advanceRun`: if campaign quest and isEndPassage, skip `autoCompleteQuestFromTwine`. Update callers: QuestDetailModal (dashboard), completeStarterQuest (quest_wallet), PassageRenderer.handleEnd (twine_end), AdventurePlayer (adventure_passage). In AdventurePlayer, when blocked: show "This campaign quest must be completed on the gameboard" and link to /campaign. No schema changes. Run build and check.

## Checklist

- [ ] Phase 1: isCampaignQuest helper
- [ ] Phase 2: QuestCompletionContext + campaign-quest guard
- [ ] Phase 3: Restrict autoCompleteQuestFromTwine
- [ ] Phase 4: Update callers with source
- [ ] Phase 5: AdventurePlayer UX for blocked campaign quests
- [ ] Phase 6: Build, check, manual tests

## Reference

- Spec: [.specify/specs/quest-completion-context-restriction/spec.md](../specs/quest-completion-context-restriction/spec.md)
- Plan: [.specify/specs/quest-completion-context-restriction/plan.md](../specs/quest-completion-context-restriction/plan.md)
- Tasks: [.specify/specs/quest-completion-context-restriction/tasks.md](../specs/quest-completion-context-restriction/tasks.md)
- Related: [campaign-onboarding-twine-v2](campaign-onboarding-twine-v2.md), [quest-grammar-ux-flow](quest-grammar-ux-flow.md)
