# Plan: Narrative OS Map v0

Implements [spec.md](./spec.md). API-first: contracts before UI polish; v0 proves shell + baseline loop + one overlay path.

---

## Reconciliation (summary)

- **Top nav** unchanged (Now / Vault / Events / Play).
- **Game Map** (`/game-map` or successor route) becomes **space-first**; WCGS tags optional on links.
- **Spaces ≠ moves** — see ontology table in spec.md.

---

## Infrastructure inventory: spaces → repo routes and modules

Use this table for deep links and adapter design. Paths are illustrative; adjust if routes move.

### Library (knowledge, lore, discovery)

| Kind | Location |
|------|----------|
| Wiki hub | [`src/app/wiki/page.tsx`](../../../src/app/wiki/page.tsx), subtree `wiki/*` |
| Library browse | [`src/app/library/page.tsx`](../../../src/app/library/page.tsx) |
| Docs | [`src/app/docs/page.tsx`](../../../src/app/docs/page.tsx), [`src/app/docs/[slug]/page.tsx`](../../../src/app/docs/[slug]/page.tsx) |
| API | [`src/app/api/library/search/route.ts`](../../../src/app/api/library/search/route.ts), [`src/app/api/library/requests/route.ts`](../../../src/app/api/library/requests/route.ts) |
| Actions | [`src/actions/library-discover.ts`](../../../src/actions/library-discover.ts), library-related actions in `src/actions/library.ts` |
| BAR / story | [`src/app/bar/[barId]/story/page.tsx`](../../../src/app/bar/[barId]/story/page.tsx), [`src/app/bars/`](../../../src/app/bars/) |

### Dojo (practice, moves, refinement)

| Kind | Location |
|------|----------|
| Hand moves | [`src/app/hand/moves/page.tsx`](../../../src/app/hand/moves/page.tsx) |
| Character creator | [`src/app/character-creator/page.tsx`](../../../src/app/character-creator/page.tsx), [`src/app/character/create/page.tsx`](../../../src/app/character/create/page.tsx) |
| Transformation registry | [`src/lib/transformation-move-registry/`](../../../src/lib/transformation-move-registry/) |
| Admin moves | [`src/app/admin/moves/page.tsx`](../../../src/app/admin/moves/page.tsx) |
| Quest unpack / practice | [`src/app/quest/[questId]/unpack/page.tsx`](../../../src/app/quest/[questId]/unpack/page.tsx) |

**Gap:** No dedicated `/dojo` route; v0 **composes** Dojo home from existing surfaces + new map entry points.

### Forest (encounters, quests, exploration, stakes)

| Kind | Location |
|------|----------|
| Adventures list | [`src/app/adventures/page.tsx`](../../../src/app/adventures/page.tsx) |
| Play hub | [`src/app/play/page.tsx`](../../../src/app/play/page.tsx) |
| Campaign CYOA | [`src/app/campaign/`](../../../src/app/campaign/), [`CampaignReader`](../../../src/app/campaign/components/CampaignReader.tsx) |
| Campaign hub / board | [`src/app/campaign/hub/page.tsx`](../../../src/app/campaign/hub/page.tsx), [`src/app/campaign/board/page.tsx`](../../../src/app/campaign/board/page.tsx) |
| Spatial world | [`src/app/world/page.tsx`](../../../src/app/world/page.tsx), [`src/app/world/[instanceSlug]/[roomSlug]/page.tsx`](../../../src/app/world/[instanceSlug]/[roomSlug]/page.tsx) |
| Map router | [`src/app/map/page.tsx`](../../../src/app/map/page.tsx) |
| API | [`src/app/api/adventures/`](../../../src/app/api/adventures/) |
| I Ching / portals | [`src/app/iching/page.tsx`](../../../src/app/iching/page.tsx) |

### Forge (charge, alchemy, shadow, daemons, integration artifacts)

| Kind | Location |
|------|----------|
| Capture | [`src/app/capture/page.tsx`](../../../src/app/capture/page.tsx) |
| Vault / hand | [`src/app/hand/page.tsx`](../../../src/app/hand/page.tsx), charges/drafts/compost |
| Shadow 321 | [`src/app/shadow/321/page.tsx`](../../../src/app/shadow/321/page.tsx) |
| Daemons | [`src/app/daemons/page.tsx`](../../../src/app/daemons/page.tsx), [`src/app/daemons/[id]/codex/page.tsx`](../../../src/app/daemons/[id]/codex/page.tsx) |
| Emotional first aid | [`src/app/emotional-first-aid/page.tsx`](../../../src/app/emotional-first-aid/page.tsx) |
| Admin forge API | [`src/app/api/admin/forge/`](../../../src/app/api/admin/forge/) |
| Narrative transformations | [`src/app/api/narrative-transformations/`](../../../src/app/api/narrative-transformations/) |

**Gap:** Player-facing “Forge” brand may overlap **Vault**; spec treats Forge as **processing / integration** entry points that can **link** into `/hand` without duplicating Vault ownership.

### World / map (cross-cutting)

| Kind | Location |
|------|----------|
| Game map (current) | [`src/app/game-map/page.tsx`](../../../src/app/game-map/page.tsx) — refactor to space-first |
| Guidance API | [`src/app/api/guidance/route.ts`](../../../src/app/api/guidance/route.ts) |
| Instance | [`src/actions/instance.ts`](../../../src/actions/instance.ts), `getActiveInstance` |

