# Tasks: Narrative OS Map v0

Checklist for [spec.md](./spec.md) and [plan.md](./plan.md).

## Analysis / spec kit (complete)

- [x] Ontology documented (spaces vs WCGS vs top nav) in spec.md
- [x] Infrastructure inventory in plan.md
- [x] SIX_FACE_ANALYSIS.md authored
- [x] API endpoints tagged v0 / mock / defer in plan.md

## Implementation (future — not all required to close spec kit)

### Phase 1 (shipped)

- [x] Add `src/lib/narrative-os/types.ts` (SpaceId, WorldMapSpaceSummary, WorldMapState, CampaignOverlay)
- [x] `baseline-map.ts` + `world-map.ts` builders (`buildWorldMapPayload`, `buildWorldMapState`)
- [x] Implement `GET /api/world/map` and `GET /api/world/map/state` (minimal JSON)
- [x] Refactor [`src/app/game-map/page.tsx`](../../../src/app/game-map/page.tsx) to space-first four regions + deep links + optional move tags
- [x] Baseline starter links per space (config module)
- [x] Unit test `src/lib/narrative-os/__tests__/world-map.test.ts`

### Phase 2 (shipped)

- [x] UI primitives: [`SpaceCard`](../../../src/components/narrative-os/SpaceCard.tsx), [`NarrativeHeader`](../../../src/components/narrative-os/NarrativeHeader.tsx), [`OverlayBadge`](../../../src/components/narrative-os/OverlayBadge.tsx) (stub for future overlays)
- [x] Space home APIs: `GET /api/library/home`, `/api/dojo/home`, `/api/forest/home`, `/api/forge/home` → [`getSpaceHomePayload`](../../../src/lib/narrative-os/space-home.ts)
- [x] Routes [`/narrative/[space]`](../../../src/app/narrative/[space]/page.tsx) (library | dojo | forest | forge); game-map anchors `#space-{id}` + “Space home →” links
### Phase 3 (shipped)

- [x] Deterministic spine in [`transitions.ts`](../../../src/lib/narrative-os/transitions.ts) — `BASELINE_LOOP_HINTS`, `getDefaultRecommendedTransitions()`, `resolveMapTransition()`
- [x] [`POST /api/world/map/transition`](../../../src/app/api/world/map/transition/route.ts) — JSON body `fromSpace`, `toSpace`, optional `reason` / `context`; **422** when not on spine; **200** forward / return / stay
- [x] [`world-map.ts`](../../../src/lib/narrative-os/world-map.ts) uses shared transition data (no duplicate arrays)
- [x] Unit test [`transitions.test.ts`](../../../src/lib/narrative-os/__tests__/transitions.test.ts)

- [ ] Campaign overlay: `GET /api/campaigns/:id/overlays` + one `POST .../seed/:space` mock (Phase 4)
- [ ] Prove AC7 baseline loop in manual test notes (or automated smoke script)
- [ ] `npm run check` + smoke relevant routes
