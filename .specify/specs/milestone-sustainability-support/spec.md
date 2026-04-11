# Spec: Milestone Sustainability Support — From Flags to Support Structures

## Purpose

Define how milestones flagged as "potentially draining" during the campaign interview get paired with concrete support structures that mitigate burnout risk. Flagging a milestone is step 1; attaching real support is step 2. This spec turns the sustainability check from a passive warning into an active design tool.

## Problem

The campaign-lifecycle spec introduces sustainability flags — milestones whose nature conflicts with the campaign owner's desired feeling (e.g., solo book-writing flagged against a desired feeling of "alive" because solo creative work tends to drain). But flagging alone changes nothing. The owner sees the warning and proceeds anyway, and the burnout still happens.

What's missing:
- A taxonomy of drain types (so flags are actionable, not just "this might be bad")
- A library of support structures matched to drain types
- A mechanism to attach support structures to milestones
- Tracking whether support structures are actually in place when work begins
- Gentle nudges when a milestone is being worked without its support

Without this, the sustainability check is theater. With it, the system actively helps owners design campaigns they can survive.

## Practice

Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Flags are diagnostic, supports are prescriptive | A flag describes the risk. A support structure prescribes the mitigation. They are linked but distinct. |
| Drain taxonomy | Five drain types: `solo-drain`, `admin-drain`, `scaling-drain`, `emotional-drain`, `visibility-drain`. Each has a typed set of recommended supports. |
| Support is optional | Owners can decline recommended supports. The flag remains visible but doesn't block work. Playing is the win — even with unsupported milestones. |
| Support structures are real things | A support structure must be a concrete artifact: a named person, a budget line, a calendar block, a commitment, a tool. Not vague advice. |
| Support tracking | Once a support is attached, the system tracks whether it's "in place" (e.g., partner confirmed) before milestone work begins. |
| Gentle nudges, not gates | If a milestone is being worked without its support in place, the system nudges (in-game prompt) but never blocks. |
| AI-suggested, owner-approved | Drain detection during interview suggests support types; owner picks specific instances. The AI surfaces options; the human chooses. |
| Reusable supports | A support structure (e.g., an accountability partner relationship) can be attached to multiple milestones. |
| Support library | Common support structures form a library that owners can browse and instantiate. Custom supports allowed. |
| Witness as support | "Being witnessed" is itself a valid support structure. Maps to existing BAR witness/attestation system. |
| Composting carries supports | When a campaign composts, attached supports survive — they belong to the player/owner, not the campaign. |

## Conceptual Model

| Dimension | In This Spec |
|-----------|-------------|
| **WHO** | Campaign owner (attaches supports), support providers (partners, paid help, witnesses) |
| **WHAT** | Drain types, support structures, milestone-support attachments |
| **WHERE** | Attached to milestones within campaigns |
| **Energy** | Supports prevent emotional charge leakage; they don't generate charge themselves |
| **Personal throughput** | Supports enable sustained Show Up moves on draining milestones |

### Drain Type Taxonomy

```
solo-drain:
  Description: Work done alone that should be witnessed or shared
  Indicators: Single owner, creative output, no collaboration in milestone description
  Examples: Writing a book, designing curriculum, creating art
  Recommended supports:
    - accountability-partner
    - body-double
    - public-commitment
    - milestone-witness

admin-drain:
  Description: Paperwork, legal, or financial work that produces no satisfaction during the doing
  Indicators: Keywords like "legal", "incorporate", "file", "tax", "compliance"
  Examples: 501c3 filing, contract review, accounting setup
  Recommended supports:
    - outsourcing-budget
    - paired-specialist
    - time-block-cap
    - reward-after

scaling-drain:
  Description: Over-extension when growing
  Indicators: Keywords like "scale", "multi-", "grow", "expand", multiple-city
  Examples: Multi-city chapter rollout, B2B sales, hiring team
  Recommended supports:
    - capacity-cap
    - delegation-requirement
    - rest-cycle
    - growth-pacing

emotional-drain:
  Description: High-emotional-charge work without recovery
  Indicators: Shadow work, conflict mediation, grief work, trauma-adjacent
  Examples: Difficult community conversations, processing collective harm
  Recommended supports:
    - witness-commitment
    - processing-space
    - recovery-time
    - therapist-on-call

visibility-drain:
  Description: Being on stage / performing
  Indicators: Keywords like "tour", "speak", "present", "conference", "interview"
  Examples: Book tour, conference keynote, media appearances
  Recommended supports:
    - green-room-time
    - prep-ritual
    - decompression-time
    - travel-companion
```

### Support Structure Catalog

