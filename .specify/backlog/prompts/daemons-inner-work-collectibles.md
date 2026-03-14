# Prompt: Daemons — Inner Work Unlocks Collectibles for Quest Completion

**Use this prompt when implementing the daemons system: inner work (EFA, 321, quest completion) unlocks collectible entities that players can use to complete quests.**

## Context

Players do "inner work" — Emotional First Aid (EFA), 321 Shadow Process, quest completion, meaningful participation at Kotter stages. This work should unlock **blessed objects**: collectible entities (talismans, blessed objects, or creature-like representations) that players can collect and use when completing quests.

**Related design docs:**
- [TALISMAN_EXPLORATION.md](../specs/bruised-banana-quest-map/TALISMAN_EXPLORATION.md) — Talisman per stage; blessed object inventory; Reliquary
- [ORACLE_DECK_PSYCHOTECH.md](../specs/bruised-banana-quest-map/ORACLE_DECK_PSYCHOTECH.md) — BAR blessedness; deck of charged kernels; Level 1 unlock

## Inner Work Types (Unlock Sources)

| Source | What it is | Unlock criteria |
|--------|------------|-----------------|
| **EFA completion** | Emotional First Aid session | Complete EFA flow; gold star vibeulon (321 EFA Integration) |
| **321 Shadow Process** | 3→2→1 flow; BAR creation | Complete 321 flow; metadata321; deriveMetadata321 |
| **Quest completion** | Complete a quest at a Kotter stage | Complete 1+ quest at stage; earn stage talisman |
| **Campaign participation** | Meaningful contribution | Donate, contribute lore, complete campaign quest |

## Collectible Schema (Sketch)

- **BlessedObjectEarned** (Talisman): id, playerId, source, earnedAt, metadata (questId, instanceId, kotterStage)
- **Source**: `efa` | `321` | `stage_talisman` | `campaign_completion` | `personal`
- **Use in quests**: Equip/attach to quest slot; bonus vibeulons; slot eligibility; narrative flavor

## Use-in-Quests Mechanic

- **Option A**: Blessed objects can be "played" into a quest slot (like BARs); completion mints extra vibeulons or unlocks narrative branches.
- **Option B**: Blessed objects expand slot capacity or grant "blessed" status to a BAR played with them.
- **Option C**: Reliquary view only; blessed objects are collectibles with provenance; use-in-quests is Phase 2.

## Spec Requirements (when creating full spec)

1. Define schema for Talisman/BlessedObjectEarned
2. Define unlock triggers per inner work type
3. Define Reliquary/inventory UI (visit, don't dominate dashboard)
4. Define use-in-quests mechanic (or defer to Phase 2)
5. Align with existing Talisman and Oracle Deck design

## Reference

- Spec: [bruised-banana-residency-ship/spec.md](../specs/bruised-banana-residency-ship/spec.md)
- Plan: [bruised-banana-residency-ship/plan.md](../specs/bruised-banana-residency-ship/plan.md)
