# Spec: Bruised Banana Quest Map (Kotter-Based)

## Purpose

Create a generic quest structure based on the Kotter change model for the Bruised Banana fundraiser instance. Players can interface with the map by adding subquests and BARs to stage-specific container quests. The instance has a fundraising goal ($3000) and a 30-day timeline; the quest map scaffolds all 8 Kotter stages so work aligns with the campaign phase.

## Conceptual Model (Game Language)

| Dimension | Meaning | Schema |
|-----------|---------|--------|
| **WHO** | Identity | Nation, Archetype |
| **WHAT** | The work | Quests (CustomBar) — container quests + player-added subquests |
| **WHERE** | Context of work | GATHERING_RESOURCES (fundraiser) |
| **Energy** | What makes things happen | Vibeulons |
| **Personal throughput** | How players get things done | 4 moves (Wake Up, Clean Up, Grow Up, Show Up) |

**Quest map** = 8 container quests, one per Kotter stage. Each container is a parent quest (CustomBar) that players can add subquests to via `createSubQuest` or `appendExistingQuest`. Market shows only the quest matching the active instance's `kotterStage`.

**Archetype feature**: Archetypes aligned to a Kotter stage (e.g. Heaven → Vision) can create quests for that stage even when the game clock is elsewhere. Visionaries can shape the vision while urgency is still being rallied.

**4 moves × stage**: Each stage has different applications of Wake Up, Clean Up, Grow Up, Show Up. All Show Up moves = completing quests. The other three vary by stage (e.g. Wake Up at Urgency = see who needs to hear the urgency; Clean Up = clear what blocks naming the stakes).

**Domain × Kotter**: For GATHERING_RESOURCES, each stage has a specific prompt. See [.agent/context/kotter-by-domain.md](../../.agent/context/kotter-by-domain.md).

## User Stories

### P1: Instance has goal and timeline
**As an admin**, I want the Bruised Banana instance configured with a fundraising goal ($3000) and a 30-day timeline, so the campaign has clear constraints.

**Acceptance**: Instance has `goalAmountCents: 300000`, `startDate`, `endDate` (30-day window). Admin can set via [src/app/admin/instances/page.tsx](../../src/app/admin/instances/page.tsx).

### P2: Kotter quest map exists
**As a player**, I want the fundraiser to have a structured quest map with 8 stages, so I can see what work serves the current phase.

**Acceptance**: 8 CustomBars exist (one per Kotter stage 1–8). Each has `kotterStage` (1–8), `allyshipDomain: 'GATHERING_RESOURCES'`, `visibility: 'public'`, `isSystem: true`. Descriptions match GATHERING_RESOURCES column from Domain × Kotter matrix.

### P3: Add subquests to current stage
**As a player**, I want to add subquests under the current stage's container quest, so I can contribute work that fits the campaign phase.

**Acceptance**: When instance is at stage N, Market shows the Stage N container quest. Player can use `createSubQuest(parentId)` or `appendExistingQuest(parentId, questId)` from [src/actions/quest-nesting.ts](../../src/actions/quest-nesting.ts) to add subquests under it.

### P4: Admin advances stage
**As an admin**, I want to advance the instance's Kotter stage so the next phase's quest becomes visible.

**Acceptance**: Admin advances `instance.kotterStage` in Admin → Instances. Market then shows only quests at the new stage. Thresholds guidance in [THRESHOLDS.md](../campaign-kotter-domains/THRESHOLDS.md).

### P5: Archetypes create quests for their stage (future)
**As a player** with an archetype aligned to a Kotter stage (e.g. Heaven → Vision), I want to create quests for that stage even when the game clock is elsewhere, so visionaries can shape the vision while urgency is being rallied.

**Acceptance**: Quest creation flow allows players whose playbook matches a stage's archetype to create quests at that stage. Market shows current-stage quests; archetype-created quests for other stages are discoverable via a separate path (e.g. "Your stage" filter, hand, or map view).

