# Level 1 Orientation — Tasks

Implement per [LEVEL_1_ORIENTATION_PLAN.md](./LEVEL_1_ORIENTATION_PLAN.md).

## Phase 1: Unblock Nation + Archetype

- [ ] **T1.1** Change `Welcome to the Conclave` thread `status` from `deprecated` to `active` in `scripts/seed-onboarding-thread.ts`
- [ ] **T1.2** Verify Twine stories "Declare Your Nation", "Discover Your Archetype" exist and are published
- [ ] **T1.3** If missing, ensure skeleton stories are created by seed script (already in seed-onboarding-thread)
- [ ] **T1.4** Run `npx tsx scripts/seed-onboarding-thread.ts` and verify orientation thread is assigned to new players
- [ ] **T1.5** Test: new player (no nation/archetype) → dashboard → sees orientation thread with Nation quest

## Phase 2: Campaign Orientation

- [ ] **T2.1** Add `completeCampaignOrientation` to `CompletionEffect` type and `processCompletionEffects` in quest-engine
- [ ] **T2.2** Effect: upsert `InstanceParticipation` for playerId + instanceId (from effect value or fromInput)
- [ ] **T2.3** Create "Enter the Campaign" quest with completion effect; add to orientation flow when invite has instanceId
- [ ] **T2.4** Wire campaign landing: logged-in player without participation sees quest or CTA

## Phase 3: Player Level Derivation

- [ ] **T3.1** Create `src/lib/player-level.ts` with `getPlayerLevel(playerId)` and `hasCompletedCampaignOrientation(playerId, instanceId?)`
- [ ] **T3.2** Level 1: `!nationId || !archetypeId` OR no InstanceParticipation for active instance
- [ ] **T3.2** Level 2: nation + archetype + (hasCompletedFirstQuest OR has InstanceParticipation)
- [ ] **T3.3** Update PLAYER_LEVELS.md with trigger definitions

## Phase 4: Level-Aware UI (Follow-on)

- [ ] **T4.1** Dashboard: when L1, hide Explore/Character/Campaign modals, Journeys, Graveyard
- [ ] **T4.2** Dashboard: single primary CTA = current orientation quest
- [ ] **T4.3** Pass playerLevel to GM prompts for level-appropriate copy
