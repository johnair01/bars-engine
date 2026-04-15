# Tasks: Dashboard Header — Explore, Character, Campaign

## Phase 1: Layout and removal

- [x] Remove Act 1/2 card from `src/app/page.tsx`
- [x] Add section labels: Explore, Character, Campaign
- [x] Group cards under sections:
  - [x] Explore: Game Map, Request from Library
  - [x] Character: Nation, Archetype, Roles, Story (Begin the Journey)
  - [x] Campaign: Campaign Stage (new), Gameboard
- [x] Verify Vibeulon counter links to `/wallet`

## Phase 2: Campaign Stage button

- [x] Create `CampaignStageModal` component (stage name, move, progress, link to `/story-clock`)
- [x] Create standalone Campaign Stage card (replaces KotterGauge in top row)
- [x] Wire Campaign Stage card to open modal on click
- [x] Remove or relocate KotterGauge from header (content moved to Campaign Stage)

## Phase 3: Section modals

- [x] Create `NationModal` (nation name, description, link to `/nation`)
- [x] Create `ArchetypeModal` (archetype name, primary move, link to `/archetype`)
- [x] Wire Nation card to open NationModal on click
- [x] Wire Archetype card to open ArchetypeModal on click
- [ ] (Optional) Add modals for Game Map, Request from Library

## Phase 4: Polish

- [x] Mobile-responsive layout (sections wrap/stack)
- [x] Modal accessibility (Escape, click-outside, focus trap)
- [ ] Manual verification: all links work, modals close correctly
