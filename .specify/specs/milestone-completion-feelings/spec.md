# Spec: Milestone Completion Feelings — First-Class Satisfaction Tagging

## Purpose

Make completion feelings (Triumph, Poignance, Bliss, Peace, Excitement) first-class fields on campaign milestones. Each milestone declares which feelings it should produce when completed. Players self-report what they actually felt. The system tracks alignment between predicted and actual feelings, enabling campaigns to verify they're producing the satisfaction payload their owners designed for.

## Problem

The campaign-lifecycle spec captures the campaign owner's `desiredFeeling` as a string. The interview asks "How do you want to feel throughout?" but there's no structured way to:

- Tag specific milestones with the feelings they should produce
- Verify that a milestone actually produced its predicted feelings
- Check whether a campaign as a whole produces the owner's desired feelings
- Catch milestones that complete without producing any satisfaction (red flag for redesign)
- Distinguish *which* feelings a campaign tends toward (Triumph-heavy vs Peace-heavy)

Without structured feeling tags, "How do you want to feel?" stays as vibes-level guidance instead of becoming a measurable design constraint. With them, MTGOA Organization can verify it's actually producing the five feelings the owner asked for, not just hoping it will.

## Practice

Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Five feelings | The vocabulary is fixed: `Triumph`, `Poignance`, `Bliss`, `Peace`, `Excitement`. These are the satisfaction feelings (rewards of completion), not process feelings (states during work). |
| Feelings ≠ emotional alchemy elements | The 5 satisfaction feelings are a separate vocabulary from the 5-element alchemy system (Wood/Fire/Earth/Metal/Water). They may correspond, but tagging is independent. The spec stores feelings, not elements. |
| Multiple tags per milestone | A milestone can predict multiple feelings (e.g., "Annual Conference" → Peace + Triumph + Bliss). At least one is required if the milestone is to count toward Q2 sustainability. |
| Predicted vs actual | Each milestone has `predictedFeelings` (set at design time) and `actualFeelings` (collected from player self-reports after completion). Alignment is computed. |
| Self-reporting is voluntary | Players can complete milestones without reporting feelings. No reports = no alignment data, but no penalty. |
| Multiple players, multiple reports | If a milestone is completed by multiple players, each player's reports aggregate. Alignment is computed across all reports. |
| Campaign feeling profile | Each campaign has a derived "feeling profile" — distribution of predicted and actual feelings across all its milestones. |
| Q2 verification | Campaign owner's `desiredFeeling` (free text) is parsed at interview time into a set of feeling tags. Verification checks: do milestone predictions cover all desired feelings? |
| No negative feelings | This vocabulary has no negative entries. Drain types in the sustainability spec handle the negative side. Feelings here are exclusively satisfaction outcomes. |
| Reports include intensity | Each report has feeling tag + intensity (1-5 scale). Aggregation weighs by intensity. |
| Feelings are public-by-default for owners | Campaign owners see all feeling reports (anonymized if multi-player). Players see only their own. |

## Conceptual Model

| Dimension | In This Spec |
|-----------|-------------|
| **WHO** | Campaign owners (set predictions), players (submit reports) |
| **WHAT** | Feeling tags, predicted vs actual, alignment scores |
| **WHERE** | Attached to milestones; aggregated at campaign level |
| **Energy** | Feelings are the *output* of well-designed work — the proof that emotional charge was metabolized into satisfaction |
| **Personal throughput** | Feelings are reported after Show Up moves complete |

### The Five Feelings

