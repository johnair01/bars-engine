# Plan: Dashboard UI Feedback (March 2025)

## Overview

Address six areas of user feedback: (1) fix Game Map → Library 404/compile, (2) add Character page and fix Character modal link, (3) reorganize Campaign page with stage clarity, (4) make Get Started collapsible and dismissible, (5) truncate Journeys with "View all" link, (6) align all dashboard lists with 5-entry truncation pattern.

## Implementation Order

### 1. Fix Explore → Library (Phase 1)

- Run dev server; reproduce 404 or compile error on path: Dashboard → Explore → Game Map → Library.
- Identify root cause: missing route, import error, or redirect.
- Fix: ensure `/library` exists, compiles, and Game Map Library card links correctly.
- Verify: full path works in dev and prod.

### 2. Character page (Phase 2)

- Create `src/app/character/page.tsx`.
- Content: Nation, Archetype, Roles, Story (Begin the Journey), avatar. Reuse CharacterModal data shape.
- Update `CharacterModal.tsx`: change "View full page" href from `/campaign` to `/character`.
- Verify: Character button → modal → "View full page" → character page.

### 3. Campaign page reorganization (Phase 3)

- Identify Campaign "full page" target: `/campaign/board` or a dedicated campaign hub.
- Reorganize layout: stage first, with in-game explanation (Kotter stage meaning).
- De-emphasize Nation/Archetype: smaller cards, secondary placement.
- Add copy for Stage 2 (and other stages) explaining game context.
- Reference: `src/lib/kotter.ts` KOTTER_STAGES.

### 4. Get Started pane (Phase 4)

- Wrap Get Started section in collapsible component (e.g. details/summary or custom accordion).
- Add dismiss button; on click, set localStorage key (e.g. `dashboard_get_started_dismissed`).
- On page load, check key; if set, hide section.
- Add way to re-show: e.g. small "Show Get Started" link in footer or settings.

### 5. Journeys truncation (Phase 5)

- In `page.tsx` Journeys section: slice threads + packs to max 5 total (or define: 5 threads, then packs).
- If `threads.length + packs.length > 5`, render "View all Journeys →" link.
- Target: `/journeys` (create if needed) or `/hand` (if that already shows all threads).
- Verify: 6+ journeys → 5 shown + link.

### 6. Dashboard list audit (Phase 6)

- List all dashboard sections with variable-length lists: Journeys, Active Quests (already done), Available Quests, etc.
- Apply truncate + "View all" to any section that can exceed 5 entries.
- Ensure consistent pattern and link targets.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/character/page.tsx` | Create |
| `src/components/dashboard/CharacterModal.tsx` | Modify (href) |
| `src/app/page.tsx` | Modify (Get Started collapsible/dismissible; Journeys truncation) |
| `src/app/campaign/*` or campaign hub | Modify (reorganize; stage explanation) |
| `src/app/library/page.tsx` | Fix if compile/route issue |
| `src/app/journeys/page.tsx` | Create if needed |
| `src/components/GetStartedPane.tsx` | Create (collapsible, dismissible) or inline in page |

## Verification

1. Dashboard → Explore → Game Map → Library: no 404, compiles.
2. Character → "View full page" → `/character` shows character hub.
3. Campaign page: stage prominent, Stage 2 explained; Nation/Archetype secondary.
4. Get Started: collapses; dismisses; state persists.
5. Journeys: max 5 shown; "View all Journeys →" when >5.
6. All dashboard lists >5: truncate + link.
