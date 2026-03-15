# Tasks: Quest Library Wave Routing and Training

## Phase 1: Schema and routing

- [x] Add `questPool String?` to CustomBar in prisma/schema.prisma (values: efa, dojo, discovery, gameboard)
- [x] Run `npm run db:sync`
- [x] In book-quest-review approve flow: set questPool from moveType (cleanUp→efa, growUp→dojo, showUp→gameboard, wakeUp→discovery)
- [x] Verify createThreadFromBook publishes to Quest Library (creatorType='library')

## Phase 2: getQuestsByPool and EFA surface

- [x] Create src/actions/quest-pools.ts with getQuestsByPool(pool)
- [x] Query CustomBar where questPool = pool, status = 'active'
- [x] Add EFA quest pool section to Emotional First Aid page or linked "Learn moves" UI
- [x] Player can pull EFA pool quest to active journey

## Phase 3: Discovery queue (admin)

- [ ] Admin discovery queue: filter /admin/quests by questPool='discovery' or new /admin/discovery page
- [ ] List Wake Up quests in discovery; admin can approve, reject, edit, or reassign pool

## Phase 4: Dojo pool (stub)

- [ ] Grow Up quests get questPool='dojo' on approve
- [ ] getQuestsByPool('dojo') returns them; no UI (deferred)

## Phase 5: Verification quest

- [ ] Create cert-quest-library-wave-routing-v1 Twine story
- [ ] Add to scripts/seed-cyoa-certification-quests.ts
- [ ] npm run build and npm run check

## Phase 6: Model quests and suggestions (deferred)

- [ ] Model quests storage and getModelQuests()
- [ ] suggestQuestEdits(questId)
- [ ] Extend to adventure suggestion
