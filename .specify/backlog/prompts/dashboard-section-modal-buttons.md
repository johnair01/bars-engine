# Dashboard Section Modal Buttons

Implement the section modal buttons per [.specify/specs/dashboard-section-modal-buttons/spec.md](../specs/dashboard-section-modal-buttons/spec.md).

## Summary

1. **Replace** the current section layout (labels + cards) with three primary buttons: **Explore**, **Character**, **Campaign**.
2. **Each button** opens a modal containing the existing action buttons for that section.
3. **Each modal** has a "View full page →" link: Explore → `/game-map`, Character → `/campaign`, Campaign → `/campaign/board?ref=bruised-banana`.
4. **Nested modals** (Nation, Archetype, Campaign Stage) continue to work when opened from within section modals.

## Key files

- `src/app/page.tsx` — replace section layout with DashboardSectionButtons
- `src/components/dashboard/` — create ExploreModal, CharacterModal, CampaignModal, DashboardSectionButtons
- Reuse: NationCardWithModal, ArchetypeCardWithModal, CampaignStageCard, LibraryRequestButton

## Tasks

See [.specify/specs/dashboard-section-modal-buttons/tasks.md](../specs/dashboard-section-modal-buttons/tasks.md).
