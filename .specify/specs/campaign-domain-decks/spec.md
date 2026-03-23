# Spec: Campaign Domain Decks

## Purpose

Bridge the gap between content creation (BARs, quests, 321s, AI agents, CYOA) and campaign action. Each allyship domain has a deck of quest cards. The deck is drawn onto the gameboard based on Kotter stage; cards are translated to fit the stage; completed cards stay out until the deck is exhausted, then the deck resets. The campaign itself has WAVE moves (Wake Up, Clean Up, Grow Up, Show Up) that operate at the campaign level.

**Parent concept**: Deck-building game — each campaign domain is a deck being operated by multiple people toward a common goal.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Deck scope | One deck per allyship domain per instance/campaign |
| Draw size | 8 cards per draw (gameboard slots) |
| Stage alignment | Draw filtered/translated by instance `kotterStage` |
| Exhaustion | Card stays out until completed; when deck empty, reset and reshuffle |
| Campaign moves | Campaign has Wake Up, Clean Up, Grow Up, Show Up — meta-level operations |
| Generic model | Same structure for all 4 domains; Domain × Kotter matrix defines stage prompts |

## Conceptual Model (Game Language)

| Dimension | Meaning | Schema |
|-----------|---------|--------|
| **WHO** | Identity | Nation, Archetype |
| **WHAT** | The work | Quests (CustomBar) — deck cards, gameboard slots |
| **WHERE** | Context of work | Allyship domains; one deck per domain |
| **Energy** | What makes things happen | Vibeulons |
| **Personal throughput** | How people get it done | 4 moves (Wake Up, Clean Up, Grow Up, Show Up) |
| **Campaign throughput** | How the campaign operates | Campaign moves (same 4) |

**Campaign Domain Deck** = pool of quests for a domain. Eligible quests: `allyshipDomain` matches, `kotterStage` matches (or stage-agnostic), in scope of instance/campaign.

**Draw** = select up to 8 from deck; exclude already-on-board; translate description/prompt to fit current Kotter stage using Domain × Kotter matrix.

**Exhaustion** = drawn card stays in play until completed. When deck has no remaining eligible cards, reset: return all completed cards to deck, reshuffle.

**Campaign moves** = campaign-level WAVE operations. Examples: Wake Up = sense the field, see who's available; Clean Up = clear blockers; Grow Up = increase capacity; Show Up = execute, ship.

## Generic Domain Growth Model

Each domain progresses through the same 8 Kotter stages. The stage prompt (from Domain × Kotter matrix) shapes how quests are interpreted and presented:

| Stage | GATHERING_RESOURCES | SKILLFUL_ORGANIZING | RAISE_AWARENESS | DIRECT_ACTION |
|-------|---------------------|---------------------|-----------------|---------------|
| 1. Urgency | "We need resources" | "We need capacity" | "People need to know" | "What needs doing now?" |
| 2. Coalition | Who will contribute? | Who are the builders? | Who will spread the message? | Who is with you? |
| 3. Vision | Fully resourced looks like… | System complete looks like… | Awareness looks like… | Completion looks like… |
| 4. Communicate | Share the need | Share the roadmap | Tell the story | Coordinate action |
| 5. Obstacles | What blocks donations? | What blocks implementation? | What blocks the message? | What blocks you? |
| 6. Wins | First milestone reached | First feature shipped | First cohort reached | Quest completed |
| 7. Build On | Scale giving | Iterate and scale | Amplify | Take on more |
| 8. Anchor | Sustainable funding | Sustainable practices | Embedded in culture | You're a player |

**Translation**: When a quest is drawn for stage N, its presentation (title, description, or prompt) is contextualized by the stage action. E.g. a generic "Donate" quest at stage 1 becomes "We need resources — donate now"; at stage 8 becomes "Sustainable funding — anchor your giving."

## User Stories

### P1: Domain deck exists and is populated

**As the system**, I want each campaign domain to have a deck of quests, so the gameboard can draw from it.

**Acceptance**: For each `allyshipDomain` and instance, a deck exists (or is derived). Deck = quests with `allyshipDomain` matching, `kotterStage` matching instance stage (or null for stage-agnostic), in scope of instance. Deck can be seeded from: book quests, custom quests, 321-derived quests, CYOA-generated quests.

### P2: Draw 8 cards onto gameboard by Kotter stage

**As the system**, I want 8 quests drawn from the domain deck onto the gameboard, filtered and translated by the current Kotter stage, so players see work that fits the campaign phase.

**Acceptance**: When gameboard loads or period advances, draw up to 8 from deck. Filter by `instance.kotterStage`. Translate quest presentation using Domain × Kotter stage action. Exclude quests already on board this period.

### P3: Completed card leaves deck until exhaustion

**As a player**, I want a completed quest card to stay out of the deck until the deck is exhausted, so the deck cycles through all cards before repeating.

