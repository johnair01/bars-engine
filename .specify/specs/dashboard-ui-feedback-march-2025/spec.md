# Spec: Dashboard UI Feedback (March 2025)

## Purpose

Address user feedback on the dashboard, Explore flow, Character/Campaign modals, and list truncation. Fix broken routes, add missing pages, improve information hierarchy, and align list behavior (5-entry cap + "View all" link) across Journeys, Quests, and other dashboard sections.

**Problem**: Several UX issues surfaced from user testing: (1) Dashboard → Explore → Game Map → Library yields 404 or fails to compile; (2) Character modal "View full page" sends players to campaign onboarding instead of a character page; (3) Campaign page is disorganized with Nation/Archetype too prominent and Stage 2 meaning unclear; (4) Get Started pane cannot be collapsed or dismissed; (5) Journeys and other dashboard lists show all entries instead of capping at 5 with a "View all" link like Quests.

**Practice**: Deftness Development — spec kit first, API-first where applicable.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Character page | Create `/character` as the Character hub. Character modal "View full page" links there. |
| Campaign page hierarchy | De-emphasize Nation/Archetype; prioritize campaign stage and game context. Add in-game explanation of Stage 2 (Kotter). |
| Get Started pane | Collapsible (accordion) and dismissible. Persist dismiss state (e.g. localStorage or player preference). Not an orientation quest. |
| List truncation | Journeys, and any dashboard list with >5 entries: show first 5, then "View all →" link to dedicated page. Align with Active Quests pattern (→ /hand). |
| Game Map → Library | Investigate and fix 404/compile error. Ensure `/library` route works from Game Map. |

## Conceptual Model

| Section | Current | Target |
|---------|---------|--------|
| **Explore** | Game Map → Library (404/compile) | Game Map → Library works; Library compiles |
| **Character** | "View full page" → `/campaign` (onboarding) | "View full page" → `/character` (character hub) |
| **Campaign** | Nation/Archetype prominent; Stage 2 unclear | Stage + game context first; Nation/Archetype secondary; Stage 2 explained |
| **Get Started** | Always visible, not collapsible | Collapsible; dismissible; state persisted |
| **Journeys** | All threads/packs shown | Max 5; "View all Journeys →" to `/journeys` or equivalent |
| **Dashboard lists** | Inconsistent truncation | All lists >5 entries: truncate + link to full page |

## User Stories

### P1: Explore flow works

**As a player**, I want to go Dashboard → Explore → Game Map → Library without errors, so I can discover content.

**Acceptance**: No 404; no compile error in dev; Library page loads.

### P2: Character page exists

**As a player**, I want the Character button "View full page" to take me to my character profile, not campaign onboarding.

**Acceptance**: Character modal "View full page" links to `/character`; `/character` shows Nation, Archetype, Roles, Story link, avatar—character identity hub.

### P3: Campaign page clarity

**As a player**, I want the campaign page to prioritize what stage we're in and what that means in the game, with Nation/Archetype as supporting info.

**Acceptance**: Campaign page (or Campaign modal full page) shows stage prominently with in-game explanation; Nation/Archetype de-emphasized; "Stage 2" has contextual description (e.g. Kotter stage meaning).

### P4: Get Started collapsible and dismissible

**As a player**, I want to collapse or dismiss the Get Started pane when I don't need it, since it's not part of my orientation quest.

**Acceptance**: Get Started has collapse toggle; has dismiss button; dismiss state persisted across sessions.

### P5: Journeys truncation

**As a player**, I want Journeys to show up to 5 entries with a link to see all, like Active Quests.

**Acceptance**: Journeys section shows max 5 threads/packs; if more, "View all Journeys →" link to full page.

### P6: Dashboard list consistency

**As a player**, I want any dashboard section with many entries to show a preview (e.g. 5) and a link to the full list.

**Acceptance**: All dashboard lists that can exceed 5 entries follow the truncate + "View all" pattern.

## Functional Requirements

### Phase 1: Fix Explore → Library

- **FR1**: Investigate 404/compile error on Dashboard → Explore → Game Map → Library path.
- **FR2**: Fix route or module so `/library` loads from Game Map. Ensure dev server compiles.
- **FR3**: Verify Game Map Library card links to `/library` and works.

### Phase 2: Character page

- **FR4**: Create `/character` route. Content: Nation, Archetype, Roles, Story (Begin the Journey), avatar. Reuse data from Character modal.
- **FR5**: Update CharacterModal "View full page" link from `/campaign` to `/character`.

### Phase 3: Campaign page reorganization

- **FR6**: Reorganize Campaign page (or Campaign modal full-page target) so campaign stage is primary.
- **FR7**: Add in-game explanation for Stage 2 (and other Kotter stages): what it means in context of the game.
- **FR8**: De-emphasize Nation and Archetype (smaller, secondary placement).

### Phase 4: Get Started pane

- **FR9**: Make Get Started pane collapsible (accordion or similar).
- **FR10**: Add dismiss button. On dismiss, hide pane; persist state (localStorage key or player preference).
- **FR11**: Allow re-showing (e.g. settings or "Show Get Started" link somewhere).

### Phase 5: Journeys truncation

- **FR12**: Journeys section: show max 5 threads + packs combined (or 5 threads, 5 packs—define rule).
- **FR13**: If more than 5 total, add "View all Journeys →" link to `/journeys` or `/hand` (or appropriate page).
- **FR14**: Create `/journeys` page if it doesn't exist, or use existing page (e.g. `/hand` for quest threads).

### Phase 6: Dashboard list consistency

- **FR15**: Audit dashboard sections for lists that can exceed 5 entries.
- **FR16**: Apply truncate + "View all" pattern to each such section. Align with Active Quests pattern.

## Non-Functional Requirements

- No new API contracts for Phase 1–4; reuse existing data.
- Get Started dismiss: prefer localStorage for simplicity; optional DB-backed preference later.
- Mobile-responsive: collapsible/dismissible UX works on small viewports.

## Out of Scope

- Redesign of full Library page content.
- New character creation flow.
- Changing Kotter stage logic; only presentation and explanation.

## Dependencies

- [dashboard-section-modal-buttons](.specify/specs/dashboard-section-modal-buttons/spec.md) — CharacterModal, ExploreModal, CampaignModal
- [game-map-lobbies](.specify/specs/game-map-lobbies/spec.md) — Game Map, Library routing
- [dashboard-header-explore-character-campaign](.specify/specs/dashboard-header-explore-character-campaign/spec.md)
- src/app/page.tsx, src/app/library/page.tsx, src/app/campaign/page.tsx
- src/components/dashboard/CharacterModal.tsx

## References

- [src/app/page.tsx](../../../src/app/page.tsx) — dashboard, Get Started, Journeys, Active Quests
- [src/app/library/page.tsx](../../../src/app/library/page.tsx) — Library
- [src/app/game-map/page.tsx](../../../src/app/game-map/page.tsx) — Game Map, Library link
- [src/components/dashboard/CharacterModal.tsx](../../../src/components/dashboard/CharacterModal.tsx) — "View full page" → /campaign
- [src/lib/kotter.ts](../../../src/lib/kotter.ts) — KOTTER_STAGES for stage explanation
