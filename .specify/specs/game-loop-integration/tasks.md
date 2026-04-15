# Tasks: Game Loop Integration

## Phase 1: Content + Wiring

- [x] **T1.1** Create `content/rules/game-loop.md` with 4-step loop, 4 moves table, Game Map link
- [x] **T1.2** Add `game-loop` to `VALID_SLUGS` in `src/app/wiki/rules/[slug]/page.tsx`
- [x] **T1.3** Add `game-loop` to `SLUG_TITLES` in `src/app/wiki/rules/[slug]/page.tsx`
- [x] **T1.4** Update GetStartedPane: add Game Loop card as first card; link to `/wiki/rules/game-loop`
- [x] **T1.5** Update RecentChargeSection: change Explore button label to "Explore → Extend to Quest"
- [x] **T1.6** Update CampaignModal: add copy "Campaign quests complete on the Gameboard" with link
- [x] **T1.7** Create verification quest `cert-game-loop-integration-v1` (Twine story + CustomBar + seed)
- [x] **T1.8** Run `npm run build` and `npm run check` — fail-fix

## Phase 2: Optional (Future)

- [ ] **T2.1** Implement `getGameLoopStatus(playerId)` Server Action in `src/actions/game-loop.ts`
- [ ] **T2.2** Use getGameLoopStatus in GetStartedPane for contextual "Next step"
- [ ] **T2.3** Update spec with Phase 2 completion

## Verification Checklist

- [ ] `/wiki/rules/game-loop` renders and shows 4-step loop
- [ ] GetStartedPane shows Game Loop card
- [ ] Recent Charge Explore button says "Explore → Extend to Quest"
- [ ] Campaign modal explains Gameboard completion
- [ ] Verification quest completes and mints vibeulons
