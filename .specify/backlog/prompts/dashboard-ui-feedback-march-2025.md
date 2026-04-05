# Dashboard UI Feedback (March 2025)

Implement the dashboard UI feedback spec per [.specify/specs/dashboard-ui-feedback-march-2025/spec.md](../specs/dashboard-ui-feedback-march-2025/spec.md).

## Summary

1. **Fix Explore → Library**: Dashboard → Explore → Game Map → Library yields 404 or doesn't compile. Investigate and fix.
2. **Character page**: Create `/character`; Character modal "View full page" should link there, not to `/campaign` (campaign onboarding).
3. **Campaign page**: Reorganize—stage primary, Nation/Archetype secondary; add in-game explanation for Stage 2 (Kotter).
4. **Get Started pane**: Make collapsible and dismissible; persist dismiss state (localStorage); not an orientation quest.
5. **Journeys**: If >5 entries, show first 5 + "View all Journeys →" link (like Active Quests → /hand).
6. **Dashboard lists**: Apply same truncation pattern to any section with >5 entries.

## Key files

- `src/app/page.tsx` — Get Started, Journeys, list truncation
- `src/app/character/page.tsx` — Create (character hub)
- `src/components/dashboard/CharacterModal.tsx` — Change "View full page" href to `/character`
- `src/app/library/page.tsx` — Fix if compile/route issue
- `src/app/campaign/*` — Reorganize; stage explanation
- `src/app/journeys/page.tsx` — Create if needed for "View all Journeys"

## Tasks

See [.specify/specs/dashboard-ui-feedback-march-2025/tasks.md](../specs/dashboard-ui-feedback-march-2025/tasks.md).