## Functional Requirements

- **FR1**: Instance MUST support `goalAmountCents`, `startDate`, `endDate`. Seed or admin config must set these for Bruised Banana.
- **FR2**: 8 container quests MUST exist with IDs `Q-MAP-1` through `Q-MAP-8`, `kotterStage` 1–8, `allyshipDomain: 'GATHERING_RESOURCES'`.
- **FR3**: Each container quest MUST have a description derived from the GATHERING_RESOURCES row of the Domain × Kotter matrix.
- **FR4**: Seed script MUST be idempotent (upsert); runnable via `npm run seed:quest-map` or equivalent.
- **FR5**: Market filtering by `instance.kotterStage` (existing behavior) MUST remain; no schema change required.

## Quest Map Structure (8 Stages)

| ID | kotterStage | Title | Archetype | Core prompt |
|----|-------------|-------|-----------|-------------|
| Q-MAP-1 | 1 | Rally the Urgency | Thunder ⚡ | "We need resources" |
| Q-MAP-2 | 2 | Build the Coalition | Earth 🤝 | Who will contribute? |
| Q-MAP-3 | 3 | Shape the Vision | Heaven 👁 | Fully resourced looks like… |
| Q-MAP-4 | 4 | Spread the Word | Lake 🎭 | Share the need |
| Q-MAP-5 | 5 | Clear the Obstacles | Water 💧 | What blocks donations? |
| Q-MAP-6 | 6 | Claim the First Win | Fire 🔥 | First milestone reached |
| Q-MAP-7 | 7 | Scale the Giving | Wind 🌬 | Scale giving |
| Q-MAP-8 | 8 | Anchor the Change | Mountain ⛰ | Sustainable funding |

Each quest description includes a "By move" section: Wake Up, Clean Up, Grow Up, Show Up applications for that stage.

## Schema

No schema changes required. Uses existing CustomBar (parentId, rootId for nesting), Instance (kotterStage, goalAmountCents, startDate, endDate), and Market filtering.

## Stage 1 Design (Rally the Urgency)

For the $3000 / 30-day fundraiser, Stage 1 needs:
- **Container:** Q-MAP-1 (Rally the Urgency) — display-only hub; players add subquests under it.
- **Starter subquests:** 4 pickupable quests (one per move): Name What's at Stake (wakeUp), Clear What Blocks the Urgency (cleanUp), Practice Naming Stakes (growUp), Create Urgency for One Person (showUp).
- **Player flow:** Market → Accept starter or Add subquest under container. Complete → vibeulons.
- **Duration:** ~3–4 days (time-based) or until ~15% donation + 3 quests completed (milestone-based). Admin decides.
- **Maturity:** ~15% donation, 3+ stage-1 quests completed. Admin advances kotterStage in Admin → Instances.

See [STAGE_1_DESIGN.md](STAGE_1_DESIGN.md) for full design.

## Out of Scope (This Spec)

- Instance-scoped quest filtering (optional `instanceId` on CustomBar); defer Phase 2.
- Quest map visualization UI (e.g. graph of 8 stages); see [story-quest-map-exploration](../../.specify/backlog/prompts/story-quest-map-exploration.md).
- Verification quest; optional; can add later if UX feature.

## Related specs

- **Guided actions & milestone visibility:** [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) — surfaces Kotter container quests and board/hub links as **ordered next actions** so players don’t bounce between surfaces without advancing the instance.

## Reference

- Kotter lib: [src/lib/kotter.ts](../../src/lib/kotter.ts)
- Domain × Kotter: [.agent/context/kotter-by-domain.md](../../.agent/context/kotter-by-domain.md)
- Quest nesting: [src/actions/quest-nesting.ts](../../src/actions/quest-nesting.ts)
- Market filtering: [src/actions/market.ts](../../src/actions/market.ts)
- Campaign Kotter spec: [campaign-kotter-domains/spec.md](../campaign-kotter-domains/spec.md)
