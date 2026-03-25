# Plan: Event crew surface

1. Add `EventCrewSurface` server component: filter `parentEventArtifactId != null`, map parent titles, sort by `startTime`.
2. Render on `src/app/event/page.tsx` after the main **Events on this campaign** section when `crew.length > 0`.
3. Reuse `formatEventScheduleRange`, `formatEventCapacityLine`, `EventGuestsPanel`, `EditEventScheduleButton` from existing event modules.

## Files

- `src/components/event/EventCrewSurface.tsx` (new)
- `src/app/event/page.tsx` (import + placement)
