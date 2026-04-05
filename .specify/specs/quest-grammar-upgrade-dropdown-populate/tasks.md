# Tasks: Quest Grammar Upgrade Dropdown Populate

## Phase 1: Server action

- [x] Create getAdminQuestsForUpgrade in admin.ts
- [x] Return shape: { success, quests?, error? }; never throw
- [x] Filter: type in ['quest','vibe'], status 'active'
- [x] Select: id, title, description, moveType, storyContent

## Phase 2: UI

- [x] UpgradeFromQuest: call getAdminQuestsForUpgrade
- [x] Add loading state; disable select, show "Loading…" in placeholder
- [x] Add error state; display error message when fetch fails
- [x] Add empty state: "No quests available. Create a quest first." with link when no error and no quests

## Verification

- [ ] Manual: admin → Upgrade from quest → dropdown populates
- [ ] Manual: auth failure → error shown
- [ ] Manual: no quests → empty state with link
- [ ] `npm run build` passes
