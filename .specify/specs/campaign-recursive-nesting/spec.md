# Spec: Campaign Recursive Nesting — Hub-Spoke Beyond Two Levels

## Purpose

Define how campaigns nest as spokes within other campaigns to arbitrary depth. A spoke in one campaign can itself be a complete campaign hub with its own spokes, which can themselves contain campaigns, and so on. This is the structural backbone that allows MTGOA Organization (hub) to contain MTGOA Book/Game (spoke that is also a hub) to contain the 8 curriculum spokes (Answer the Call, Know Your Charge, etc.).

## Problem

The campaign-lifecycle spec introduces `parentSpokeBinding` as a single optional parent reference, but it does not fully specify:

- How milestone progress rolls up through 3+ levels of nesting
- What happens when a mid-level campaign composts while its parent is still active
- How clock types reconcile across nesting levels (e.g., time-bounded parent containing completion-bounded child)
- How ancestry resolution works at query time (performance, depth limits)
- How a spoke knows it has become a sub-hub vs. a leaf spoke
- What happens when a leaf campaign completes — does it cascade progress up?

Without this, the MTGOA architecture (3 levels) cannot be built reliably, and any future deeper nesting is undefined.

## Practice

Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Maximum nesting depth | Soft limit of 5 levels. Beyond that, system warns but does not block. Hard performance limit at 10. |
| Parent-child relationship | A campaign has at most one parent (the campaign whose spoke it occupies). Children are referenced via `parentSpokeBinding`. |
| Spoke type identification | A spoke is a sub-hub if a campaign exists with `parentSpokeBinding.parentCampaignRef = X AND parentSpokeIndex = Y`. Otherwise it's a leaf spoke. |
| Milestone rollup | Milestone progress flows UP one level at a time. Child campaign completion contributes to parent spoke's milestone. Rollup is computed, not stored — derived from child state on read. |
| Rollup contract | Each parent spoke that contains a sub-hub defines a rollup rule: which child milestones contribute, with what weight, and what threshold counts as "spoke complete." |
| Clock type reconciliation | Parent and child clock types are independent. A time-bounded parent does NOT force its sub-hub children to be time-bounded. When parent clock expires, children survive (see composting). |
| Mid-level composting | When a mid-level campaign composts, its children become "orphaned" hubs — they detach from the parent and become top-level campaigns. Their `parentSpokeBinding` is cleared, preserved in `previousParentBinding` for history. |
| Cascade completion | A leaf campaign completing does NOT auto-complete its parent. Parent completion is governed by parent's own milestone rules. Child completion is just one input. |
| Leaf vs sub-hub display | UI must distinguish leaf spokes (single CYOA + nursery) from sub-hub spokes (entry point to another campaign hub). The distinction is determined at render time by checking for child campaigns. |
| Ancestry caching | Computed ancestry chain is cached per request, not persisted. Refreshed on any campaign state change in the chain. |
| Circular reference prevention | A campaign cannot be a descendant of itself. Validation runs on parent assignment. |
| Cross-tree dependencies | Campaigns in different trees cannot share state. A spoke can only roll up to its direct parent. |

## Conceptual Model

| Dimension | In This Spec |
|-----------|-------------|
| **WHO** | Campaign owners at every level of the nesting tree |
| **WHAT** | Campaign trees, parent-child relationships, rollup rules |
| **WHERE** | Each campaign instance scoped by `campaignRef`; ancestry is the chain of parent references |
| **Energy** | BAR maturation flows up the tree as completion signal, never as raw BARs |
| **Personal throughput** | WAVE moves happen in the leaf spokes, where actual nursery beds exist |

### Nesting Topology

```
MTGOA Organization (depth 0, root)
  ├── Spoke 0: Articulate the Mission (LEAF)
  ├── Spoke 1: Build Founding Coalition (LEAF)
  ├── Spoke 2: Ship the Book (LEAF)
  ├── Spoke 3: Launch Tour & Card Deck (LEAF)
  ├── Spoke 4: Form the Nonprofit (LEAF)
  ├── Spoke 5: Launch First Chapter (LEAF)
  ├── Spoke 6: Scale Chapters & B2B (LEAF)
  └── Spoke 7: Annual Conference (LEAF)

  ── OR sub-hub variant ──

MTGOA Organization (depth 0, root)
  └── Spoke X: MTGOA Book/Game (SUB-HUB, depth 1)
        ├── Spoke 0: Answer the Call (LEAF)
        ├── Spoke 1: Know Your Charge (LEAF)
        └── ... (8 curriculum spokes)
```

