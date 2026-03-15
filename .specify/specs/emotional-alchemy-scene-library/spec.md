# Spec: Emotional Alchemy Scene Library v1
### Canonical Lattice + Procedural Scene Templates

Status: Draft
Priority: 1.09
ID: AES

---

## Purpose

Define the emotional state model used by the Growth Vector Engine — 5 channels × 3 altitudes = 15 canonical states — and the scene template library that moves players through emotional alchemy growth vectors.

## Canonical Lattice

Store as two variables: `channel` (5) + `altitude` (3).

| Channel | Dissatisfied | Neutral | Satisfied |
|---------|-------------|---------|-----------|
| Fear (Metal) | anxiety | orientation | excitement |
| Anger (Fire) | frustration | clarity | bravery |
| Sadness (Water) | grief | acceptance | poignance |
| Joy (Wood) | restlessness | appreciation | bliss |
| Neutral (Earth) | numbness | presence | peace |

**Engine state = channel + altitude only.** Derived composites (Dread, Awe, Bitterness, etc.) tint copy and NPC masks but never drive generation logic.

## Growth Vectors (one altitude step at a time)

```
Fear:    anxiety → orientation → excitement
Anger:   frustration → clarity → bravery
Sadness: grief → acceptance → poignance
Joy:     restlessness → appreciation → bliss
Neutral: numbness → presence → peace
```

Rule: one good scene = one altitude step. Do not jump dissatisfied→satisfied.

## Scene Template Structure

Each scene: **Situation · Friction · Invitation · Choices · Vector**

Scenes represent developmental situations, not plots. Success = emotional metabolization + increased agency, not a "good ending."

## DB / Code Requirements

- `AlchemyPlayerState` — per-player: channel, altitude, updatedAt
- `AlchemySceneTemplate` — seed-able record: channel, altitudeFrom, altitudeTo, title, situationText, frictionText, invitationText, choices JSON, advice
- `AlchemySceneEvent` — log of scene interactions (playerId, templateId, choiceKey, outcomeAltitude, timestamp)
- `EmotionChannel` type already exists in `src/lib/charge-quest-generator/types.ts` — extend, don't duplicate
- Add `AlchemyAltitude` type: `dissatisfied | neutral | satisfied`

## Scene Selection Logic

```
selectScene(playerId) →
  1. load player's active channel + altitude
  2. find valid templates: channel matches, altitudeFrom matches current altitude
  3. weight by: BAR history, archetype, nation, campaign phase
  4. return one template (privilege relevance > novelty)
```

## Integration Points

- BAR creation → set or update `channel` on player state
- 321 Shadow session → updates channel based on shadow emotion
- Quest completion → may advance altitude (scene outcome)
- NPC Constitution System (ANC) → scenes drive NPC action verbs
- Quest Grammar (BY) → scene vector informs compileQuest inputs

## Acceptance Criteria

1. Player alchemy state (channel + altitude) can be read and written.
2. Scene templates are seeded for all 10 growth vectors (2 scenes × 5 channels).
3. `selectScene()` returns a relevant template given player state.
4. Altitude advances on successful scene resolution.
5. Composite states tint copy without replacing canonical state.

## Non-Goals

- Multi-scene arcs in v1 (one scene at a time)
- Maximal branching (optimize for emotional movement)
- Replacing existing `EmotionChannel` type

## Dependencies

- Charge Quest Generator (`src/lib/charge-quest-generator/`) — extend EmotionChannel
- BAR system — emotion metadata on BARs feeds channel selection
- 321 Shadow — session completion updates channel
