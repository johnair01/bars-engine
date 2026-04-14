# Spec: Campaign Lifecycle — Clock Types, Kotter Maturity, and Composting

## Purpose

Define how campaigns are born, run, mature, and compost. Campaigns have a **clock type** that governs their temporal behavior, **Kotter maturity stages** that measure depth independently of goal completion, and a **composting protocol** that ensures nothing is wasted when a campaign ends — BARs persist, spokes can spin off, and learnings publish to the game library.

## Problem

Currently campaigns have milestones and spoke structures but no formal lifecycle. There is no concept of:
- Time-bounded vs completion-bounded campaigns
- Kotter maturity as distinct from milestone progress
- What happens when a campaign's clock expires
- How spokes survive parent campaign composting
- How campaign owners exercise agency over their campaign's end-state

Without lifecycle governance, campaigns either run forever or disappear. Neither outcome serves players or the game world.

## Practice

Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Clock types | Three types: `time-bounded`, `completion-bounded`, `clock-gated`. A campaign has exactly one. |
| Kotter ≠ milestones | Kotter stages measure campaign maturity (depth/sustainability). Milestones measure goal progress. A campaign can meet goals at low Kotter maturity. |
| Kotter as floors | Kotter stages are floors of a building. More floors = more mature = more sustainable. A campaign at Stage 1 that hits its goal succeeded but didn't build lasting infrastructure. |
| Composting is not failure | When a campaign's clock expires or it is retired, it composts. BARs stay with players. Spokes can spin off. Learnings publish to library. The emotional work is never wasted. |
| Playing is the win | Everything after goal completion is invitation, never obligation. No punishment loops, no forced successor campaigns. |
| Campaign owner agency | At composting time, owners choose: reflect (optional small campaign), spin off spoke as new hub, publish to library, or walk away. Any combination. |
| Spoke survival | A spoke that is itself a campaign hub (e.g., MTGOA as BB spoke) survives parent composting as an independent hub. The curriculum doesn't expire with the fundraiser. |
| Time-bounded Kotter pacing | For time-bounded campaigns, Kotter stages map to time periods. Content advances on the clock whether players are ready or not. Gaps become felt absences = BAR seeds. |
| Completion-bounded Kotter pacing | For completion-bounded campaigns, Kotter stages advance when collective maturity thresholds are met. No clock pressure, no free advancement. |
| Clock-gated content | Optional overlay for time-bounded campaigns. Spokes/content unlock on a fixed schedule, creating urgency. Useful for fundraising campaigns. |
| Milestone generation | Milestones come from decomposing the campaign creator's big vision into steps. The interview asks two questions: "What does success look like?" and "How do you want to feel throughout?" |
| Vision insufficiency | If a campaign creator can't articulate their vision clearly enough, the system emits a BAR seed — a Wake Up quest to develop vision. Campaign creation is itself a quest. |
| Library as seed bank | The game library is the compost heap made public. Published campaign templates, learnings, and quest designs become seeds others can instantiate. |

## Conceptual Model

| Dimension | In This Spec |
|-----------|-------------|
| **WHO** | Campaign owner (creator), campaign players, spoke owners |
| **WHAT** | Campaign lifecycle states, milestones, Kotter maturity stages |
| **WHERE** | Campaign instance scoped by `campaignRef` |
| **Energy** | BARs as units of work; emotional charge as fuel |
| **Personal throughput** | Wake Up / Clean Up / Grow Up / Show Up — the 4 moves frame the campaign interview but are not interview questions themselves |

### Lifecycle State Machine

```
DRAFT → ACTIVE → [COMPOSTING | COMPLETED | RETIRED]
                       ↓
              owner chooses:
              ├── Reflect (optional mini-campaign)
              ├── Spin off spoke → new ACTIVE campaign
              ├── Publish to library → seed bank entry
              └── Walk away (BARs stay with players)
```

### Clock Type Behaviors

```
time-bounded:
  - Fixed deadline (e.g., 30 days)
  - Kotter stages map to time periods (~deadline/8 per stage)
  - Clock advances regardless of player readiness
  - On expiry: enters COMPOSTING state
  - Example: Bruised Banana (30 days, $3000 goal)

completion-bounded:
  - No deadline
  - Kotter stages advance on collective maturity thresholds
  - Enters COMPLETED when all milestones met AND Kotter 8 reached
  - Can be manually RETIRED by owner at any time
  - Example: MTGOA (runs until players have mastered the practices)

clock-gated (overlay, not standalone):
  - Applied to time-bounded campaigns
  - Content/spokes unlock on fixed schedule
  - Creates urgency pressure independent of player progress
  - Example: BB with spoke unlocks every 4 days
```

