# Tasks: Dashboard Collapsible Sections

## Phase 1: Active Quests & Journeys

- [x] **1.1** Create `src/components/dashboard/CollapsibleSection.tsx` — client component with:
  - Props: `title`, `count`, `defaultExpanded` (or `defaultCollapsed`), `children`
  - Header: title + count badge + chevron (▼/▶)
  - Click handler toggles expanded state
  - aria-expanded, aria-controls, role="button" on header
- [x] **1.2** Wrap Active Quests section in `page.tsx` with CollapsibleSection:
  - `title="Active Quests"`, `count={activeBars.length}`
  - `defaultExpanded={activeBars.length <= 5}`
- [x] **1.3** Wrap Journeys section in `page.tsx` with CollapsibleSection:
  - `title="Journeys"`, `count={threads.filter(...).length + packs.length}` (active only)
  - `defaultExpanded={(threads + packs).length <= 3}`
- [ ] **1.4** Add keyboard support: Enter/Space on header triggers toggle
- [ ] **1.5** Add smooth expand/collapse transition (CSS max-height or similar)

## Phase 2 (Optional)

- [ ] **2.1** Persist expand/collapse state in localStorage per section key
- [ ] **2.2** Apply CollapsibleSection to Graveyard when completed items > N

## Verification

- [x] `npm run build` passes
- [ ] Manual: many quests → Active Quests collapsed by default
- [ ] Manual: few journeys → Journeys expanded by default
- [ ] Manual: click header toggles; count badge visible