```
accountability-partner:
  Type: relational
  Requires: Named person + agreed cadence
  Verification: Person confirms attachment

body-double:
  Type: relational
  Requires: Named person + scheduled co-working blocks
  Verification: Calendar invites accepted

public-commitment:
  Type: ceremonial
  Requires: Public statement of intent + audience
  Verification: Statement timestamped and posted

milestone-witness:
  Type: relational (one-time)
  Requires: Named person who will witness completion
  Verification: Person agrees in advance

outsourcing-budget:
  Type: financial
  Requires: Allocated budget + approved vendor list
  Verification: Budget line item exists

paired-specialist:
  Type: relational (skilled)
  Requires: Named specialist with relevant expertise
  Verification: Specialist confirms availability

time-block-cap:
  Type: structural
  Requires: Maximum hours per week + enforcement mechanism
  Verification: Calendar enforcement enabled

reward-after:
  Type: ceremonial
  Requires: Specific reward tied to milestone completion
  Verification: Reward defined in advance

capacity-cap:
  Type: structural
  Requires: Hard limit on concurrent work + commitment to honor
  Verification: Limit recorded

delegation-requirement:
  Type: structural
  Requires: List of tasks that MUST be delegated + delegate names
  Verification: Each task has a named delegate

rest-cycle:
  Type: structural
  Requires: Scheduled rest periods (e.g., one week off per month)
  Verification: Calendar blocks created

growth-pacing:
  Type: structural
  Requires: Maximum growth rate (e.g., one new chapter per quarter)
  Verification: Pacing rule recorded

witness-commitment:
  Type: relational
  Requires: Named witness for emotional work
  Verification: Witness agrees to specific commitment

processing-space:
  Type: structural
  Requires: Reserved time/space for emotional processing
  Verification: Space reserved

recovery-time:
  Type: structural
  Requires: Mandatory recovery period after work
  Verification: Recovery period scheduled

therapist-on-call:
  Type: relational (professional)
  Requires: Therapist or coach with specific availability
  Verification: Professional confirms

green-room-time:
  Type: structural
  Requires: Pre-event quiet time
  Verification: Calendar block

prep-ritual:
  Type: ceremonial
  Requires: Defined ritual + commitment to perform
  Verification: Ritual documented

decompression-time:
  Type: structural
  Requires: Post-event recovery period
  Verification: Calendar block

travel-companion:
  Type: relational
  Requires: Named travel partner
  Verification: Companion confirms
```

### Lifecycle of a Sustainability Flag

```
1. Campaign interview generates milestones
2. Sustainability check runs against desired feeling
3. Milestones with conflicts get flagged with drain type(s)
4. System suggests support structures for each drain type
5. Owner accepts, customizes, or declines supports
6. Accepted supports get attached to milestone (in 'pending' state)
7. Owner takes action to put support in place (e.g., ask person)
8. Support transitions to 'in-place' once verified
9. When work on milestone begins:
   - If support is in-place: silent
   - If support is pending: gentle nudge ("Have you confirmed your accountability partner yet?")
   - If owner declined: silent (respected the choice)
10. On milestone completion: support is released (relational supports stay in player's library)
11. On campaign composting: supports persist with their players/owners
```

## API Contracts

### Drain Detection

```typescript
type DrainType =
  | 'solo-drain'
  | 'admin-drain'
  | 'scaling-drain'
  | 'emotional-drain'
  | 'visibility-drain'

interface SustainabilityFlag {
  milestoneId: string
  drainTypes: DrainType[]
  reasoning: string                    // why this milestone was flagged
  severity: 'mild' | 'moderate' | 'high'
  recommendedSupports: SupportType[]
}

// Run sustainability check on a single milestone
action analyzeMilestoneSustainability(input: {
  milestoneId: string
  desiredFeeling: string
  milestoneDescription: string
}): {
  flag: SustainabilityFlag | null      // null if no drain detected
}

// Bulk analysis (called during campaign milestone setup)
action analyzeCampaignSustainability(input: {
  campaignRef: string
}): {
  flags: SustainabilityFlag[]
  unflaggedMilestones: string[]
}
```

### Support Structures

