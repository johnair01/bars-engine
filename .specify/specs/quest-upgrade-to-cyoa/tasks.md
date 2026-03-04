# Tasks: Quest Upgrade to CYOA

## Done

- [x] Add QuestThread.sourceQuestId for provenance
- [x] Add spec and link from quest-grammar-ux-flow
- [x] Add "Upgrade to CYOA" on Admin → Quests → [quest] detail page (inline unpacking flow)
- [x] Add "Start from existing quest" in Quest Grammar (uses same unpacking flow)
- [x] Implement Wrapper mode (quick upgrade; hidden for now)
- [x] Implement Replacement mode (quick upgrade; hidden for now)
- [x] Implement Merge Adventures admin action
- [x] Unpacking flow with pre-fill (moveType→q7, description→q6Context, q5)
- [x] Path A: compileQuestWithAI → publishQuestPacketToPassagesWithSourceQuest
- [x] Path B: generateQuestOverviewWithAI → createAdventureAndThreadFromTwee with sourceQuestId

## Pending

### Future

- [ ] Quick upgrade option (when mature enough to trust quality)
- [ ] Permission flow: player must get creator permission to transform another player's quest