```
Bruised Banana (depth 0, root, time-bounded)
  └── Spoke N: MTGOA Organization (SUB-HUB, depth 1, completion-bounded)
        └── Spoke X: MTGOA Book/Game (SUB-HUB, depth 2, completion-bounded)
              └── 8 curriculum spokes (LEAVES, depth 3)
```

Three levels of nesting. Mixed clock types. The lifecycle spec already handles each campaign independently — this spec defines how they relate.

### Milestone Rollup

```
Leaf spoke milestone (e.g., "Answer the Call")
  ↓ contributes to
Parent spoke "Mastery of Allyship Curriculum" milestone in MTGOA Book/Game
  ↓ contributes to
Parent spoke "MTGOA Book/Game spoke" milestone in MTGOA Organization
  ↓ contributes to
Parent spoke "MTGOA Organization spoke" milestone in Bruised Banana
```

Each rollup hop requires:
1. **Source**: Which child milestone(s) contribute
2. **Weight**: Each child contributes a normalized [0, 1] signal
3. **Threshold**: Parent spoke "completes" when aggregated signal ≥ threshold
4. **Aggregation function**: `sum`, `average`, `min`, or `weighted-average`

Rollup is **read-time computation**, not write-time cascading. This avoids cascade storms when many BARs mature at once.

### Mid-Level Composting Behavior

```
Before composting:
  BB (active) → MTGOA Org (active) → MTGOA Book/Game (active) → 8 leaves (active)

BB clock expires:
  BB → COMPOSTING
  
Owner chooses to spin off MTGOA Org as new hub:
  MTGOA Org.parentSpokeBinding = null
  MTGOA Org.previousParentBinding = { campaignRef: "bruised-banana", spokeIndex: N }
  MTGOA Org continues ACTIVE
  MTGOA Book/Game and 8 leaves are unchanged (still nested under MTGOA Org)

If owner does NOT spin off:
  MTGOA Org becomes "orphaned" — detached from BB but still active
  Owner is prompted at next access to either:
    (a) Adopt as top-level campaign
    (b) Compost MTGOA Org (cascading the choice down)
```

## API Contracts

### Ancestry Resolution

```typescript
// Get the full ancestry chain for a campaign (root → self)
action getCampaignAncestry(input: {
  campaignRef: string
}): {
  chain: Array<{
    campaignRef: string
    name: string
    depth: number
    spokeIndexInParent?: number  // null for root
    state: CampaignState
  }>
  depth: number  // depth of this campaign (0 = root)
  isOrphaned: boolean  // had a parent that was composted/cleared
}

// Get all descendants of a campaign (DFS, may be expensive)
action getCampaignDescendants(input: {
  campaignRef: string
  maxDepth?: number  // default 5
}): {
  descendants: Array<{
    campaignRef: string
    name: string
    depth: number  // relative to input campaign
    parentSpokeIndex: number
    state: CampaignState
  }>
  truncatedAt?: number  // if maxDepth was hit
}

// For a spoke index in a campaign, determine if it's a leaf or sub-hub
action getSpokeType(input: {
  campaignRef: string
  spokeIndex: number
}): {
  type: 'leaf' | 'sub-hub'
  childCampaignRef?: string  // present if sub-hub
}
```

### Rollup Contract

```typescript
interface SpokeRollupRule {
  parentCampaignRef: string
  parentSpokeIndex: number
  childCampaignRef: string
  contributingMilestones: Array<{
    milestoneId: string
    weight: number  // 0..1
  }>
  aggregation: 'sum' | 'average' | 'min' | 'weighted-average'
  threshold: number  // 0..1, when parent spoke is "complete"
}

// Compute current rollup signal from a sub-hub to its parent spoke
action computeSpokeRollup(input: {
  parentCampaignRef: string
  parentSpokeIndex: number
}): {
  childCampaignRef?: string  // null if leaf spoke
  rollupSignal?: number  // 0..1, null if leaf
  thresholdMet: boolean
  contributingMilestones?: Array<{
    milestoneId: string
    title: string
    progress: number
    weight: number
  }>
}

// Define a rollup rule when a sub-hub is bound to a parent spoke
action defineSpokeRollupRule(input: SpokeRollupRule): {
  rule: SpokeRollupRule
}
```

