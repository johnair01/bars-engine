# Plan: Campaign Recursive Nesting

## Overview

Implement campaign nesting in four phases: ancestry primitives, rollup system, mid-level composting integration, and spatial hub differentiation. Each phase is independently shippable and builds on the campaign-lifecycle spec.

## Phase 1 — Nesting Primitives + Ancestry

**Goal**: Campaigns can be bound to parent spokes. Ancestry chains are resolvable. Validation prevents circular references.

### Steps

1. **Schema migration**: Add `parentCampaignRef`, `parentSpokeIndex`, `previousParentRef`, `previousParentSpokeIdx`, `detachedAt`, `detachReason`, `isOrphaned` to campaign instance
2. **Ancestry resolver**: Implement `getCampaignAncestry` — walks parent chain, O(depth) queries, handles missing parents (orphan detection)
3. **Descendants resolver**: Implement `getCampaignDescendants` — DFS with depth limit (default 5, max 10)
4. **Spoke type resolver**: Implement `getSpokeType` — checks if any campaign has this `(parentCampaignRef, parentSpokeIndex)` binding
5. **Validation**: Implement `validateParentBinding` — circular reference check via ancestry walk, depth limit enforcement
6. **Tests**: Ancestry chains at depths 0-5, circular reference detection, orphan detection, descendants traversal

### Key Decisions
- Depth is computed at read time, not stored. Avoids cascade updates when tree shape changes.
- Ancestry queries use a per-request cache (in-memory map keyed by campaignRef).
- Circular reference check walks the proposed parent's ancestry looking for the child's ref.

### Files
- `prisma/schema.prisma` — model changes
- `src/actions/campaign-nesting.ts` — new server actions
- `src/lib/campaign/nesting.ts` — ancestry/descendants/validation logic
- `src/lib/campaign/nesting-cache.ts` — per-request ancestry cache

## Phase 2 — Rollup System

**Goal**: Sub-hub completion contributes to parent spoke progress via configurable rollup rules.

### Steps

1. **Schema migration**: Add `SpokeRollupRule` model
2. **Rule definition**: Implement `defineSpokeRollupRule` — accepts contributing milestones, weights, aggregation function, threshold
3. **Rollup computation**: Implement `computeSpokeRollup` — read-time aggregation across child milestones
4. **Aggregation functions**: Implement `sum`, `average`, `min`, `weighted-average` as pure functions
5. **Hub rendering integration**: Update campaign hub UI to call `computeSpokeRollup` for sub-hub spokes and display result alongside leaf spoke milestones
6. **Tests**: Each aggregation function with known inputs, threshold detection, missing rule handling

### Key Decisions
- Rollup is read-time computation, not write-time cascade. Avoids cascade storms.
- Per-request cache for rollup results. Invalidated only on child state change events.
- Aggregation functions are pure and individually testable.
- Sub-hub spokes without a rollup rule fall back to "is the child campaign in COMPLETED state?" as a binary signal.

### Files
- `prisma/schema.prisma` — SpokeRollupRule model
- `src/actions/campaign-nesting.ts` — extend with rollup actions
- `src/lib/campaign/rollup.ts` — aggregation functions + rollup computation
- `src/components/campaign-hub/SubHubSpokeProgress.tsx` — UI for sub-hub progress display

## Phase 3 — Mid-Level Composting Integration

**Goal**: When a parent campaign composts, children are notified and their owners choose what happens.

### Steps

1. **Extend lifecycle compostCampaign**: When a campaign enters COMPOSTING, enumerate child campaigns and prepare notifications
2. **Implement `handleParentComposting`**: Each child owner can choose `spin-off`, `orphan`, or `cascade-compost`
3. **Spin-off behavior**: Clear `parentCampaignRef`, populate `previousParentRef`, set `detachedAt`, child stays ACTIVE
4. **Orphan behavior**: Clear `parentCampaignRef`, populate `previousParentRef`, set `isOrphaned: true`, prompt owner at next access
5. **Cascade-compost behavior**: Child also enters COMPOSTING, recurse for grandchildren
6. **Implement `adoptOrphanedCampaign`**: Owner clears orphaned state, becomes top-level
7. **Orphan detection on load**: Every campaign load checks if `parentCampaignRef` is still valid; sets `isOrphaned` if parent missing
8. **Tests**: 3-level composting with all three child choices, orphan detection, adoption flow

### Key Decisions
- Cascade-compost is recursive but never exceeds the depth limit (10). At depth 10, hard stop (orphan instead).
- Orphan detection runs on read, not write. Stale `isOrphaned` flags are corrected on next load.
- Default for child owner non-response is `orphan` (preserves work, requires later adoption).

### Files
- `src/lib/campaign/composting-cascade.ts` — multi-level composting logic
- `src/actions/campaign-nesting.ts` — extend with composting actions
- `src/lib/campaign/orphan-detection.ts` — load-time orphan check

## Phase 4 — Spatial Hub Differentiation

**Goal**: Spatial campaign hubs visually distinguish leaf spokes from sub-hub spokes. Navigation behavior differs.

### Steps

1. **Update portal types**: Distinguish `leaf_spoke_portal` from `sub_hub_spoke_portal` in spatial anchor types
2. **Sub-hub portal renderer**: Visual variant — different sprite/border/effect
3. **Portal click handler**: Leaf → existing CYOA spoke flow. Sub-hub → navigate to child campaign hub.
4. **Breadcrumb navigation**: Show ancestry chain in hub UI (e.g., "BB › MTGOA Org › MTGOA Book/Game")
5. **Back navigation**: From child hub, allow return to parent hub via breadcrumb
6. **Tests**: Portal type assignment, click routing, breadcrumb rendering

### Key Decisions
- Sub-hub portals are visually distinct but same anchor type at the data layer. Distinction is computed at render time via `getSpokeType`.
- Breadcrumb is always rendered when `depth > 0`.
- Back navigation does NOT auto-pop hub state — preserves player position in parent hub.

### Files
- `src/lib/spatial-world/octagon-campaign-hub.ts` — extend portal generation
- `src/components/campaign-hub/SubHubPortal.tsx` — sub-hub portal sprite/component
- `src/components/campaign-hub/AncestryBreadcrumb.tsx` — breadcrumb UI
- `src/app/campaign/hub/page.tsx` — wire breadcrumb + portal routing

## Verification

After each phase:
- `npm run build` — passes
- `npm run check` — passes
- Unit tests for ancestry, rollup, composting cascade
- Manual verification of MTGOA 3-level scenario as integration test

## Risk Notes

- **Performance at depth**: Ancestry queries are O(depth) but each level requires a DB read. At depth 10 that's 10 sequential reads. Mitigate via per-request cache.
- **Rollup cache invalidation**: If we cache rollup results too aggressively, parent progress can lag behind reality. Invalidation triggers must include child milestone updates.
- **Orphan storms**: If a high-level parent composts with many descendants, orphan detection on next load could be expensive. Consider batching the detection.
- **Migration of existing campaigns**: BB and existing instances have no `parentSpokeBinding`. Default null is safe (= top-level).
