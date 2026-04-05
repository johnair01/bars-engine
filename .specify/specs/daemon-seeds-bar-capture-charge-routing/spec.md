# Spec: Daemon Seeds, BAR Capture, and Charge Routing

## Purpose

Implement a charge capture and routing system in which BARs act as containers for metabolized charge from 3-2-1 shadow work. Captured energy can be routed into: daemon seeds, vibeulon allocation, quest allocation, or BAR/quest attachments. Shadow work leads to play.

**Problem**: BARs from 3-2-1 are currently insight artifacts only. There is no explicit charge container model, routing outcomes, or daemon seed capture. Energy from shadow work does not flow into gameplay.

**Practice**: Deftness Development — extend existing ontology; API-first; deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Charge representation | BarChargeCapture model; links to CustomBar. sourceType: THREE_TWO_ONE, MANUAL, QUEST_REFLECTION |
| Daemon seeds | New DaemonSeed model; created from BAR via routing |
| Routing | BarRoutingEvent; route types: CREATE_DAEMON_SEED, ALLOCATE_TO_QUEST, ATTACH_TO_QUEST, ATTACH_TO_BAR, CONVERT_TO_VIBEULON |
| Lineage | SourceLineageEdge + BarRoutingEvent; CustomBar.sourceBarId pattern |
| 3-2-1 integration | Extend Shadow321Form post-321 panel; create BarChargeCapture when BAR created from 321 |

## User Stories

### P1: BAR as Charge Container

**As a player**, I want BARs created from 3-2-1 to carry captured charge metadata, so the system treats them as routable energy containers.

**Acceptance**: BarChargeCapture created when BAR from 321; isRoutable=true; chargeAmount, sourceType stored.

### P2: Turn into Daemon Seed

**As a player**, I want to turn a BAR from shadow work into a daemon seed, so I can track the recurring pattern I identified.

**Acceptance**: createDaemonSeedFromBar creates DaemonSeed; links sourceBarId; BarRoutingEvent; BarChargeCapture marked routed.

### P3: Convert to Vibeulon

**As a player**, I want to convert captured charge into vibeulon energy, so I can use it in the game economy.

**Acceptance**: convertBarChargeToVibeulon mints Vibulon/VibulonEvent; provenance links to source BAR; BarChargeCapture marked routed.

### P4: Allocate to Quest

**As a player**, I want to allocate BAR-derived energy to a face-up quest, so reclaimed charge fuels my progress.

**Acceptance**: allocateBarChargeToQuest creates QuestChargeAllocation; quest must be eligible (face-up, assigned); lineage preserved.

### P5: Attach BAR to Quest or BAR

**As a player**, I want to attach a BAR to a quest or another BAR as supporting context, so the charge provides context without full conversion.

**Acceptance**: attachBarToQuest, attachBarToBar create BarAttachment; attachmentType: SUPPORTING_CONTEXT, CHARGE_SOURCE, INSIGHT_LINK, DAEMON_TRACE.

### P6: Lineage Preserved

**As a player**, I want the system to preserve traceability from 3-2-1 → BAR → daemon seed / quest / BAR, so I can see the chain.

**Acceptance**: SourceLineageEdge or BarRoutingEvent/BarAttachment support queries: which BAR created this daemon seed? which BAR fueled this quest?

## References

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — Full discovery, schema, services, API, UI
- [321-shadow-process](../321-shadow-process/spec.md)
- [singleplayer-charge-metabolism](../singleplayer-charge-metabolism/spec.md)
- [charge-capture-ux-micro-interaction](../charge-capture-ux-micro-interaction/spec.md)
