# Plan: Campaign hub spatial map

Implement per [.specify/specs/campaign-hub-spatial-map/spec.md](./spec.md).

## Constraints

- **CHS is law** for spoke gating and adventure wiring — this slice is **presentation + navigation clarity** unless FR5 (optional routes) is approved.
- Read `UI_COVENANT.md` and reuse **cultivation-cards** / **card-tokens** patterns; Tailwind for layout only.

## Implementation audit (HSM-1) — landed 2026-03-27

| Piece | Location |
|--------|-----------|
| Hub page (RSC data) | [`src/app/campaign/hub/page.tsx`](../../../src/app/campaign/hub/page.tsx) — `get8PortalsForCampaign`, `getCampaignMilestoneGuidance`, `ref` → `campaignRef` on all child links |
| Hub UI | [`src/components/campaign/CampaignHubView.tsx`](../../../src/components/campaign/CampaignHubView.tsx) |
| Spoke entry | Unlocked spokes **0–1**: `Link` → **`/campaign/spoke/${idx}?ref=…`** (unchanged) |
| Landing skip | ` /campaign/landing?ref=…&spoke=…` (unchanged) |
| Lock rule | **idx > 1** locked (product gate until more spokes ship) |
| `campaignHubState` | Persisted draw in [`get8PortalsForCampaign`](../../../src/actions/campaign-portals.ts) — 8 `spokes` with `hexagramId`, `changingLines`, `primaryFace`; surfaced per portal as copy + **element** via [`gmFaceToElement`](../../../src/lib/campaign-hub/gm-face-element.ts) |
| Lobby / Card Club parity | **Zone:** [`zoneBackgroundStyle('lobby')`](../../../src/lib/ui/zone-surfaces.ts) — same tiled backdrop as [`/lobby`](../../../src/app/lobby/page.tsx) and [`/world/lobby/…`](../../../src/app/world/page.tsx) (nation room + trading floor / Card Club). **Cards:** `cultivation-card` + `elementCssVars` / `altitudeCssVars` from [`card-tokens.ts`](../../../src/lib/ui/card-tokens.ts) |
| Tab title | [`hub/page.tsx` `metadata.title`](../../../src/app/campaign/hub/page.tsx) = **Campaign hub** (overrides root **Conclave**) |

## Phase 2 — Walkable octagon (landed 2026-03-27)

| Piece | Location |
|--------|-----------|
| Octagon tilemap + anchors | [`src/lib/spatial-world/octagon-campaign-hub.ts`](../../../src/lib/spatial-world/octagon-campaign-hub.ts) |
| Per-room spawn | [`src/lib/spatial-world/spawn-resolver.ts`](../../../src/lib/spatial-world/spawn-resolver.ts), [`world/.../page.tsx`](../../../src/app/world/[instanceSlug]/[roomSlug]/page.tsx) |
| Navigation | [`RoomCanvas.tsx`](../../../src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx) — `spoke_portal`, `externalPath`, cross-instance |
| Pixi | [`pixi-room.ts`](../../../src/lib/spatial-world/pixi-room.ts) — colors, walkable, pointer |
| Seed / patch | [`scripts/seed-bb-campaign-octagon-room.ts`](../../../scripts/seed-bb-campaign-octagon-room.ts), [`patch-card-club-bb-portal-href.ts`](../../../scripts/patch-card-club-bb-portal-href.ts), [`seed-bar-lobby-world.ts`](../../../scripts/seed-bar-lobby-world.ts) |
| Hub redirect | [`campaign/hub/page.tsx`](../../../src/app/campaign/hub/page.tsx) |

## File impacts (edit as discovered)

| Area | Likely files |
|------|----------------|
| Hub page / layout | `src/app/campaign/hub/*`, hub-specific components under `src/components/campaign/` or `src/app/campaign/components/` |
| Styles | `src/styles/cultivation-cards.css`, tokens from `src/lib/ui/card-tokens.ts` |
| Tests | Optional Playwright or RTL snapshot for eight portals + a11y attributes |

## Implementation order

1. Layout shell: clearing container + responsive grid of eight portals.
2. Wire each portal to **existing** hrefs / click handlers (no behavior regression).
3. Status affordances from `campaignHubState` (if trivial); else stub “neutral” state with task to enrich.
4. A11y pass: `aria-label`, focus order, heading hierarchy.
5. Optional FR5: spoke sub-routes — only after P1 sign-off.

## Risks

- **Double navigation** if old list remains below new map — remove or collapse legacy list in same PR.
- **Title / documentTitle** still showing legacy “Conclave” (feedback mentioned) — verify `metadata` / layout title for hub route and fix if incorrect (may be separate one-line fix).