```typescript
type SupportType =
  | 'accountability-partner'
  | 'body-double'
  | 'public-commitment'
  | 'milestone-witness'
  | 'outsourcing-budget'
  | 'paired-specialist'
  | 'time-block-cap'
  | 'reward-after'
  | 'capacity-cap'
  | 'delegation-requirement'
  | 'rest-cycle'
  | 'growth-pacing'
  | 'witness-commitment'
  | 'processing-space'
  | 'recovery-time'
  | 'therapist-on-call'
  | 'green-room-time'
  | 'prep-ritual'
  | 'decompression-time'
  | 'travel-companion'
  | 'custom'

type SupportCategory = 'relational' | 'structural' | 'financial' | 'ceremonial'

type SupportState = 'pending' | 'in-place' | 'declined' | 'released'

interface SupportStructure {
  id: string
  ownerId: string                      // who owns this support (the campaign owner)
  type: SupportType
  category: SupportCategory
  label: string                        // owner-provided name
  description: string
  
  // Relational supports
  partnerId?: string                   // playerId if partner is in the system
  partnerName?: string                 // if external person
  partnerConfirmed?: boolean
  
  // Structural supports
  cadence?: string                     // e.g., "weekly", "1 hour/day"
  capacity?: number                    // numeric limit
  
  // Financial supports
  budgetAmount?: number
  budgetCurrency?: string
  
  // Ceremonial supports
  ritualDescription?: string
  
  state: SupportState
  createdAt: Date
  putInPlaceAt?: Date
  releasedAt?: Date
}

interface MilestoneSupportAttachment {
  id: string
  milestoneId: string
  supportId: string
  attachedAt: Date
  declinedAt?: Date
  declineReason?: string
}

// Create a new support structure
action createSupportStructure(input: {
  ownerId: string
  type: SupportType
  label: string
  description: string
  // ...type-specific fields...
}): {
  support: SupportStructure
}

// Attach a support structure to a milestone
action attachSupportToMilestone(input: {
  milestoneId: string
  supportId: string
}): {
  attachment: MilestoneSupportAttachment
}

// Decline a recommended support (records the decision)
action declineSupportForMilestone(input: {
  milestoneId: string
  supportType: SupportType
  reason?: string
}): {
  declined: true
}

// Mark a support as in-place (e.g., partner confirmed)
action markSupportInPlace(input: {
  supportId: string
  verificationNote?: string
}): {
  support: SupportStructure
}

// Get all supports attached to a milestone
action getMilestoneSupports(input: {
  milestoneId: string
}): {
  attachments: Array<{
    attachment: MilestoneSupportAttachment
    support: SupportStructure
  }>
  declinedTypes: SupportType[]         // supports owner declined
  unaddressedDrainTypes: DrainType[]   // drain types with no attached or declined support
}

// Get all supports owned by a player (their support library)
action getPlayerSupportLibrary(input: {
  ownerId: string
}): {
  supports: SupportStructure[]
}
```

### Nudge System

```typescript
// Check if a milestone has unaddressed support gaps when work begins
action checkMilestoneSupportReadiness(input: {
  milestoneId: string
}): {
  ready: boolean
  pendingSupports: SupportStructure[]   // attached but not in-place
  missingDrainTypes: DrainType[]        // drain types with no support and not declined
  nudgeMessage?: string                 // gentle reminder, never blocking
}
```

## User Stories

### P0 — Drain Detection & Recommendation

**SS-1**: As a campaign owner, when my milestones are analyzed for sustainability, I receive specific drain type classifications with recommended support structures, so I know what kind of help I need.

*Acceptance*: `analyzeCampaignSustainability` returns drain types and recommended supports per flagged milestone. Reasoning is human-readable.

**SS-2**: As a campaign owner, I can see why a milestone was flagged, so I understand the system's reasoning and can disagree if I want.

*Acceptance*: Each flag includes a `reasoning` field. UI displays it alongside the flag.

### P1 — Support Structure Creation & Attachment

**SS-3**: As a campaign owner, I can create concrete support structures (named accountability partner, allocated outsourcing budget, scheduled rest cycles), so flags become actionable.

*Acceptance*: `createSupportStructure` accepts type-specific fields. Validates that required fields for the type are present.

**SS-4**: As a campaign owner, I can attach a support structure to one or more milestones, so I can reuse supports across the campaign.

*Acceptance*: `attachSupportToMilestone` creates attachment record. Same support can be attached to multiple milestones.

**SS-5**: As a campaign owner, I can decline a recommended support type for a milestone with an optional reason, so the system respects my judgment.

*Acceptance*: `declineSupportForMilestone` records the decline. System never re-suggests declined types for that milestone (though it may surface them again on next interview).

### P2 — Support Tracking

**SS-6**: As a campaign owner, I can mark a support as "in place" once it's actually established (partner confirmed, budget allocated, calendar blocks created), so the system knows the support is real.

*Acceptance*: `markSupportInPlace` transitions state from `pending` to `in-place`. Records timestamp and optional verification note.

**SS-7**: As a player partner, I can confirm my role as someone's accountability partner, so the relational support has both sides.

*Acceptance*: For relational supports with `partnerId` set, partner receives notification. Partner confirmation transitions support to `in-place`.

### P3 — Nudges & Gentle Reminders

**SS-8**: As a campaign owner starting work on a milestone with pending supports, I receive a gentle reminder, so I'm prompted to put support in place without being blocked.

*Acceptance*: `checkMilestoneSupportReadiness` returns nudge message. UI displays as soft suggestion, never modal block.

**SS-9**: As a campaign owner, I can begin work on a milestone even if supports are not in place, so the system never punishes me for proceeding.

