# Spec: Quest Stewardship + Role Resolution Engine v0 (GB)

## Purpose

Resolve who is stewarding a quest, what RACI roles apply, and what lifecycle state the quest is in — all derived from `BarResponse` (GA) and `PlayerQuest` records, with no additional schema changes.

## Depends on

- **GA** — `BarResponse.intent`, `BarResponse.raciRole`, `getBarRoles()`

## Quest lifecycle states

| State | Condition |
|-------|-----------|
| `proposed` | No `BarResponse` with `take_quest` or `join` intent for this quest |
| `active` | At least one `PlayerQuest` with `status = 'assigned'` (steward has taken it) |
| `completed` | At least one `PlayerQuest` with `status = 'completed'` (any steward completed) |

The state machine is **non-exclusive**: a quest can simultaneously be `active` (one steward is on it) and `completed` (another finished it). The dominant state is the highest in the hierarchy: completed > active > proposed.

## Steward resolution

A **steward** is a player whose `BarResponse` on this quest has `intent = 'take_quest'` or `'join'`, confirmed by a corresponding `PlayerQuest` entry with `status = 'assigned'`.

A **candidate** is a player whose `BarResponse` has `take_quest`/`join` intent but no matching `PlayerQuest` yet (expressed intent, not yet confirmed).

## API contract

### `takeQuest(questId)`
- Creates/updates `BarResponse` for current player: `responseType = 'join'`, `intent = 'take_quest'`
- Upserts `PlayerQuest` with `status = 'assigned'`
- Returns `{ success: true; playerQuestId: string }`

### `releaseQuest(questId)`
- Updates current player's `BarResponse` to `intent = 'decline'`, `raciRole = null`
- Updates `PlayerQuest.status` to `'released'` (new status string)
- Returns `{ success: true }`

### `resolveQuestStewards(questId)`
- Returns `{ confirmed: Player[], candidates: Player[] }` by joining BarResponse + PlayerQuest

### `resolveQuestState(questId)`
- Returns `'proposed' | 'active' | 'completed'`

### `getQuestRoleResolution(questId)`
- Combined view: `{ state, stewards: confirmed + candidates, roles: BarRoles }`
- Consumed by GC (eligibility engine) and GH (event engine)

## Non-goals (v0)
- UI (API-first; gameboard already has its own steward UI)
- Notifications
- Time-bounded stewardship TTL (future)
- Multi-steward conflict resolution (future)
