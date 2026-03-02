# Tasks: Market Redesign for Launch

## Phase 1: Market = player-created only
- [ ] In `getMarketContent`, change `isSystem: isAdmin ? undefined : false` to `isSystem: false`
- [ ] Confirm graveyard still fetches separately (admin-only)
- [ ] Remove "System" badge from QuestCard (no system quests in Market)

## Phase 2: Filter UI
- [ ] Add `selectedDomains` state (string[])
- [ ] Add allyship domain pills to filter bar (use ALLYSHIP_DOMAINS)
- [ ] Filter `others` by `bar.allyshipDomain` when `selectedDomains.length > 0`
- [ ] Include `selectedDomains` in `handleClearAllFilters` and reset to []
- [ ] Empty state when no quests globally: "No commissions yet. Create one to get started." with link to create
- [ ] Empty state when filters return nothing: "No quests found" + Clear filters (already present; verify copy)
- [ ] Ensure touch targets min 44px for primary filter controls

## Phase 3: NavBar
- [ ] Replace conditional PLAY/▶ with `<span>PLAY</span>` on all breakpoints

## Phase 4: Verification quest
- [ ] Add cert-market-redesign-v1 to CERT_QUEST_IDS in seed-cyoa-certification-quests.ts
- [ ] Add Twine passages: open Market, confirm player-only; use filters; accept quest; check nav carrot
- [ ] Add FEEDBACK and END_SUCCESS passages
- [ ] Upsert TwineStory and CustomBar for cert-market-redesign-v1

## Verification
- [ ] Market shows only player-created quests (admins included)
- [ ] Domain, nation, archetype, search filters work; Clear all resets
- [ ] Empty states correct
- [ ] Nav shows "PLAY" on mobile and desktop
- [ ] npm run seed:cert:cyoa → cert-market-redesign-v1 appears
