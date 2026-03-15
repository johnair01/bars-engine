# Spec Kit Prompt: Dashboard Collapsible Sections

## Role

You are a Spec Kit agent implementing collapsible Active Quests and Journeys sections on the dashboard to reduce clutter when user-generated content is abundant.

## Objective

Implement the Dashboard Collapsible Sections per [.specify/specs/dashboard-collapsible-sections/spec.md](../specs/dashboard-collapsible-sections/spec.md). Align with [docs/UI_STYLE_GUIDE.md](../../docs/UI_STYLE_GUIDE.md): keep the UI uncluttered even when user-generated content is abundant.

## Prompt

> Implement Dashboard Collapsible Sections per [.specify/specs/dashboard-collapsible-sections/spec.md](../specs/dashboard-collapsible-sections/spec.md). Create a reusable `CollapsibleSection` client component (header with title + count + chevron, toggle on click). Wrap Active Quests and Journeys sections on the dashboard. Default collapsed when Active Quests > 5 or Journeys > 3; otherwise expanded. Add `docs/UI_STYLE_GUIDE.md` with uncluttered-by-default principle if not present. Spec: [path].

## Requirements

- **Surfaces**: Dashboard (`src/app/page.tsx`) — Active Quests, Journeys
- **Component**: CollapsibleSection — title, count, defaultExpanded, children
- **Accessibility**: aria-expanded, aria-controls, keyboard toggle
- **Defaults**: Collapsed when count exceeds threshold; expanded otherwise

## Checklist

- [ ] Create `src/components/dashboard/CollapsibleSection.tsx`
- [ ] Wrap Active Quests in CollapsibleSection (count > 5 → collapsed)
- [ ] Wrap Journeys in CollapsibleSection (count > 3 → collapsed)
- [ ] Add count badges to headers
- [ ] Keyboard accessible
- [ ] `npm run build` passes

## Deliverables

- [ ] `src/components/dashboard/CollapsibleSection.tsx`
- [ ] `src/app/page.tsx` — wrapped sections
- [ ] `docs/UI_STYLE_GUIDE.md` — uncluttered principle (already created)

## References

- Spec: [.specify/specs/dashboard-collapsible-sections/spec.md](../specs/dashboard-collapsible-sections/spec.md)
- Plan: [.specify/specs/dashboard-collapsible-sections/plan.md](../specs/dashboard-collapsible-sections/plan.md)
- Tasks: [.specify/specs/dashboard-collapsible-sections/tasks.md](../specs/dashboard-collapsible-sections/tasks.md)
- UI Style Guide: [docs/UI_STYLE_GUIDE.md](../../docs/UI_STYLE_GUIDE.md)