```
Triumph:
  Definition: Hard challenge overcome, visible result, earned victory
  When it arises: Completing something difficult that you were uncertain you could
  Tag indicator words: "ship", "launch", "achieve", "win", "complete"

Poignance:
  Definition: The sweet ache of meaning; depth of recognition
  When it arises: Touching something that matters at a level beyond words
  Tag indicator words: "honor", "remember", "witness", "hold", "name"

Bliss:
  Definition: Sustained well-being from aligned action; the work flowing
  When it arises: Doing the right thing at the right time without effort
  Tag indicator words: "gather", "celebrate", "share", "connect"

Peace:
  Definition: Sufficiency, completion without striving, structural rest
  When it arises: Knowing the system can hold itself; settled
  Tag indicator words: "anchor", "secure", "complete", "settle", "rest"

Excitement:
  Definition: Forward edge, anticipation, creative momentum
  When it arises: Standing at the edge of something new with eagerness
  Tag indicator words: "launch", "begin", "prototype", "explore"
```

### Predicted vs Actual Pipeline

```
Design time:
  Owner tags milestone "Ship the Book" with predicted: [Triumph]
  
Player completes the milestone:
  Player submits report:
    Triumph: 5/5
    Poignance: 4/5  ← unexpected, also felt poignance
    
Aggregation:
  Predicted: [Triumph]
  Actual: [Triumph (5), Poignance (4)]
  
Alignment:
  - Predicted feelings present in actual: 100% (Triumph appeared)
  - Actual feelings beyond prediction: Poignance
  - Alignment score: HIGH (predicted feeling was felt strongly)
  - Surprise: Poignance was not predicted but appeared
```

### Campaign Feeling Profile

```
Campaign: MTGOA Organization
Predicted feelings across 8 milestones:
  Triumph:    5 milestones
  Poignance:  2 milestones
  Bliss:      3 milestones
  Peace:      2 milestones
  Excitement: 3 milestones

Owner's desired feelings: [Triumph, Poignance, Bliss, Peace, Excitement]
Coverage: 5/5 ✓

Actual feelings reported (after completions):
  Triumph:    18 reports, avg intensity 4.2
  Poignance:  6 reports, avg intensity 3.8
  Bliss:      9 reports, avg intensity 4.5
  Peace:      4 reports, avg intensity 3.9
  Excitement: 11 reports, avg intensity 4.1

Profile: campaign is producing all five feelings with sustained intensity.
```

## API Contracts

### Types

```typescript
type CompletionFeeling = 'Triumph' | 'Poignance' | 'Bliss' | 'Peace' | 'Excitement'

interface FeelingPrediction {
  feeling: CompletionFeeling
  expectedIntensity: number  // 1-5, owner's expectation
}

interface FeelingReport {
  id: string
  milestoneId: string
  playerId: string
  feeling: CompletionFeeling
  intensity: number  // 1-5
  note?: string      // optional player comment
  reportedAt: Date
}

interface MilestoneFeelingAlignment {
  milestoneId: string
  predictedFeelings: CompletionFeeling[]
  actualFeelingDistribution: Array<{
    feeling: CompletionFeeling
    reportCount: number
    avgIntensity: number
  }>
  alignmentScore: number     // 0-1, how well predictions matched
  surpriseFeelings: CompletionFeeling[]  // actual feelings not predicted
  missingFeelings: CompletionFeeling[]   // predicted but not reported
}

interface CampaignFeelingProfile {
  campaignRef: string
  predictedDistribution: Record<CompletionFeeling, number>  // count per feeling
  actualDistribution: Record<CompletionFeeling, {
    reportCount: number
    avgIntensity: number
  }>
  desiredFeelings: CompletionFeeling[]   // parsed from owner's interview answer
  coverageScore: number                  // 0-1, how well predictions cover desired feelings
}
```

### Setting Predictions

```typescript
// Set predicted feelings on a milestone (owner action)
action setMilestoneFeelings(input: {
  milestoneId: string
  predictedFeelings: FeelingPrediction[]
}): {
  milestone: CampaignMilestone  // updated
}

// Bulk set during campaign milestone setup
action setCampaignMilestoneFeelings(input: {
  campaignRef: string
  predictions: Array<{
    milestoneId: string
    predictedFeelings: FeelingPrediction[]
  }>
}): {
  updated: number
}
```

### Submitting Reports

