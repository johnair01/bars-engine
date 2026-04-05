# Tasks: Dashboard UI Feedback (March 2025)

## Phase 1: Fix Explore → Library

- [x] Reproduce 404/compile error on Dashboard → Explore → Game Map → Library
- [x] Identify root cause (route, import, redirect) — build passes; routes exist
- [x] Fix so `/library` loads from Game Map
- [x] Verify dev server compiles; path works end-to-end

## Phase 2: Character page

- [x] Create `src/app/character/page.tsx` (Nation, Archetype, Roles, Story, avatar)
- [x] Update CharacterModal "View full page" href from `/campaign` to `/character`
- [x] Verify Character → modal → "View full page" → character page

## Phase 3: Campaign page reorganization

- [x] Identify Campaign full-page target (board vs hub)
- [x] Reorganize: stage primary, Nation/Archetype secondary
- [x] Add in-game explanation for Stage 2 (and other Kotter stages)
- [x] De-emphasize Nation/Archetype in layout (compact prop on CampaignEntryBanner)

## Phase 4: Get Started pane

- [x] Make Get Started collapsible (accordion/details)
- [x] Add dismiss button; persist state (localStorage)
- [x] Add way to re-show Get Started
- [x] Verify: collapse, dismiss, persist, re-show

## Phase 5: Journeys truncation

- [x] Truncate Journeys to max 5 entries (threads + packs)
- [x] Add "View all Journeys →" link when >5
- [x] Create `/journeys` page
- [x] Verify: 6+ journeys → 5 shown + link

## Phase 6: Dashboard list consistency

- [x] Audit dashboard sections for lists >5
- [x] Apply truncate + "View all" to Journeys; Active Quests already had it
- [x] Align with Active Quests pattern

## Verification

- [x] Manual: full Explore → Library path
- [x] Manual: Character → character page
- [x] Manual: Campaign stage clarity
- [x] Manual: Get Started collapse/dismiss
- [x] Manual: Journeys truncation
- [x] `npm run build` passes
