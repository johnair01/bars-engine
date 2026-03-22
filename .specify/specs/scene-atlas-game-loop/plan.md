# Plan: Scene Atlas Game Loop

## Summary

Integrate **Scene Atlas** (personal throughput) and **I Ching** (collective / campaign throughput) into a **single navigable mental model** on dashboard + Hand, add optional **daily bind limit**, **campaign-scoped casting**, **north star** display, and **demo** stubs — implementing per [spec.md](./spec.md) tasks in order.

## Phases

### Phase 1 — IA + links (no schema)

1. Add **dashboard / home** section: two-lane layout or stacked blocks — **Personal** (Charge, Scene Atlas link, Hand) vs **Collective** (campaign CTA, I Ching when in instance context).
2. Add **Hand** block: link to `/creator-scene-deck` + one-line copy ([branding.ts](../../../src/lib/creator-scene-grid-deck/branding.ts) tagline).
3. Update **wiki** hub (optional): `/wiki/player-guides` blurb for “game loop” if a short page is added.

### Phase 2 — North star

4. Choose storage: `storyProgress.northStar` vs `Player` column — implement read/write on dashboard + optional profile edit.
5. Wire display string (default empty or from seed).

### Phase 3 — Daily limit (Scene Atlas)

6. Add counter (JSON on `Player` or `storyProgress`) + check in `bindSceneGridCardWithNewBar` / `scene-grid-deck.ts`.
7. UI: remaining uses on `SceneDeckClient` / bind form error message.

### Phase 4 — I Ching + campaign context

8. Extend cast action signature + pass from `DashboardCaster` / campaign surfaces when `instanceId` available.
9. Persist minimal context (follow-up task if DB table deferred).

### Phase 5 — Demos

10. Add `/play` or `/try` with 3 placeholder cards linking to flows (or 3 `QuestThread` demo entries + seed).
11. Link from dashboard “Try it” row.

## File impacts (anticipated)

| Area | Files |
|------|--------|
| Dashboard | `src/app/page.tsx`, or dedicated dashboard component |
| Hand | `src/app/hand/page.tsx` |
| Scene Atlas bind | `src/actions/scene-grid-deck.ts` |
| I Ching | `src/actions/cast-iching.ts`, `CastingRitual.tsx`, `DashboardCaster.tsx`, campaign route(s) |
| North star | `src/actions/*` player update, prisma if new column |
| Demos | `src/app/play/page.tsx` (new) or quest seed |

## Risks

- **Dashboard complexity:** Start with **links + copy** before heavy layout refactor.
- **Daily limit edge cases:** timezone, admin bypass, rebind same card — spec tasks clarify.
