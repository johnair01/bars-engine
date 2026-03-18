# Prompt: Game Map ↔ Gameboard Bridge — 4-Move Slots, CYOA Hub, BAR Emission

**Use this prompt when implementing the game map–gameboard bridge: 4 slots by move type, quest–adventure links, View/Start Adventure, adventure hub, and BAR emission passages.**

## Context

The game map (8 I Ching portals) and campaign gameboard (8 slots) compete for vibe. Adventures created via unpacking flow are not visible or startable from quest cards. The gameboard should have 4 slots (Wake Up, Clean Up, Grow Up, Show Up). Each quest can have up to 4 CYOA adventures. Players should start adventures from the gameboard or from their hand. CYOA passages can emit BARs to the player wallet; moves are represented as BARs.

## Prompt text

> Implement the Game Map ↔ Gameboard Bridge spec per [.specify/specs/game-map-gameboard-bridge/spec.md](../specs/game-map-gameboard-bridge/spec.md). (1) Add QuestAdventureLink model; extend publishQuestPacketToPassagesWithSourceQuest with moveType. (2) Quest cards show "View/Start Adventure" when adventures exist; start from gameboard or hand. (3) Change gameboard to 4 slots (Wake Up, Clean Up, Grow Up, Show Up); add moveType to GameboardSlot; migration for 8→4. (4) Adventure hub when quest has 2+ adventures. (5) BAR emission passage: metadata.actionType='bar_emit'; form creates CustomBar in wallet. (6) Shared metaphor: align game map and gameboard flow. Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: QuestAdventureLink; View/Start Adventure on quest cards
- [ ] Phase 2: 4 gameboard slots by move type
- [ ] Phase 3: Adventure hub for multi-adventure quests
- [ ] Phase 4: BAR emission passage
- [ ] Phase 5: Game map → gameboard shared metaphor
- [ ] Phase 6: Build, check, manual tests

## Reference

- Spec: [.specify/specs/game-map-gameboard-bridge/spec.md](../specs/game-map-gameboard-bridge/spec.md)
- Plan: [.specify/specs/game-map-gameboard-bridge/plan.md](../specs/game-map-gameboard-bridge/plan.md)
- Tasks: [.specify/specs/game-map-gameboard-bridge/tasks.md](../specs/game-map-gameboard-bridge/tasks.md)
- Related: [gameboard-deep-engagement](../specs/gameboard-deep-engagement/spec.md), [quest-upgrade-to-cyoa](../specs/quest-upgrade-to-cyoa/spec.md), [game-loop-bars-quest-thread-campaign](../specs/game-loop-bars-quest-thread-campaign/spec.md)
