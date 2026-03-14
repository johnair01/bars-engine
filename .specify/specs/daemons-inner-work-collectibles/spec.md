# Spec: Daemons — Inner Work Unlocks Collectibles for Quest Completion

## Purpose

Inner work (EFA, 321 Shadow Process, quest completion, campaign participation) unlocks collectible blessed objects (talismans) that players collect and optionally use in quests.
Aligns with [TALISMAN_EXPLORATION.md](../bruised-banana-quest-map/TALISMAN_EXPLORATION.md) and [ORACLE_DECK_PSYCHOTECH.md](../bruised-banana-quest-map/ORACLE_DECK_PSYCHOTECH.md).

**Problem**: Players do inner work but have no persistent record of earned collectibles. Talismans and blessed objects are designed but not implemented.

**Practice**: Deftness Development — schema first, Reliquary view before use-in-quests.

## User Stories

### P1: Collectibles from inner work

**As a** player who completes EFA, 321, or a quest at a Kotter stage, **I want** to earn a collectible (talisman, blessed object), **so** I have a record of my inner work.

**Acceptance**: Completing EFA, 321, or a quest at a stage creates a `BlessedObjectEarned` record; player can view it in Reliquary.

### P2: Reliquary view

**As a** player with earned collectibles, **I want** to visit a Reliquary view (tap avatar → Reliquary), **so** I can see what I've earned without it dominating the dashboard.

**Acceptance**: Reliquary shows personal blessed object + stage talismans; provenance (campaign, stage).

### P3: Use in quests (Phase 2)

**As a** player with blessed objects, **I want** to play them into quest slots (Phase 2), **so** I get bonus vibeulons or narrative flavor.

**Acceptance**: Deferred; Phase 1 = Reliquary view only.

## Schema

### BlessedObjectEarned

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique ID |
| playerId | String | Owner |
| source | Enum | `efa` \| `321` \| `stage_talisman` \| `campaign_completion` \| `personal` |
| earnedAt | DateTime | When earned |
| instanceId | String? | Campaign instance (for stage talismans) |
| kotterStage | Int? | Stage when earned (1–8) |
| questId | String? | Quest that triggered earning |
| metadata | Json? | Extra provenance (loreBarId, etc.) |

**Source mapping:**

| Source | Unlock trigger |
|--------|----------------|
| `efa` | Complete EFA flow (321 EFA Integration) |
| `321` | Complete 321 Shadow Process flow |
| `stage_talisman` | Complete 1+ quest at Kotter stage |
| `campaign_completion` | Donate, contribute lore, complete campaign quest |
| `personal` | Onboarding blessed object story |

## Unlock Triggers

1. **EFA**: On EFA completion (gold star vibeulon flow) → create `BlessedObjectEarned` with `source: 'efa'`.
2. **321**: On 321 flow completion (metadata321, deriveMetadata321) → create with `source: '321'`.
3. **Quest completion**: On quest completion, if quest has `kotterStage` and instance is campaign → check if player already has this stage talisman for instance; if not, create with `source: 'stage_talisman'`.
4. **Campaign participation**: On donate, lore contribution, or campaign quest completion → create with `source: 'campaign_completion'` (or stage-specific if applicable).

## Reliquary UI

- **Entry**: Tap avatar → Reliquary. Or nav item. **Not** dashboard center.
- **Content**: Personal blessed object + earned talismans (icon, name, provenance).
- **Provenance**: Campaign name, stage, quest name when available.
- Per [TALISMAN_EXPLORATION.md](../bruised-banana-quest-map/TALISMAN_EXPLORATION.md): "Visit, don't dominate."

## Use-in-Quests Mechanic (Phase 2)

- **Option A**: Play blessed objects into quest slot (like BARs); completion mints extra vibeulons or unlocks narrative branches.
- **Option B**: Blessed objects expand slot capacity or grant "blessed" status to a BAR played with them.
- **Option C**: Reliquary view only; use-in-quests deferred.

**Phase 1**: Option C. Phase 2 will implement A or B.

## Dependencies

- [321 EFA Integration](../321-efa-integration/spec.md) — CM
- [321 Shadow Process](../321-shadow-process/spec.md) — ER
- [Bruised Banana Residency Ship](../bruised-banana-residency-ship/spec.md) — RB
- [TALISMAN_EXPLORATION](../bruised-banana-quest-map/TALISMAN_EXPLORATION.md)
- [ORACLE_DECK_PSYCHOTECH](../bruised-banana-quest-map/ORACLE_DECK_PSYCHOTECH.md)

## Non-Goals (Phase 1)

- Use-in-quests mechanic (Phase 2)
- Personal blessed object from onboarding (can be Phase 1.5)
- Maturity boost on campaign completion (TALISMAN_EXPLORATION §4)