**Acceptance**: Completed quest is marked "played" for this deck cycle. When drawing, exclude played quests. When deck has no remaining eligible cards, reset: return all to pool, reshuffle, clear cycle.

### P4: Completion replaces with new draw

**As a player**, I want a completed slot to be replaced by a new draw from the deck, so the gameboard stays active.

**Acceptance**: When quest on gameboard completes, clear slot, draw 1 from deck, place in slot. If deck exhausted, trigger reset first.

### P5: Campaign has moves

**As an admin or the campaign**, I want the campaign to have Wake Up, Clean Up, Grow Up, Show Up moves, so the campaign can operate as a machine.

**Acceptance**: Campaign move model exists. Wake Up = sense field, see who's available; Clean Up = clear blockers; Grow Up = increase capacity; Show Up = execute. Moves may affect: draw logic, stage advancement, admin actions.

### P6: Vibeulons for subquests (existing)

**As a player**, I want to spend vibeulons to convert a card to a subquest or add a custom subquest, so I can unblock when stuck.

**Acceptance**: Per [gameboard-campaign-deck](../gameboard-campaign-deck/spec.md) — spend 1 vibeulon to convert or add subquest.

## API Contracts

### getCampaignDomainDeck(instanceId, domain)

**Input**: `instanceId`, `domain: AllyshipDomain`  
**Output**: `{ questIds: string[], cycleId: string }` — eligible quest IDs for current cycle

### drawFromDeck(instanceId, domain, count, excludeQuestIds?)

**Input**: `instanceId`, `domain`, `count` (default 8), `excludeQuestIds`  
**Output**: `{ questIds: string[], exhausted: boolean }` — drawn quest IDs; exhausted if deck empty after draw

### markQuestPlayed(instanceId, domain, questId)

**Input**: `instanceId`, `domain`, `questId`  
**Output**: `{ success }` — marks quest as played this cycle

### resetDeckCycle(instanceId, domain)

**Input**: `instanceId`, `domain`  
**Output**: `{ success }` — marks cycle complete; next draw starts fresh

### translateQuestForStage(quest, domain, kotterStage)

**Input**: `quest`, `domain`, `kotterStage`  
**Output**: `{ title, description }` — quest presentation contextualized by stage action

## Functional Requirements

- **FR1**: Campaign domain deck = quests with `allyshipDomain`, `kotterStage` (or null), instance-scoped. Schema: `CustomBar.allyshipDomain`, `CustomBar.kotterStage`; scope via instance/campaign ref.
- **FR2**: Draw logic: filter by instance stage, exclude on-board and played-this-cycle, take up to 8. Use `drawFromDeck`.
- **FR3**: Exhaustion: when no eligible cards remain, call `resetDeckCycle`; next draw uses full pool.
- **FR4**: Translation: `translateQuestForStage` uses Domain × Kotter matrix (from `src/lib/kotter.ts` or `getStageAction`).
- **FR5**: Gameboard integration: gameboard draws from domain deck(s); instance may have one active domain or multiple campaigns.
- **FR6**: Campaign moves: model or enum for campaign-level Wake Up, Clean Up, Grow Up, Show Up. Effect on draw/stage TBD in plan.

## Schema (Proposed)

```prisma
// Optional: CampaignDomainDeckCycle — tracks cycle per deck
model CampaignDomainDeckCycle {
  id           String   @id @default(cuid())
  instanceId   String
  domain       String   // GATHERING_RESOURCES, etc.
  cycleId      String   @unique // e.g. "inst-123-GR-1"
  playedQuestIds String // JSON array of quest IDs played this cycle
  resetAt      DateTime?
  createdAt    DateTime @default(now())
  instance     Instance @relation(fields: [instanceId], references: [id])
}
```

Or derive from existing: `CustomBar` has `allyshipDomain`, `kotterStage`; track played IDs in `GlobalState` or `Instance` JSON field.

## Dependencies

- [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) — hub/spokes, landings-as-cards, 52/64 campaign topology, vault-gated CYOA emissions
- [gameboard-campaign-deck](../gameboard-campaign-deck/spec.md) — gameboard slots, draw, vibeulon spend
- [campaign-kotter-domains](../campaign-kotter-domains/spec.md) — instance kotterStage, Domain × Kotter
- [bruised-banana-quest-map](../bruised-banana-quest-map/spec.md) — GATHERING_RESOURCES quest map; seed pattern

## Non-Goals (this iteration)

- Full Campaign model (Phase 2 of campaign-kotter-domains)
- Multi-campaign per instance (one domain per instance for MVP)
- Campaign move automation (manual/admin initially)

## Reference

- Domain × Kotter: [.agent/context/kotter-by-domain.md](../../.agent/context/kotter-by-domain.md)
- Kotter lib: [src/lib/kotter.ts](../../src/lib/kotter.ts)
- Allyship domains: [src/lib/allyship-domains.ts](../../src/lib/allyship-domains.ts)
