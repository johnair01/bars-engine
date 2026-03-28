# Prompt: Campaign hub spatial map (HSM)

Implement per [.specify/specs/campaign-hub-spatial-map/spec.md](../specs/campaign-hub-spatial-map/spec.md), [plan.md](../specs/campaign-hub-spatial-map/plan.md), and [tasks.md](../specs/campaign-hub-spatial-map/tasks.md).

## Goal

Make `/campaign/hub` feel like a **single room** (forest clearing) with **eight portals** into spokes — **UI + wayfinding** only; keep [CHS](../specs/campaign-hub-spoke-landing-architecture/spec.md) behavior for CYOA gates and `ref`.

## Must read

- `UI_COVENANT.md`, `src/styles/cultivation-cards.css`, `src/lib/ui/card-tokens.ts`
- Current hub implementation (discover in `plan.md` audit task)

## Done when

- Tasks **HSM-1**–**HSM-6** checked; verification quest in spec; `npm run check` + `npm run build` pass.
