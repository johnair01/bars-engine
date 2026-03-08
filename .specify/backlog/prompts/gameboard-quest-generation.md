# Prompt: Gameboard Quest Generation — Kotter-Aligned, Subquest-Ready

**Use this prompt when implementing Kotter-stage-aligned gameboard quests and subquest support for Bruised Banana Residency.**

## Context

The gameboard shows campaign quests. Currently the deck draws from all 8 Q-MAP quests regardless of period. We need: (1) deck filtered by Kotter stage (period 1 → only Stage 1 quests), (2) each quest to support subquests, (3) starter subquests per stage (e.g. Q-MAP-1-WAKE, Q-MAP-1-CLEAN, Q-MAP-1-GROW, Q-MAP-1-SHOW for Stage 1), (4) feedback mechanism for improving quest generation quality.

## Prompt text

> Implement the Gameboard Quest Generation spec per [.specify/specs/gameboard-quest-generation/spec.md](../specs/gameboard-quest-generation/spec.md). Extend getCampaignDeckQuestIds to filter by period (kotterStage). Seed starter subquests for Stage 1 (Q-MAP-1-WAKE, Q-MAP-1-CLEAN, Q-MAP-1-GROW, Q-MAP-1-SHOW). Add "Add subquest" button to gameboard cards; wire to createSubQuest(parentId). Document or implement feedback mechanism for quest generation improvement. Bruised Banana Residency as model; GATHERING_RESOURCES, Kotter 8-stage alignment.

## Checklist

- [ ] Phase 1: Deck filtered by period (kotterStage)
- [ ] Phase 2: Starter subquests for Stage 1
- [ ] Phase 3: Subquest UI on gameboard
- [ ] Phase 4: Feedback mechanism (document or implement)
- [ ] Phase 5: Build, check, manual tests

## Reference

- Spec: [.specify/specs/gameboard-quest-generation/spec.md](../specs/gameboard-quest-generation/spec.md)
- Plan: [.specify/specs/gameboard-quest-generation/plan.md](../specs/gameboard-quest-generation/plan.md)
- Tasks: [.specify/specs/gameboard-quest-generation/tasks.md](../specs/gameboard-quest-generation/tasks.md)
- Related: [gameboard-campaign-deck](gameboard-campaign-deck.md), [bruised-banana-quest-map](bruised-banana-quest-map.md), [bruised-banana-quest-map Stage 1 Design](../specs/bruised-banana-quest-map/STAGE_1_DESIGN.md)
