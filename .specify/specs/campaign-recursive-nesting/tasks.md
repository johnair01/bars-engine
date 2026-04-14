# Tasks: Campaign Recursive Nesting

## Phase 1 — Nesting Primitives + Ancestry

- [ ] **T1.1** Add nesting fields to campaign instance in `prisma/schema.prisma` (`parentCampaignRef`, `parentSpokeIndex`, `previousParentRef`, `previousParentSpokeIdx`, `detachedAt`, `detachReason`, `isOrphaned`)
- [ ] **T1.2** Create migration: `npx prisma migrate dev --name add_recursive_nesting`
- [ ] **T1.3** Run `npm run db:sync` and `npm run check`
- [ ] **T1.4** Implement `getCampaignAncestry` in `src/actions/campaign-nesting.ts` — chain walk with O(depth) queries
- [ ] **T1.5** Implement per-request ancestry cache in `src/lib/campaign/nesting-cache.ts`
- [ ] **T1.6** Implement `getCampaignDescendants` — DFS with depth limit
- [ ] **T1.7** Implement `getSpokeType` — leaf vs sub-hub determination
- [ ] **T1.8** Implement `validateParentBinding` — circular reference check, depth limit
- [ ] **T1.9** Update campaign creation flow to call `validateParentBinding` before persist
- [ ] **T1.10** Write tests for ancestry chains at depths 0–5
- [ ] **T1.11** Write tests for circular reference detection
- [ ] **T1.12** Write tests for descendants traversal with depth limit
- [ ] **T1.13** `npm run build` + `npm run check` pass

## Phase 2 — Rollup System

- [ ] **T2.1** Add `SpokeRollupRule` model to `prisma/schema.prisma`
- [ ] **T2.2** Create migration: `npx prisma migrate dev --name add_spoke_rollup_rules`
- [ ] **T2.3** Run `npm run db:sync` and `npm run check`
- [ ] **T2.4** Implement aggregation functions (`sum`, `average`, `min`, `weighted-average`) in `src/lib/campaign/rollup.ts`
- [ ] **T2.5** Implement `defineSpokeRollupRule` server action
- [ ] **T2.6** Implement `computeSpokeRollup` server action with read-time aggregation
- [ ] **T2.7** Implement fallback rollup for sub-hubs without explicit rule (binary completed/not-completed)
- [ ] **T2.8** Create `SubHubSpokeProgress` component for hub UI
- [ ] **T2.9** Wire sub-hub rollup display into existing campaign hub renderer
- [ ] **T2.10** Write tests for each aggregation function with known inputs
- [ ] **T2.11** Write tests for threshold detection
- [ ] **T2.12** Write tests for fallback behavior when rule is missing
- [ ] **T2.13** `npm run build` + `npm run check` pass

## Phase 3 — Mid-Level Composting Integration

- [ ] **T3.1** Extend lifecycle `compostCampaign` action to enumerate child campaigns
- [ ] **T3.2** Implement `handleParentComposting` action with three child choices
- [ ] **T3.3** Implement spin-off behavior (clear parent, populate previous parent, stay ACTIVE)
- [ ] **T3.4** Implement orphan behavior (clear parent, set isOrphaned, preserve previous parent)
- [ ] **T3.5** Implement cascade-compost behavior (recursive, respects depth limit)
- [ ] **T3.6** Implement `adoptOrphanedCampaign` action
- [ ] **T3.7** Implement orphan detection on campaign load in `src/lib/campaign/orphan-detection.ts`
- [ ] **T3.8** Add UI affordance in campaign view for orphaned campaign owner to adopt or re-bind
- [ ] **T3.9** Write tests for 3-level composting cascade with all three child choices
- [ ] **T3.10** Write tests for orphan detection
- [ ] **T3.11** Write tests for adoption flow
- [ ] **T3.12** `npm run build` + `npm run check` pass

## Phase 4 — Spatial Hub Differentiation

- [ ] **T4.1** Add `sub_hub_spoke_portal` portal type to spatial anchor types
- [ ] **T4.2** Update `octagon-campaign-hub.ts` to determine portal type via `getSpokeType` at build time
- [ ] **T4.3** Create `SubHubPortal` sprite/component with distinct visual style
- [ ] **T4.4** Update portal click handler routing: leaf → CYOA spoke, sub-hub → child hub
- [ ] **T4.5** Create `AncestryBreadcrumb` component
- [ ] **T4.6** Wire breadcrumb into campaign hub page when `depth > 0`
- [ ] **T4.7** Implement back navigation from child hub via breadcrumb
- [ ] **T4.8** Write tests for portal type assignment
- [ ] **T4.9** Write tests for click routing
- [ ] **T4.10** Manual verification: navigate full MTGOA 3-level tree
- [ ] **T4.11** `npm run build` + `npm run check` pass
