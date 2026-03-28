# Spec: Campaign hub spatial map (“forest clearing” + eight portals)

**Status:** Spec kit — **Phase 1** (document-style hub UI) shipped; **Phase 2 walkable hub** shipped for Bruised Banana: `/world/bruised-banana/bb-campaign-clearing` — Pixi tilemap **octagon**, eight **`spoke_portal`** tiles + **Card Club** return via `portal` + `externalPath`. `/campaign/hub?ref=bruised-banana` **redirects** to that room when it exists in DB. Phase 1b optional spoke URLs still open.  
**Source:** Certification / site-signal pipeline — `.feedback/cert_feedback.jsonl` entry `2026-03-27T20:35:32.143Z`, `questId: system-feedback`, `passageName: Site signal (nav)`, page `/campaign/hub?ref=bruised-banana`.  
**Relates to:** [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) (CHS — hub → spoke → landing contract), [site-signal-nav-report](../site-signal-nav-report/spec.md), [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) (guided actions into hub), `UI_COVENANT.md` (visual language for “room” affordances).

## Purpose

Players experience the **campaign hub** as the **same interaction model as `/world/lobby/…` rooms**: **walkable tile grid**, avatar, tap / D-pad movement, **step-on portals** — not only a document page of links. For **Bruised Banana**, the primary surface is an **octagonal clearing** on the instance spatial map with **eight rim portals** (CHS spokes **0–7** → `/campaign/spoke/[index]?ref=…`) and **one portal back to Card Club** (`/world/lobby/card-club`). The Phase 1 **`CampaignHubView`** remains a **fallback** when the spatial room is absent (other `ref` values, or DB not seeded).

**Practice:** Deftness — **do not rewrite** CHS routing rules (hub → CYOA before landing, eight spokes, `ref` preservation) in this slice; change **presentation, wayfinding, and entry affordances** so the mental model matches the architecture already specified in CHS.

## Problem

- Hub is **functionally correct** but **does not telegraph** “you are in a collective room with eight paths.”
- Lack of **iconic / spatial** cues increases cognitive load and weakens **Show Up** ritual framing for Bruised Banana and future campaigns.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Scope** | **UI + navigation clarity** on hub (and closely related entry components). **No** change to spoke **business rules** (still CHS: CYOA gate, eight spokes, period hexagram mapping) unless a task explicitly requires a URL shape change. |
| **Metaphor** | **Forest clearing + eight portals** — one **anchored stage** (clearing) and **eight distinct portal affordances** (visual + label + state: available / in progress / locked if already represented in `campaignHubState`). |
| **Separate pages for spokes** | Each portal **navigates** into the **existing** spoke entry flow (today: adventure / CYOA start — **reuse** current links and `ref` query). If product wants **`/campaign/hub/spoke/[index]`**-style URLs for analytics and back-button clarity, treat as **Phase 1b** after visual v1 lands (see tasks). |
| **Room parity** | Align **density, iconography, and “you are here”** language with **lobby / card club** patterns where those surfaces exist — cite concrete components in `plan.md` during implementation (avoid inventing a third visual dialect). |
| **Accessibility** | Spatial layout must **not** rely on pointer-only discovery: portals have **focusable** controls, **readable** names (hexagram / spoke label + status), sufficient **contrast** per UI Covenant. |
| **Campaign generality** | **Phase 2** targets **Bruised Banana** first (slug `bruised-banana`, room `bb-campaign-clearing`). Other campaigns keep **Phase 1** hub or gain spatial rooms when seeded per instance. |
| **Cross-instance portals** | `portal` anchor `config` may set **`externalPath`** (`/world/…`) or **`targetInstanceSlug` + `targetRoomSlug`** for exits outside the current instance. |
| **New anchor type** | **`spoke_portal`** — `config`: `{ spokeIndex: 0..7, campaignRef }` → navigates to `/campaign/spoke/{index}?ref=…`. |

## Conceptual Model

| WHO | WHAT | WHERE |
|-----|------|--------|
| Player | Walks the **clearing** and **steps on** rim portals | `/world/{instance}/bb-campaign-clearing` (BB) or `/campaign/hub` (fallback) |
| System | **Tilemap + anchors** for octagon, spokes, return; optional **redirect** from `/campaign/hub` when spatial room exists | `RoomCanvas`, seed scripts |
| Steward | (Future) Tunes **skin** of clearing per campaign | Out of scope v1 unless zero-cost theming hook exists |

## API Contracts

**v1:** No new public API required. Hub continues to use existing server data for spoke list, adventure links, and `campaignHubState`.

- **Route Handler vs Action:** Unchanged; any prefetch or RSC data loading follows current hub implementation.

## User Stories

### P1 — Hub feels like a room

**As a** player entering the campaign hub, **I want** to recognize I am in a **single shared space** with **eight obvious exits**, **so that** I am not hunting through a flat list.

**Acceptance:** Visual layout presents **one** primary “clearing” region and **eight** portal tiles/buttons; each portal has a **clear label** tied to the spoke (index or hexagram name per existing data).

