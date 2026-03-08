# Prompt: Gameboard and Campaign Deck

**Use this prompt when implementing the gameboard as the campaign quest completion surface. Blocker for onboarding; lower priority than I Ching grammatical content.**

## Context

The game map transcends quests and adventures (structural, experiential). The gameboard is where campaign quests are completed. Quest completion context restriction (CT) blocks campaign quest completion elsewhere. Each period, 8 quests are drawn from the campaign deck onto the gameboard. When completed, slots are replaced by new draws. Players spend vibeulons to (a) convert a card to subquest of gameboard, or (b) add a custom subquest to the gameboard.

## Prompt text

> Implement the Gameboard and Campaign Deck per [.specify/specs/gameboard-campaign-deck/spec.md](../specs/gameboard-campaign-deck/spec.md). Add GameboardSlot model (instanceId, campaignRef, period, slotIndex, questId, drawnAt). Define campaign deck (quests in threads with adventure.campaignRef). Implement drawFromCampaignDeck; on completion replace slot with new draw. Create gameboard route (/campaign/board); render 8 slots; Complete passes source: 'gameboard'. Add convertGameboardCardToSubquest and addCustomSubquestToGameboard (1 vibeulon each). Use instance.kotterStage or GlobalState.currentPeriod for period. Run build and check.

## Checklist

- [ ] Phase 1: Schema + campaign deck + draw logic
- [ ] Phase 2: Gameboard UI + completion + replace on complete
- [ ] Phase 3: Vibeulon spend (convert, add custom)
- [ ] Phase 4: Period lifecycle
- [ ] Phase 5: Build, check, manual tests

## Reference

- Spec: [.specify/specs/gameboard-campaign-deck/spec.md](../specs/gameboard-campaign-deck/spec.md)
- Plan: [.specify/specs/gameboard-campaign-deck/plan.md](../specs/gameboard-campaign-deck/plan.md)
- Tasks: [.specify/specs/gameboard-campaign-deck/tasks.md](../specs/gameboard-campaign-deck/tasks.md)
- Related: [quest-completion-context-restriction](quest-completion-context-restriction.md), [bruised-banana-quest-map](bruised-banana-quest-map.md)
