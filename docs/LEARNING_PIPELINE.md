# 321 Learning Pipeline

## Overview

The singleplayer charge metabolism system learns which charge types (moveType, archetype, creationType) lead to quest completion. Shadow321Session records all 321 outcomes; fueled_system sessions feed the learning pipeline without creating BARs or quests.

## Data Flow

```
321 Session → persist321Session → Shadow321Session
                    ↓
            outcome: bar_created | quest_created | fueled_system | skipped
                    ↓
    quest_created + linkedQuestId → completeQuest → questCompletedAt
                    ↓
            getMetabolizabilityReport(outcome?, moveType?)
```

## Shadow321Session

- **phase3Snapshot**: JSON (archetypeName, nationName, developmentalLens, genderOfCharge)
- **phase2Snapshot**: JSON (q1–q6, alignedAction, moveType)
- **outcome**: bar_created | quest_created | fueled_system | skipped
- **linkedBarId**, **linkedQuestId**: when BAR or quest created
- **questCompletedAt**: set when linked quest is completed (metabolizability signal)

## Fueled System

When a player chooses "Fuel System" instead of creating a BAR or quest:

1. `fuelSystemFrom321` persists Shadow321Session with outcome `fueled_system`
2. Charge contributes to the learning pipeline (no BAR/quest created)
3. Admin: receives `adminForgeUrl` and can open `/admin/forge` for metabolizability report

## Metabolizability Report

`getMetabolizabilityReport(filters?)` aggregates by outcome and moveType (from phase2Snapshot alignedAction). Computes:

- **count**: sessions in bucket
- **completedCount**: sessions where linkedQuestId exists and questCompletedAt is set
- **completionRate**: completedCount / count (for quest_created buckets)

Use for: identifying low-metabolizability types, future prompt tuning, suggesting "Turn into Quest" when metabolizability is high.

## Future: Prompt Tuning

Low completion rates for specific moveType/outcome combinations can inform:

- Quest generation prompt adjustments
- 321 triage suggestions ("This charge type tends to complete well as a quest")
- Admin Agent Forge: full 3-2-1 shadow process with friction-gated minting and agent creation

## References

- [singleplayer-charge-metabolism spec](.specify/specs/singleplayer-charge-metabolism/spec.md)
- [admin-agent-forge spec](.specify/specs/admin-agent-forge/spec.md)
- `src/lib/321-metabolizability.ts`
- `src/actions/charge-metabolism.ts`