```typescript
// Player submits feeling report after milestone completion
action submitFeelingReport(input: {
  milestoneId: string
  playerId: string
  feelings: Array<{
    feeling: CompletionFeeling
    intensity: number
    note?: string
  }>
}): {
  reports: FeelingReport[]
}

// Get player's own reports
action getPlayerFeelingReports(input: {
  playerId: string
  milestoneId?: string
}): {
  reports: FeelingReport[]
}
```

### Alignment & Profiles

```typescript
// Compute alignment for a single milestone
action computeMilestoneAlignment(input: {
  milestoneId: string
}): {
  alignment: MilestoneFeelingAlignment
}

// Compute campaign-level feeling profile
action computeCampaignFeelingProfile(input: {
  campaignRef: string
}): {
  profile: CampaignFeelingProfile
}

// Verify Q2 coverage: do predicted feelings cover the owner's desired feelings?
action verifyDesiredFeelingCoverage(input: {
  campaignRef: string
}): {
  desiredFeelings: CompletionFeeling[]
  coveredFeelings: CompletionFeeling[]
  uncoveredFeelings: CompletionFeeling[]
  coverageComplete: boolean
}
```

### Desired Feeling Parser

```typescript
// Parse owner's free-text desired feeling answer into feeling tags
// Used during campaign interview to translate "I want to feel triumph and peace"
// into structured tags
action parseDesiredFeelings(input: {
  freeText: string
}): {
  feelings: CompletionFeeling[]
  unmatched: string[]  // words that didn't map to a feeling
  confidence: 'high' | 'medium' | 'low'
}
```

## User Stories

### P0 — Predictions

**MF-1**: As a campaign owner, I can tag each milestone with predicted completion feelings, so I declare what satisfaction the work should produce.

*Acceptance*: `setMilestoneFeelings` accepts an array of feeling tags with expected intensity. Stored on milestone. Visible in milestone view.

**MF-2**: As a campaign owner during the interview, my free-text desired feelings are parsed into structured feeling tags, so the system can verify coverage.

*Acceptance*: `parseDesiredFeelings` matches keywords from the five-feeling vocabulary. Returns matched feelings and unmatched words. Owner can override.

**MF-3**: As a campaign owner setting up milestones, I am warned if any milestone has zero predicted feelings, so no milestone produces work without satisfaction.

*Acceptance*: Validation runs on milestone definition. Empty `predictedFeelings` triggers a soft warning (not a block).

### P1 — Reports

**MF-4**: As a player completing a milestone, I can report which feelings I actually experienced, with intensity, so the system learns whether predictions matched reality.

*Acceptance*: `submitFeelingReport` accepts multiple feelings with 1-5 intensity. Optional note. Reports are immutable after submission.

**MF-5**: As a player, my feeling reports are private to me unless I'm part of a campaign — then the campaign owner sees aggregated (anonymized) data.

*Acceptance*: Owner queries return aggregated counts and averages, not individual report details.

### P2 — Alignment

**MF-6**: As a campaign owner, I can see alignment between predictions and actual reports for each milestone, so I learn which milestones consistently deliver their promised feelings.

*Acceptance*: `computeMilestoneAlignment` returns alignment score, surprise feelings (unexpected positives), and missing feelings (predicted but not reported).

**MF-7**: As a campaign owner, I see the overall feeling profile of my campaign, so I know whether the campaign is producing all five feelings I designed for.

*Acceptance*: `computeCampaignFeelingProfile` returns predicted and actual distributions across all milestones. Available in campaign dashboard.

### P3 — Q2 Verification

**MF-8**: As a campaign owner, the system verifies that my milestones collectively cover all the feelings I said I wanted in the Q2 interview, so no desired feeling is left without a milestone.

*Acceptance*: `verifyDesiredFeelingCoverage` returns covered/uncovered desired feelings. Uncovered feelings appear as a soft warning in campaign setup.

