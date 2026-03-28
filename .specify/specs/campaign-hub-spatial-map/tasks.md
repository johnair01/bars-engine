# Tasks: Campaign hub spatial map

Spec: [.specify/specs/campaign-hub-spatial-map/spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## Phase 1 — Spatial clearing + eight portals

- [x] **HSM-1** — Audit current `/campaign/hub` component tree; document spoke→link mapping and `campaignHubState` usage in `plan.md`.
- [x] **HSM-2** — Implement **forest clearing** layout + **eight portal** affordances (UI Covenant); remove or merge redundant list UI that duplicates portals.
- [x] **HSM-3** — Preserve **`ref`** and existing CHS navigation targets for every portal; spot-check BB instance.
- [x] **HSM-4** — Per-portal **status**: open vs locked (idx gate) + face badge from hub draw; no fabricated completion.
- [x] **HSM-5** — **A11y:** `aria-label` on portals; focus via `cultivation-card:focus-visible`; touch targets ≥44px on key links.
- [x] **HSM-6** — **`metadata.title`** on hub page = Campaign hub (overrides root Conclave).

## Phase 1b — Optional

- [ ] **HSM-7** — If product wants shareable spoke URLs: add ` /campaign/hub/spoke/[index] ` (or agreed pattern) that forwards into current CYOA entry without breaking CHS.

## Phase 2 — Walkable octagon (BB)

- [x] **HSM-8** — `octagon-campaign-hub.ts` tilemap + rim portal placement; unit test runner (`npx tsx src/lib/spatial-world/__tests__/octagon-campaign-hub.test.ts`).
- [x] **HSM-9** — `RoomCanvas` + `pixi-room`: `spoke_portal`, `portal.config.externalPath` / `targetInstanceSlug`+`targetRoomSlug`.
- [x] **HSM-10** — `spawn-resolver.ts` + world room page uses per-room spawn (roomIndex / tilemap centroid fallback).
- [x] **HSM-11** — `scripts/seed-bb-campaign-octagon-room.ts`; `scripts/patch-card-club-bb-portal-href.ts`; Card Club seed href → `/world/bruised-banana/bb-campaign-clearing`.
- [x] **HSM-12** — `/campaign/hub` redirects to spatial BB hub when `bb-campaign-clearing` exists.

## Verification

- [ ] Spec § Verification Quest (Phase 2 paths)
- [x] `npm run check` and `npm run build` on touched files

## Source feedback

- `.feedback/cert_feedback.jsonl` — `2026-03-27T20:35:32.143Z`, `Site signal (nav)`, `/campaign/hub?ref=bruised-banana`