*Acceptance*: No support state blocks milestone progression. Nudges are visible but dismissable.

### P4 — Support Library & Reuse

**SS-10**: As a campaign owner, I can browse my library of existing supports across all my campaigns, so I can reuse them in new campaigns.

*Acceptance*: `getPlayerSupportLibrary` returns all supports owned by the player. Filterable by type, state, category.

**SS-11**: As a campaign owner whose campaign is composting, my support structures persist in my library, so the work I did to build supports is not lost.

*Acceptance*: Composting a campaign does not delete supports. Supports remain accessible via player library.

## Functional Requirements

### Phase 1 — Drain Detection

- **FR1**: Implement drain type detection in `src/lib/campaign/sustainability/drain-detection.ts`
- **FR2**: Implement keyword-based heuristics for each drain type
- **FR3**: Implement `analyzeMilestoneSustainability` and `analyzeCampaignSustainability` actions
- **FR4**: Define drain → support recommendation mapping

### Phase 2 — Support Structure Models

- **FR5**: Add `SupportStructure` and `MilestoneSupportAttachment` models
- **FR6**: Implement `createSupportStructure` with type-specific validation
- **FR7**: Implement `attachSupportToMilestone` and `declineSupportForMilestone`
- **FR8**: Implement `markSupportInPlace`
- **FR9**: Implement `getMilestoneSupports` and `getPlayerSupportLibrary`

### Phase 3 — Partner Confirmation Flow

- **FR10**: Implement partner notification when relational support is created
- **FR11**: Implement partner confirmation action (transitions support to in-place)
- **FR12**: Handle partner decline gracefully (support stays pending, owner notified)

### Phase 4 — Nudge System

- **FR13**: Implement `checkMilestoneSupportReadiness` action
- **FR14**: Build nudge message generator (drain type + missing support → message)
- **FR15**: Wire nudge into milestone work entry points (when player begins work on a milestone)
- **FR16**: Ensure nudges are dismissable and never blocking

### Phase 5 — UI Components

- **FR17**: Build sustainability flag display in milestone view
- **FR18**: Build support structure creation form (type-aware fields)
- **FR19**: Build support library browser
- **FR20**: Build nudge component (toast or inline soft warning)

## Non-Functional Requirements

- **NFR1**: Drain detection must be deterministic — same milestone description → same flag
- **NFR2**: Support structures persist across campaign composting
- **NFR3**: Nudges must never block UI flow
- **NFR4**: Partner notifications must respect player notification preferences
- **NFR5**: Support library queries must be O(supports owned) — index on `ownerId`

## Persisted Data & Prisma

When schema changes are implemented:
- [ ] Create migration: `npx prisma migrate dev --name add_milestone_sustainability_support`
- [ ] Commit `prisma/migrations/…` with `schema.prisma`
- [ ] Run `npm run db:sync` and `npm run check`
- [ ] Human review of migration.sql

### Schema Changes

```prisma
model SupportStructure {
  id                String   @id @default(cuid())
  ownerId           String
  type              String   // SupportType enum value
  category          String   // SupportCategory
  label             String
  description       String
  
  partnerId         String?
  partnerName       String?
  partnerConfirmed  Boolean  @default(false)
  
  cadence           String?
  capacity          Float?
  
  budgetAmount      Float?
  budgetCurrency    String?
  
  ritualDescription String?
  
  state             String   @default("pending")  // SupportState
  createdAt         DateTime @default(now())
  putInPlaceAt      DateTime?
  releasedAt        DateTime?
  
  attachments       MilestoneSupportAttachment[]
  
  @@index([ownerId])
  @@index([partnerId])
}

model MilestoneSupportAttachment {
  id            String   @id @default(cuid())
  milestoneId   String
  supportId     String
  attachedAt    DateTime @default(now())
  declinedAt    DateTime?
  declineReason String?
  
  support       SupportStructure @relation(fields: [supportId], references: [id])
  
  @@unique([milestoneId, supportId])
  @@index([milestoneId])
}

// Extend CampaignMilestone with sustainability fields
model CampaignMilestone {
  // ... existing lifecycle fields ...
  drainTypes        String[]  // DrainType values
  flagSeverity      String?   // 'mild'|'moderate'|'high'
  flagReasoning     String?
  declinedSupportTypes String[]
}
```

## Dependencies

- [campaign-lifecycle](../campaign-lifecycle/spec.md) — parent spec; sustainability flagging is introduced there
- [campaign-recursive-nesting](../campaign-recursive-nesting/spec.md) — sibling spec; supports work at any nesting level

## References

- `src/lib/campaign/types.ts` — campaign + milestone types
- `.specify/specs/campaign-lifecycle/spec.md` — parent spec
- `.specify/specs/bar-quest-generation-engine/spec.md` — BAR system that supports may attach to