**MF-9**: As a campaign owner, I can revise milestone predictions or add new milestones to cover gaps, so the verification check is actionable, not punishing.

*Acceptance*: Verification result links to milestone editor. Owner can update predictions or create new milestones to fill gaps.

## Functional Requirements

### Phase 1 — Predictions on Milestones

- **FR1**: Add `predictedFeelings` field to `CampaignMilestone` (array of feeling + intensity)
- **FR2**: Implement `setMilestoneFeelings` server action
- **FR3**: Implement `setCampaignMilestoneFeelings` for bulk updates
- **FR4**: Add validation warning for milestones with empty `predictedFeelings`
- **FR5**: Display predicted feelings in milestone view

### Phase 2 — Player Reports

- **FR6**: Add `FeelingReport` model
- **FR7**: Implement `submitFeelingReport` server action
- **FR8**: Implement `getPlayerFeelingReports` (private to player)
- **FR9**: Add report submission UI to milestone completion flow
- **FR10**: Enforce immutability of submitted reports

### Phase 3 — Alignment & Profiles

- **FR11**: Implement `computeMilestoneAlignment` with surprise/missing detection
- **FR12**: Implement `computeCampaignFeelingProfile` with distributions
- **FR13**: Build alignment display in milestone view (owner)
- **FR14**: Build campaign feeling profile in campaign dashboard

### Phase 4 — Q2 Verification

- **FR15**: Implement `parseDesiredFeelings` with keyword matching
- **FR16**: Store parsed feelings on campaign during interview
- **FR17**: Implement `verifyDesiredFeelingCoverage`
- **FR18**: Display coverage warnings in campaign setup
- **FR19**: Link uncovered feelings to milestone editor for resolution

## Non-Functional Requirements

- **NFR1**: Feeling reports are immutable
- **NFR2**: Player reports are private; only aggregated data visible to owner
- **NFR3**: Alignment computation is read-time, not stored
- **NFR4**: Parsing is deterministic — same input string yields same parsed feelings
- **NFR5**: The five-feeling vocabulary is hardcoded — adding feelings requires a code change

## Persisted Data & Prisma

When schema changes are implemented:
- [ ] Create migration: `npx prisma migrate dev --name add_milestone_completion_feelings`
- [ ] Commit `prisma/migrations/…` with `schema.prisma`
- [ ] Run `npm run db:sync` and `npm run check`
- [ ] Human review of migration.sql

### Schema Changes

```prisma
model CampaignMilestone {
  // ... existing lifecycle + sustainability fields ...
  predictedFeelings  Json?    // Array of {feeling, expectedIntensity}
  feelingReports     FeelingReport[]
}

model CampaignInstance {
  // ... existing lifecycle fields ...
  parsedDesiredFeelings  String[]  // CompletionFeeling values from interview
}

model FeelingReport {
  id            String   @id @default(cuid())
  milestoneId   String
  playerId      String
  feeling       String   // CompletionFeeling
  intensity     Int      // 1-5
  note          String?
  reportedAt    DateTime @default(now())
  
  milestone     CampaignMilestone @relation(fields: [milestoneId], references: [id])
  
  @@index([milestoneId])
  @@index([playerId, milestoneId])
}
```

## Dependencies

- [campaign-lifecycle](../campaign-lifecycle/spec.md) — parent spec; the interview's `desiredFeeling` field is parsed into structured feelings here
- [campaign-level-metrics](../campaign-level-metrics/spec.md) — sibling spec; feeling profiles can be exposed as metrics
- [milestone-sustainability-support](../milestone-sustainability-support/spec.md) — sibling spec; drain types are the inverse of completion feelings (what NOT to feel)

## References

- `src/lib/campaign/types.ts` — campaign + milestone types
- `.specify/specs/campaign-lifecycle/spec.md` — parent spec
- `src/lib/quest-grammar/types.ts` — emotional vector types (the alchemy element system, distinct from this feeling vocabulary)