### Mid-Level Composting

```typescript
// When a parent campaign composts, this is called for each child sub-hub
action handleParentComposting(input: {
  childCampaignRef: string
  parentCampaignRef: string
  ownerChoice: 'spin-off' | 'orphan' | 'cascade-compost'
}): {
  newState: CampaignState
  childCampaign: CampaignInstance  // updated state
}

// Adopt an orphaned campaign as top-level
action adoptOrphanedCampaign(input: {
  campaignRef: string
}): {
  campaign: CampaignInstance  // parentSpokeBinding cleared, isOrphaned: false
}
```

### Validation

```typescript
// Prevent circular references when binding a campaign to a parent
action validateParentBinding(input: {
  campaignRef: string
  proposedParentRef: string
  proposedSpokeIndex: number
}): {
  valid: boolean
  reason?: 'circular-reference' | 'parent-not-found' | 'spoke-already-bound' | 'depth-exceeds-limit'
}
```

### Types

```typescript
// Extend CampaignInstance from lifecycle spec
interface CampaignInstance {
  // ... existing fields from lifecycle spec ...
  parentSpokeBinding?: {
    parentCampaignRef: string
    parentSpokeIndex: number
  }
  previousParentBinding?: {
    parentCampaignRef: string
    parentSpokeIndex: number
    detachedAt: Date
    reason: 'spin-off' | 'parent-composted' | 'manual-detach'
  }
  isOrphaned: boolean  // true if previousParentBinding set and current parent null
  depth: number  // computed: 0 if no parent, else parent.depth + 1
}
```

## User Stories

### P0 — Core Nesting

**RN-1**: As a campaign creator, I can bind my campaign as a spoke in another campaign, so my work nests within a larger context.

*Acceptance*: `parentSpokeBinding` can be set during creation or via update. Validation prevents circular references. Spoke index must be available (not already bound).

**RN-2**: As a player browsing a campaign hub, I can tell which spokes are leaf spokes (enter directly) and which are sub-hubs (enter another campaign), so navigation is unambiguous.

*Acceptance*: Hub renders sub-hub spokes with a visual indicator. Clicking a sub-hub spoke navigates to the child campaign hub, not directly into a CYOA.

**RN-3**: As a system, I can resolve a campaign's full ancestry chain efficiently, so progress rollup and breadcrumb navigation work at any depth.

*Acceptance*: `getCampaignAncestry` returns chain in O(depth) queries. Cached per request. Handles missing parents gracefully (orphaned state).

### P1 — Rollup

**RN-4**: As a campaign creator binding my sub-hub to a parent spoke, I can define which of my milestones contribute to the parent spoke's completion, so rollup is intentional, not automatic.

*Acceptance*: `defineSpokeRollupRule` accepts contributing milestones with weights. Aggregation function and threshold are configurable. Rule is stored and used by `computeSpokeRollup`.

**RN-5**: As a player viewing a parent campaign, I can see the rollup progress from sub-hub spokes alongside leaf spoke progress, so I understand overall campaign state.

*Acceptance*: Hub renders sub-hub spoke progress bars sourced from `computeSpokeRollup`. Visually distinct from leaf spoke progress.

### P2 — Mid-Level Composting

**RN-6**: As a campaign owner whose parent campaign is composting, I can choose what happens to my sub-hub: spin off as independent, accept orphaning, or cascade-compost.

*Acceptance*: Composting flow notifies child campaign owners. Each owner makes their choice. Defaults to orphan if owner doesn't respond within campaign-defined window.

**RN-7**: As a campaign owner with an orphaned campaign, I can adopt it as a top-level campaign or move it under a new parent, so orphaned campaigns aren't stuck.

*Acceptance*: `adoptOrphanedCampaign` clears `isOrphaned` flag. Campaign becomes top-level (depth 0). Can subsequently be re-bound to a different parent.

### P3 — Validation & Limits

**RN-8**: As a system, I prevent circular nesting (a campaign cannot be its own ancestor), so the tree stays acyclic.

*Acceptance*: `validateParentBinding` catches circular references. Returns explicit reason.

**RN-9**: As a system, I warn when nesting exceeds 5 levels and block at 10 levels, so trees stay manageable.

*Acceptance*: Depth check on parent binding. Soft warning at 5, hard block at 10. Reasons returned via validation result.

## Functional Requirements

### Phase 1 — Nesting Primitives + Ancestry