### P2 — Portals lead to spoke work

**As a** player, **I want** tapping a portal to take me into the **spoke journey** (CYOA entry) **without losing** `ref` / campaign context, **so that** I can test and play the same flows cert quests describe.

**Acceptance:** Navigation matches **current** CHS entry targets after click; `ref` preserved; no dead links on seeded BB instance.

## Functional Requirements

### Phase 1 — Spatial hub presentation

- **FR1:** Replace or substantially revise hub body layout to **forest clearing + eight portals** metaphor (exact visual system: UI Covenant + existing card/room primitives).
- **FR2:** **Eight** portal affordances, mapped **1:1** to spokes **0–7** (or equivalent ordering in code — document mapping in `plan.md`).
- **FR3:** Show **lightweight state** per portal when data exists (e.g. not started / in progress / completed) using existing `campaignHubState` or spoke progress fields — **degrade gracefully** if partial data.
- **FR4:** **Mobile:** clearing + portals usable without horizontal scroll trap; tap targets meet touch guidelines.

### Phase 2 — Walkable octagon hub (BB)

- **FR6:** **`MapRoom`** on Bruised Banana **`SpatialMap`**: octagonal walkable mask (exterior tiles **impassable**), **spawn** resolved per room (see `spawn-resolver.ts`).
- **FR7:** **Eight** `spoke_portal` anchors on the rim → `/campaign/spoke/{0..7}?ref=bruised-banana` (CHS unchanged).
- **FR8:** **One** `portal` with `config.externalPath: "/world/lobby/card-club"` — return to **Card Club**.
- **FR9:** Card Club **`campaign_portal`** targets **`/world/bruised-banana/bb-campaign-clearing`** (seed + `patch-card-club-bb-portal-href.ts` for existing DBs).
- **FR10:** **`/campaign/hub?ref=bruised-banana`** redirects to the spatial room when that `MapRoom` exists.

### Phase 1b — Optional URL clarity (if needed)

- **FR5:** Introduce **dedicated routes** per spoke **index** that **redirect or render** the same entry as today, for shareable URLs and back-button semantics — **only** if product confirms in implementation (otherwise defer).

### Non-goals (v1)

- **3D engine** or heavy animation that harms LCP.
- Replacing **I Ching draw** or **period** logic.
- **Multiplayer presence** avatars on the clearing (landing presence remains CHS future work).

## Persisted data & Prisma

**v1:** No schema change. Hub reads existing fields only.

| Check | Done |
|-------|------|
| Prisma / migration | N/A for v1 |

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Large hero assets | Prefer CSS + small SVG/icons; lazy-load any illustration |
| RSC payload | Keep spoke metadata selection minimal (same or tighter than current hub) |

## Verification Quest

1. Run `npx tsx scripts/seed-bruised-banana-world.ts` (spatial map) then `npx tsx scripts/seed-bb-campaign-octagon-room.ts`; if lobby already seeded without the new href, run `npx tsx scripts/patch-card-club-bb-portal-href.ts`.
2. Open `/world/bruised-banana/bb-campaign-clearing` — **walk**, **D-pad**, confirm **octagon** floor vs dark rim.
3. Step on **three** `spoke_portal` tiles — `/campaign/spoke/{n}` loads with **`ref=bruised-banana`**.
4. Step on **Card Club** portal — lands on `/world/lobby/card-club`.
5. From Card Club, **Bruised Banana Campaign** gold tile → back to **bb-campaign-clearing**.
6. Open `/campaign/hub?ref=bruised-banana` — should **redirect** to the spatial room when seeded.
7. (Optional) **Phase 1** fallback: remove octagon room from DB temporarily — hub page should render **`CampaignHubView`** again.

## References

- Feedback excerpt: *“As a portal page this should be a room players can show up to with a little icon like the lobby and card club room … generic forest clearing with 8 portals … separate page that is the spokes … goal is to make this page a spatial map.”*
- Code anchors: `src/lib/spatial-world/octagon-campaign-hub.ts`, `spawn-resolver.ts`, `src/app/world/.../RoomCanvas.tsx`, `pixi-room.ts`, `scripts/seed-bb-campaign-octagon-room.ts`, `scripts/patch-card-club-bb-portal-href.ts`, `src/app/campaign/hub/page.tsx` (redirect), Phase 1: `CampaignHubView.tsx`, `campaignHubState` / `get8PortalsForCampaign`.

## Changelog

| Date | |
|------|--|
| 2026-03-27 | Initial spec kit from site-signal (nav) feedback on `/campaign/hub`. |
| 2026-03-27 | Implemented: `zoneBackgroundStyle('lobby')`, wood clearing card, portal grid + `gmFaceToElement`, hub title metadata — aligned with `/lobby` and `/world/lobby` (Card Club / nation rooms). |
| 2026-03-27 | **Phase 2:** Walkable octagon `bb-campaign-clearing`, `spoke_portal` + `externalPath` portal, spawn resolver, hub redirect, Card Club href + patch script. |