### Kotter Maturity Model

```
Kotter stages are FLOORS, not checkpoints:

Floor 8: Anchor Change      — impact is embedded in culture
Floor 7: Build On           — scaling what works  
Floor 6: Short-term Wins    — first evidence of results
Floor 5: Remove Obstacles   — clearing systemic blocks
Floor 4: Communicate Vision — shared understanding
Floor 3: Strategic Vision   — clarity on what success looks like
Floor 2: Build Coalition    — who is doing the work together
Floor 1: Create Urgency     — why this matters now

A campaign at Floor 1 with goals met = successful but fragile.
A campaign at Floor 5 with goals unmet = mature but incomplete.
Both are valid. Neither is punished.
```

### Milestone Generation Flow

```
Campaign Interview:
  Q1: "What would it look like if this worked?" → Big Vision
  Q2: "How do you want to feel throughout?" → Sustainability Check

  If vision is clear:
    Decompose → milestone steps → slot into spokes
    Validate: biggest vision ↔ smallest available goal
    Check milestones against desired feeling (flag draining ones)

  If vision is vague:
    Emit BAR seed → Wake Up quest to develop vision
    Campaign stays in DRAFT until vision is sufficient
```

## API Contracts

### Campaign Lifecycle Actions (Server Actions)

```typescript
// Create a new campaign in DRAFT state
action createCampaign(input: {
  name: string
  campaignRef: string                    // slug
  clockType: 'time-bounded' | 'completion-bounded'
  clockGated?: boolean                   // overlay for time-bounded
  deadline?: Date                        // required if time-bounded
  ownerId: string
}): {
  campaign: CampaignInstance
  state: 'DRAFT'
}

// Set campaign milestones from interview decomposition
action setCampaignMilestones(input: {
  campaignRef: string
  bigVision: string                      // Q1 answer
  desiredFeeling: string                 // Q2 answer
  milestones: Array<{
    title: string
    description: string
    spokeIndex: number                   // 0-7
    targetMetric?: string                // optional measurable
    targetValue?: number
  }>
}): {
  milestones: CampaignMilestone[]
  sustainabilityFlags: string[]          // milestones that conflict with desired feeling
}

// Activate a DRAFT campaign
action activateCampaign(input: {
  campaignRef: string
}): {
  campaign: CampaignInstance
  state: 'ACTIVE'
  kotterStage: 1
  clockStartedAt?: Date                  // set if time-bounded
}

// Get current Kotter maturity for a campaign
action getCampaignMaturity(input: {
  campaignRef: string
}): {
  kotterStage: number                    // 1-8
  kotterAdvancementProgress: number      // 0-1, progress toward next stage
  goalProgress: number                   // 0-1, milestone completion
  clockRemaining?: number               // ms, if time-bounded
  maturityAssessment: 'fragile' | 'developing' | 'sustainable' | 'anchored'
}

// Advance Kotter stage (completion-bounded campaigns)
action advanceKotterStage(input: {
  campaignRef: string
}): {
  previousStage: number
  newStage: number
  unlockedContent: string[]              // what opened up
} | {
  blocked: true
  reason: string                         // maturity threshold not met
  requiredBars: number
  currentBars: number
}

// Begin composting a campaign
action compostCampaign(input: {
  campaignRef: string
  reason: 'clock-expired' | 'owner-retired' | 'goals-met-choosing-to-close'
}): {
  campaign: CampaignInstance
  state: 'COMPOSTING'
  ownerOptions: CompostingOptions
}

// Campaign owner exercises composting choices
action resolveComposting(input: {
  campaignRef: string
  choices: {
    reflect?: boolean                    // start optional reflection mini-campaign
    spinOffSpokes?: number[]             // spoke indices to spin off as new hubs
    publishToLibrary?: boolean           // publish template + learnings
  }
}): {
  reflectionCampaign?: CampaignInstance  // if reflect chosen
  spunOffCampaigns?: CampaignInstance[]  // new independent hubs
  libraryEntry?: LibraryEntry           // if published
  composted: true
}

// Emit a BAR seed when vision is insufficient
action emitVisionQuest(input: {
  ownerId: string
  campaignRef: string                    // the campaign stuck in DRAFT
}): {
  barSeed: CustomBar                     // Wake Up quest to develop vision
  questType: 'vision-development'
}
```

### Types

