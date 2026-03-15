# Plan: Dashboard Collapsible Sections

## Summary

Add collapsible headers to Active Quests and Journeys sections on the dashboard. Headers show counts; clicking toggles expanded/collapsed. Default state based on item count to keep busy dashboards calm.

## Implementation Order

### Phase 1: Active Quests & Journeys

1. **Create CollapsibleSection component** — Reusable client component: header (title + count + chevron), content slot, expanded state, count-based default.
2. **Wrap Active Quests** — Use CollapsibleSection; pass `activeBars.length`, default collapsed when >5.
3. **Wrap Journeys** — Use CollapsibleSection; pass `threads.length + packs.length`, default collapsed when >3.
4. **Accessibility** — aria-expanded, aria-controls, keyboard toggle (Enter/Space on header).

### Phase 2 (Optional)

5. **localStorage persistence** — Remember user's expand/collapse preference per section.
6. **Graveyard collapsible** — Apply same pattern when completed items exceed threshold.

## File Impacts

| Action | File |
|--------|------|
| Create | `src/components/dashboard/CollapsibleSection.tsx` — client component |
| Edit | `src/app/page.tsx` — wrap Active Quests and Journeys in CollapsibleSection |
| Create | `docs/UI_STYLE_GUIDE.md` — uncluttered-by-default principle (done) |

## Verification

- [ ] Active Quests section collapses/expands on header click
- [ ] Journeys section collapses/expands on header click
- [ ] Count badges visible in headers
- [ ] Default collapsed when count exceeds threshold
- [ ] Keyboard accessible
- [ ] `npm run build` passes
