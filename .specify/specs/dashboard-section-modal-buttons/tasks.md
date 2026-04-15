# Tasks: Dashboard Section Modal Buttons

## Phase 1: Section modals

- [x] Create `ExploreModal` (Game Map, Request from Library, link to `/game-map`)
- [x] Create `CharacterModal` (Nation, Archetype, Roles, Story, link to `/campaign`)
- [x] Create `CampaignModal` (Campaign Stage, Gameboard, link to `/campaign/board`)
- [x] Each modal: Escape, click-outside to close; "View full page →" footer link

## Phase 2: Section buttons

- [x] Create `DashboardSectionButtons` client component (3 buttons + modal state)
- [x] Style section buttons (Explore, Character, Campaign) with distinct accents
- [x] Wire each button to open its modal

## Phase 3: Page integration

- [x] Replace current section layout in `page.tsx` with `DashboardSectionButtons`
- [x] Pass `player` (nation, archetype, roles) and `globalStage` to component
- [x] Verify Vibeulon counter unchanged

## Phase 4: Nested modals

- [x] Verify NationCardWithModal works inside CharacterModal
- [x] Verify ArchetypeCardWithModal works inside CharacterModal
- [x] Verify CampaignStageCard works inside CampaignModal
- [x] Verify LibraryRequestButton works inside ExploreModal

## Phase 5: Polish

- [x] Mobile-responsive layout
- [ ] Manual verification: all links and modals work correctly