```typescript
type CampaignState = 'DRAFT' | 'ACTIVE' | 'COMPOSTING' | 'COMPLETED' | 'RETIRED'

type ClockType = 'time-bounded' | 'completion-bounded'

interface CampaignInstance {
  id: string
  campaignRef: string
  name: string
  state: CampaignState
  clockType: ClockType
  clockGated: boolean
  deadline?: Date
  clockStartedAt?: Date
  kotterStage: number                    // 1-8
  ownerId: string
  parentSpokeBinding?: {
    parentCampaignRef: string
    spokeIndex: number
  }
  bigVision: string
  desiredFeeling: string
  createdAt: Date
  compostedAt?: Date
}

interface CampaignMilestone {
  id: string
  campaignRef: string
  spokeIndex: number
  title: string
  description: string
  targetMetric?: string
  targetValue?: number
  currentValue: number
  met: boolean
}

interface CompostingOptions {
  canReflect: boolean
  reflectableSpokes: number[]            // spokes with enough BAR material
  spinOffableSpokes: number[]            // spokes that are campaign-hubs themselves
  canPublish: boolean                    // has enough material for library
}

interface LibraryEntry {
  id: string
  sourceCampaignRef: string
  template: CampaignTemplate
  learnings: string                      // owner-authored reflection
  barCount: number                       // how much work was done
  kotterReached: number                  // maturity achieved
  publishedAt: Date
}
```

## User Stories

### P0 — Core Lifecycle

**CL-1**: As a campaign creator, I want to choose whether my campaign is time-bounded or completion-bounded, so the system governs pacing appropriately.

*Acceptance*: Campaign creation form includes clock type selection. Time-bounded requires deadline. Completion-bounded has no deadline field.

**CL-2**: As a campaign creator, I want to define milestones by answering "What does success look like?" and "How do you want to feel throughout?", so milestones emerge from my vision and sustainability needs.

*Acceptance*: Interview flow captures both answers. System decomposes vision into milestone steps. Flags milestones that conflict with desired feeling.

**CL-3**: As a player, I want to see campaign Kotter maturity separately from milestone progress, so I understand that meeting goals isn't the same as building sustainable impact.

*Acceptance*: Campaign dashboard shows both: milestone progress bar AND Kotter floor indicator. Both are visible but clearly distinct.

**CL-4**: As a campaign owner, when my campaign's clock expires, I want to choose what happens — reflect, spin off, publish, or walk away — so I have agency over my campaign's end-state.

*Acceptance*: Composting screen presents all options. No option is forced. "Walk away" is always available. BARs stay with all players regardless.

### P1 — Clock Mechanics

**CL-5**: As a time-bounded campaign, Kotter stages advance on the clock whether players are ready or not, so urgency is a real mechanic, not just a label.

*Acceptance*: Kotter stage transitions happen at `deadline / 8` intervals. Stage advancement is automatic. Players can see the countdown.

**CL-6**: As a campaign owner, I can optionally enable clock-gating so spokes unlock on a fixed schedule, creating structured urgency.

*Acceptance*: Clock-gated toggle available for time-bounded campaigns. When enabled, spokes unlock at `deadline / 8` intervals. Locked spokes are visible but inaccessible.

**CL-7**: As a completion-bounded campaign, Kotter stages advance only when collective maturity thresholds are met.

*Acceptance*: Each Kotter stage has a BAR maturity threshold. Stage advances when threshold is met. No automatic advancement.

### P2 — Composting & Library

**CL-8**: As a campaign owner, I can spin off a spoke as a new independent hub campaign when my parent campaign composts.

*Acceptance*: Composting screen lists eligible spokes. Selecting spin-off creates a new campaign in ACTIVE state with the spoke's existing BAR material.

**CL-9**: As a campaign owner, I can publish my campaign's template and learnings to the game library, so others can build from my work.

*Acceptance*: Publish flow captures owner reflection. Library entry includes template, learnings, BAR count, and Kotter maturity reached.

**CL-10**: As a player browsing the library, I can instantiate a new campaign from a published template, so I can run someone else's campaign design in my community.

*Acceptance*: Library browse → select template → create campaign (pre-populated with template milestones). Owner can modify milestones before activating.

### P3 — Vision Quest

**CL-11**: As a campaign creator who can't articulate their vision clearly, I receive a BAR seed (Wake Up quest) to develop my vision, so campaign creation is itself a quest.

*Acceptance*: When milestone decomposition fails or creator self-reports vagueness, system emits a vision-development BAR. Campaign stays in DRAFT. Completing the quest provides material to retry milestone definition.

## Functional Requirements

### Phase 1 — Campaign State Machine + Clock Types

