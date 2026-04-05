# Dashboard Header: Explore, Character, Campaign

Implement the dashboard header reorganization per [.specify/specs/dashboard-header-explore-character-campaign/spec.md](../specs/dashboard-header-explore-character-campaign/spec.md).

## Summary

1. **Remove** Act 1/2 button
2. **Keep** Vibeulon counter (linked to `/wallet`)
3. **Reorganize** into three sections: **Explore**, **Character**, **Campaign**
4. **Campaign Stage** — standalone button; click opens modal with stage info + link to Story Clock
5. **Modals** — Nation, Archetype (and optionally Explore cards) open modals with vital facts + "View full page →"

## Key files

- `src/app/page.tsx` — dashboard header (lines ~400–470)
- `src/components/KotterGauge.tsx` — reuse data for Campaign Stage
- `src/lib/kotter.ts` — KOTTER_STAGES

## Tasks

See [.specify/specs/dashboard-header-explore-character-campaign/tasks.md](../specs/dashboard-header-explore-character-campaign/tasks.md).
