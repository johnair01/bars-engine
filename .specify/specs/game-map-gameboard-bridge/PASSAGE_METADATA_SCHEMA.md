# Passage Metadata Schema (BAR Emission)

Passage `metadata` (Json) supports special `actionType` values for branching and player interaction.

## actionType: 'bar_emit'

When a passage has `metadata.actionType === 'bar_emit'`, the adventure player shows a BAR form instead of (or in addition to) the passage text. The player fills out title and description; submitting creates a CustomBar in their wallet.

### Metadata shape

```json
{
  "actionType": "bar_emit",
  "barTemplate": {
    "defaultTitle": "Optional prefill",
    "defaultDescription": "Optional prefill"
  },
  "nextTargetId": "NodeId"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `actionType` | string | `'bar_emit'` — required to trigger BAR form |
| `barTemplate` | object? | Optional prefill for form |
| `barTemplate.defaultTitle` | string? | Prefill for title field |
| `barTemplate.defaultDescription` | string? | Prefill for description field |
| `nextTargetId` | string? | Node to advance to after submit; if absent, use first choice targetId |

### Flow

1. Player reaches passage with `metadata.actionType === 'bar_emit'`
2. Adventure player renders passage text (if any) + BAR form (title, description)
3. Player submits form → `emitBarFromPassage` creates CustomBar
4. On success: advance to `nextTargetId` or first choice's targetId
5. CustomBar has provenance in `agentMetadata`: `{ sourceType: 'passage_adventure', adventureId, passageNodeId }`

### Allyship domain inheritance

When the adventure is played in campaign context (`campaignRef` from URL or adventure), `emitBarFromPassage` inherits `allyshipDomain` from the Instance. This makes the BAR eligible for campaign quest generation. Personal quests (no campaignRef) do not require allyship domain.

## Move as BAR (passage or choice moveType)

When a passage has `metadata.moveType` or a choice has `moveType`, executing that choice creates a BAR representing the move before advancing. The BAR is assigned to the player with provenance.

### Passage-level moveType

```json
{
  "moveType": "wakeUp"
}
```

Applies to all choices from this passage. Valid values: `wakeUp`, `cleanUp`, `growUp`, `showUp`.

### Choice-level moveType

Choices may include optional `moveType`:

```json
[
  { "text": "Wake Up", "targetId": "node_wake", "moveType": "wakeUp" },
  { "text": "Skip", "targetId": "node_skip" }
]
```

When a choice has `moveType`, that choice creates a BAR before advancing. Choice-level overrides passage-level.

### Flow

1. Player makes a choice from a passage with `moveType` (passage or choice)
2. Before advancing: `createBarFromMoveChoice` creates CustomBar with moveType, passage text, questId (if in quest context)
3. BAR has `agentMetadata`: `{ sourceType: 'cyoa_move', adventureId, passageNodeId, moveType }`
4. Advance to targetId

## Other actionTypes

- `cast_iching` — Cast I Ching modal; `castIChingTargetId` for next node