- **FR1**: Add `previousParentBinding`, `isOrphaned`, computed `depth` to campaign instance
- **FR2**: Implement `getCampaignAncestry` action (chain resolution)
- **FR3**: Implement `getCampaignDescendants` action (tree traversal with depth limit)
- **FR4**: Implement `getSpokeType` action (leaf vs sub-hub determination)
- **FR5**: Implement `validateParentBinding` action (circular reference + depth checks)
- **FR6**: Update campaign creation to validate parent binding before persist

### Phase 2 — Rollup System

- **FR7**: Add `SpokeRollupRule` model
- **FR8**: Implement `defineSpokeRollupRule` action
- **FR9**: Implement `computeSpokeRollup` action (read-time aggregation)
- **FR10**: Implement aggregation functions (`sum`, `average`, `min`, `weighted-average`)
- **FR11**: Update hub rendering to display rollup progress for sub-hub spokes

### Phase 3 — Mid-Level Composting Integration

- **FR12**: Implement `handleParentComposting` action (called by lifecycle compostCampaign for each child)
- **FR13**: Extend lifecycle `compostCampaign` to enumerate children and notify each
- **FR14**: Implement `adoptOrphanedCampaign` action
- **FR15**: Implement orphan detection on campaign load (set `isOrphaned` flag if parent missing)
- **FR16**: Add UI affordance for orphaned campaign owner to adopt or re-bind

### Phase 4 — Spatial Hub Differentiation

- **FR17**: Update spatial campaign hub renderer to distinguish leaf vs sub-hub portals visually
- **FR18**: Update portal click behavior: leaf → CYOA spoke, sub-hub → child campaign hub
- **FR19**: Implement breadcrumb navigation showing ancestry chain in hub UI

## Non-Functional Requirements

- **NFR1**: Ancestry resolution must be O(depth) — never O(tree size)
- **NFR2**: Rollup computation must be cached per request, invalidated only on relevant child state change
- **NFR3**: Circular reference validation must run before any parent binding write
- **NFR4**: Orphan detection must be safe to run on every campaign load (idempotent, fast)
- **NFR5**: Max practical depth: 10. Soft warning at 5.

## Persisted Data & Prisma

When schema changes are implemented:
- [ ] Create migration: `npx prisma migrate dev --name add_recursive_nesting`
- [ ] Commit `prisma/migrations/…` with `schema.prisma`
- [ ] Run `npm run db:sync` and `npm run check`
- [ ] Human review of migration.sql

### Schema Changes

```prisma
model CampaignInstance {
  // ... existing lifecycle fields ...
  
  parentCampaignRef       String?
  parentSpokeIndex        Int?
  previousParentRef       String?
  previousParentSpokeIdx  Int?
  detachedAt              DateTime?
  detachReason            String?
  isOrphaned              Boolean   @default(false)
  
  rollupRules             SpokeRollupRule[]  @relation("ChildRollups")
  parentRollupRules       SpokeRollupRule[]  @relation("ParentRollups")
}

model SpokeRollupRule {
  id                    String   @id @default(cuid())
  parentCampaignRef     String
  parentSpokeIndex      Int
  childCampaignRef      String
  contributingMilestones Json     // serialized array of {milestoneId, weight}
  aggregation           String    // 'sum'|'average'|'min'|'weighted-average'
  threshold             Float
  
  parent                CampaignInstance @relation("ParentRollups", ...)
  child                 CampaignInstance @relation("ChildRollups", ...)
  
  @@unique([parentCampaignRef, parentSpokeIndex])
}
```

## Dependencies

- [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md) — Instance vs Campaign vs Subcampaign vs `CampaignSlot` vs hub/spoke topology; initiative tree on `Campaign` complements this spec’s spoke-tree model
- [campaign-lifecycle](../campaign-lifecycle/spec.md) — parent spec defining campaign state, clock types, composting flow that this nesting spec extends

## References

- `src/lib/campaign-hub/types.ts` — existing campaign hub state types
- `src/lib/campaign-hub/hub-journey-state.ts` — hub journey persistence
- `src/lib/spatial-world/octagon-campaign-hub.ts` — spatial hub renderer (needs sub-hub portal variant)
- `.specify/specs/campaign-hub-spoke-landing-architecture/spec.md` — original hub-spoke architecture
- `.specify/specs/campaign-lifecycle/spec.md` — parent lifecycle spec