- **FR1**: Add `state`, `clockType`, `clockGated`, `deadline`, `clockStartedAt`, `kotterStage`, `bigVision`, `desiredFeeling`, `compostedAt` fields to campaign instance model
- **FR2**: Implement `createCampaign` action with clock type selection
- **FR3**: Implement `activateCampaign` action (DRAFT → ACTIVE transition)
- **FR4**: Implement automatic Kotter stage advancement for time-bounded campaigns (cron or on-access check)
- **FR5**: Implement threshold-based Kotter advancement for completion-bounded campaigns
- **FR6**: Implement `getCampaignMaturity` action returning both maturity and goal progress

### Phase 2 — Milestone Interview + Generation

- **FR7**: Implement campaign interview flow (two questions + decomposition)
- **FR8**: Implement `setCampaignMilestones` with sustainability flag detection
- **FR9**: Implement milestone-to-spoke binding
- **FR10**: Implement `emitVisionQuest` for insufficient vision cases

### Phase 3 — Composting Protocol

- **FR11**: Implement `compostCampaign` action (ACTIVE → COMPOSTING transition)
- **FR12**: Implement `resolveComposting` action with all owner choices
- **FR13**: Implement spoke spin-off as new campaign creation
- **FR14**: Implement library publish flow
- **FR15**: Implement library browse + template instantiation

### Phase 4 — Clock-Gated Content

- **FR16**: Implement clock-gated spoke unlock schedule
- **FR17**: Implement locked spoke visibility (visible but inaccessible, shows unlock time)

## Non-Functional Requirements

- **NFR1**: Campaign state transitions must be atomic (no partial state)
- **NFR2**: Kotter advancement checks should be idempotent (safe to run multiple times)
- **NFR3**: Composting must never delete player BARs — BARs are player-owned, not campaign-owned
- **NFR4**: Library entries are immutable once published (no retroactive edits)
- **NFR5**: Clock-gated checks must not require real-time cron — compute on access from `clockStartedAt + deadline`

## Persisted Data & Prisma

When schema changes are implemented:
- [ ] Create migration: `npx prisma migrate dev --name add_campaign_lifecycle`
- [ ] Commit `prisma/migrations/…` with `schema.prisma`
- [ ] Run `npm run db:sync` and `npm run check`
- [ ] Human review of migration.sql

### Schema Changes (Anticipated)

```prisma
// Extend existing Instance/Campaign model
model CampaignInstance {
  // ... existing fields ...
  state           String    @default("DRAFT")    // DRAFT|ACTIVE|COMPOSTING|COMPLETED|RETIRED
  clockType       String    @default("completion-bounded")
  clockGated      Boolean   @default(false)
  deadline        DateTime?
  clockStartedAt  DateTime?
  kotterStage     Int       @default(1)
  bigVision       String?
  desiredFeeling  String?
  compostedAt     DateTime?
  
  // Parent spoke binding (for campaigns that are also spokes)
  parentCampaignRef String?
  parentSpokeIndex  Int?
  
  milestones      CampaignMilestone[]
  libraryEntry    LibraryEntry?
}

model CampaignMilestone {
  id              String   @id @default(cuid())
  campaignRef     String
  spokeIndex      Int
  title           String
  description     String
  targetMetric    String?
  targetValue     Float?
  currentValue    Float    @default(0)
  met             Boolean  @default(false)
  campaign        CampaignInstance @relation(...)
}

model LibraryEntry {
  id                  String   @id @default(cuid())
  sourceCampaignRef   String   @unique
  templateData        Json                        // serialized CampaignTemplate
  learnings           String
  barCount            Int
  kotterReached       Int
  publishedAt         DateTime @default(now())
  campaign            CampaignInstance @relation(...)
}
```

## Dependencies

- [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) — hub-spoke structure this lifecycle governs
- [campaign-kotter-domains](../campaign-kotter-domains/spec.md) — Kotter stage definitions and domain matrix
- [bar-quest-generation-engine](../bar-quest-generation-engine/spec.md) — BAR → quest pipeline for vision quests
- [spoke-move-seed-beds](../spoke-move-seed-beds/spec.md) — nursery bed system where BAR maturity is measured

## References

- `src/lib/campaign/types.ts` — existing campaign types
- `src/lib/campaign-deck.ts` — MilestoneView interface
- `src/lib/kotter.ts` — Kotter stages and domain actions
- `src/lib/campaign-hub/hub-journey-state.ts` — hub journey state persistence
- `data/bruised_banana_quest_map.json` — BB as reference time-bounded campaign
- `.agent/context/kotter-by-domain.md` — Kotter × domain matrix
