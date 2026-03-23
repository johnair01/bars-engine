# Spec: Actor Capability + Quest Eligibility Engine v0 (GC)

## Purpose

Matching layer: given a player, which quests are they eligible for and which are recommended?
Given a quest, which players are eligible to respond and which are most recommended?
Consumes GB's `QuestRoleResolution` for stewardship-aware filtering.

## Depends on

- **GA** — `BarResponse.intent`, `getBarRoles()`
- **GB** — `getQuestRoleResolution()`, `QuestLifecycleState`

## Schema: none
All matching derived from existing fields: `Player.nationId → Nation.name`, `Player.archetypeId → Archetype.name + primaryWaveStage`, `CustomBar.nation`, `CustomBar.archetype`, `CustomBar.moveType`, `CustomBar.questPool`, `CustomBar.emotionalAlchemyTag`.

## Eligibility rules (quest → actor)

A quest is **eligible** for a player if ALL of:
1. `CustomBar.status = 'active'`
2. `CustomBar.visibility = 'public'` OR player is creator
3. Player has no `PlayerQuest` with `status = 'completed'` for this quest
4. Player has no `PlayerQuest` with `status = 'assigned'` (already on it; shown separately)
5. Quest is not `type = 'charge_capture'`

## Recommendation scoring (quest for actor)

| Signal | Points |
|--------|--------|
| `CustomBar.nation` matches `Player.nation.name` | +3 |
| `CustomBar.archetype` matches `Player.archetype.name` | +3 |
| `CustomBar.moveType` matches `Player.archetype.primaryWaveStage` | +2 |
| `CustomBar.questPool = 'discovery'` | +1 (good for any player) |
| `CustomBar.questPool = 'dojo'` | +1 if player has archetype set |

Score 0 = neutral eligible, score ≥ 1 = recommended.

## Eligibility rules (actor → quest)

A player is **eligible** for a quest if ALL of:
1. Player has no `BarResponse` with `intent = 'decline'` for this quest
2. Player is not already a confirmed steward (`PlayerQuest.status = 'assigned'`)
3. Player has not completed the quest

## Recommended responders scoring (actor for quest)

| Signal | Points |
|--------|--------|
| `Player.nation.name` matches `CustomBar.nation` | +3 |
| `Player.archetype.name` matches `CustomBar.archetype` | +3 |
| `Player.archetype.primaryWaveStage` matches `CustomBar.moveType` | +2 |
| Player has previously completed a quest of same `moveType` | +1 |

## API contract

### `getEligibleQuestsForActor(playerId, opts?)`
- Returns quests the player can take, with `score` and `isRecommended` flag
- `opts.pool` — filter by `questPool`
- `opts.moveType` — filter by `moveType`
- `opts.limit` — default 20

### `getRecommendedQuestsForActor(playerId, opts?)`
- Returns `getEligibleQuestsForActor` filtered to `score ≥ 1`, sorted by score desc

### `getEligibleActorsForQuest(questId)`
- Returns players who can respond, with their `score`

### `getRecommendedRespondersForQuest(questId)`
- Returns `getEligibleActorsForQuest` filtered to `score ≥ 1`, sorted by score desc

## Non-goals (v0)
- UI (API-first)
- Temporal availability windows
- Campaign-scoped eligibility (future GH)