---

## API scaffold scope (download prompt → v0 decision)

Legend: **v0** = implement real handler (can return static/mock JSON first); **mock** = stub route returning fixtures; **defer** = document only or post-v0.

### Narrative OS / Game Map

| Endpoint | Scope | Notes |
|----------|-------|--------|
| `GET /api/world/map` | **v0** | Aggregate spaces, summaries, recommendations; may read from config + DB later. |
| `GET /api/world/map/state` | **v0** | Player progression across spaces; minimal fields OK. |
| `POST /api/world/map/transition` | **mock** | Log + return deterministic narrative token; optional persistence defer. |

### Library

| Endpoint | Scope | Notes |
|----------|-------|--------|
| `GET /api/library/home` | **v0** | Featured + starter entries; can compose existing search/actions. |
| `GET /api/library/search` | **defer** | Exists as [`/api/library/search`](../../../src/app/api/library/search/route.ts) — **extend** rather than duplicate; alias or document. |
| `GET /api/library/entries/:id` | **v0** | Thin wrapper over docs/BAR/wiki resolution. |
| `POST .../fork`, `.../annotate` | **defer** | Stub or defer unless fork/annotate already exists. |
| `GET /api/library/recommendations` | **mock** | Deterministic list for v0. |

### Dojo

| Endpoint | Scope | Notes |
|----------|-------|--------|
| `GET /api/dojo/home` | **v0** | Links + starter practice summary. |
| `GET/PATCH /api/dojo/moves` | **mock** | Tie to transformation registry when ready. |
| `GET /api/dojo/practice-encounters` | **defer** | Or mock one encounter id. |
| `POST .../start`, practice-sessions | **defer** | |
| `GET /api/dojo/skill-tree` | **defer** | |
| `GET /api/dojo/recommendations` | **mock** | |

### Forest

| Endpoint | Scope | Notes |
|----------|-------|--------|
| `GET /api/forest/home` | **v0** | Aggregates adventures + optional instance context. |
| `GET /api/forest/encounters` | **mock** | |
| `GET/POST .../encounters/:id/*` | **defer** | |
| `GET /api/forest/quests` | **v0** | Compose existing quest list sources where possible. |
| `POST .../quests/:id/accept|resolve` | **defer** | Use existing quest actions if wired. |
| `GET /api/forest/recommendations` | **mock** | |

### Forge

| Endpoint | Scope | Notes |
|----------|-------|--------|
| `GET /api/forge/home` | **v0** | Pointers to capture, 321, hand. |
| `POST /api/forge/wave`, `three-two-one` | **defer** | Prefer linking to existing flows first. |
| `POST/PATCH /api/forge/seeds` | **defer** | Align with existing seed/daemon models if present. |
| `GET/POST .../daemons`, `talismans` | **defer** | |
| `GET /api/forge/recommendations` | **mock** | |

### Campaign seeding

| Endpoint | Scope | Notes |
|----------|-------|--------|
| `POST /api/campaigns/:campaignId/seed/(library|dojo|forest|forge)` | **mock** | One campaign id + one space proven; rest defer. |
| `GET /api/campaigns/:campaignId/overlays` | **v0** | Static or DB-backed list when model exists. |

---

## Phased implementation

### Phase 1 — Domain + world API + shell

- Add `src/lib/narrative-os/` types (SpaceId, summaries, WorldMapState, overlay type).
- Implement `GET /api/world/map`, `GET /api/world/map/state` (minimal).
- Game Map UI: four **SpaceCard** regions; deep link to existing routes per inventory.
- Baseline seed: config or JSON for “starter” CTA per space.

### Phase 2 — Space homes

- Routes: e.g. `/narrative/library`, `/narrative/dojo`, `/narrative/forest`, `/narrative/forge` **or** enhance `/game-map` only — **prefer** single `/game-map` + section anchors until IA stabilizes.
- `GET` space home APIs marked **v0** above.

### Phase 3 — Transitions + recommendations

- `POST /api/world/map/transition` (mock).
- Deterministic recommendation rules (Library → Dojo → Forest → Forge loop copy).

### Phase 4 — Campaign overlays

- Overlay model + `GET .../overlays` + one `POST .../seed/:space` mock path.
- UI: `OverlayBadge` on space cards when campaign active.

### Phase 5 — Polish

- Richer `WorldMapSpaceSummary` fields from real metrics.
- Instrumentation (optional).

---

## File impacts (expected)

- New: `src/lib/narrative-os/types.ts` (and optional `seed.ts`, `recommendations.ts`)
- New: `src/app/api/world/map/route.ts`, `map/state/route.ts`, `map/transition/route.ts`
- New: thin API routes for library/dojo/forest/forge **home** as needed under `src/app/api/`
- Modify: [`src/app/game-map/page.tsx`](../../../src/app/game-map/page.tsx) — space-first layout
- Optional: `src/components/narrative-os/*` — SpaceCard, OverlayBadge, NarrativeHeader
- Tests: `src/lib/narrative-os/__tests__/types.test.ts` (if logic added)

---

## Verification

- `npm run check` after code changes.
- Manual: unauthenticated/authenticated smoke per acceptance criteria in spec.md.
