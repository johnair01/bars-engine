# Tasks: Starter Quest Generator v1 + Emotional Alchemy Integration

## Phase 1: resolveMoveForContext

- [ ] Create `src/lib/quest-grammar/resolveMoveForContext.ts`
- [ ] Implement DOMAIN_MOVE_PREFERENCE (domain → preferred move IDs)
- [ ] When lens present, intersect with getMovesForLens; return first match
- [ ] Return null when no match
- [ ] Export from quest-grammar index

## Phase 2: Seed 5 Starter Quest Templates

- [ ] Create Strengthen the Residency (GATHERING_RESOURCES) — donation
- [ ] Create Invite an Ally (RAISE_AWARENESS)
- [ ] Create Declare a Skill (SKILLFUL_ORGANIZING)
- [ ] Create Test the Engine (DIRECT_ACTION) — or tag bb-explore-market
- [ ] Create Create Momentum (RAISE_AWARENESS)
- [ ] Each: allyshipDomain, campaignRef bruised-banana, type onboarding, TwineStory
- [ ] Add to seed-onboarding-thread.ts or seed-starter-quest-pool.ts

## Phase 3: Domain-Biased Assignment

- [x] Create getStarterQuestsForPlayer(playerId, campaignRef)
- [x] Resolve player domain from campaignDomainPreference or lens→domain
- [x] Query starter pool CustomBars; return primary + 2 optional
- [x] Extend assignOrientationThreads to use getStarterQuestsForPlayer when lens + bruised-banana
- [x] Wire dynamic quest set into bruised-banana-orientation-thread (or equivalent)

## Phase 4: Move Resolution + Verification

- [ ] Call resolveMoveForContext when assigning; attach move to quest
- [ ] Add cert-starter-quest-generator-v1 to seed-cyoa-certification-quests.ts
- [ ] Run npm run build and npm run check
