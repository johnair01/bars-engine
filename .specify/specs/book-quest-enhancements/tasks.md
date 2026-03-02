# Tasks: Book Quest Enhancements

- [x] Add gameMasterFace String? to CustomBar in prisma/schema.prisma
- [x] Run npm run db:sync
- [x] Extend UpdateBookQuestData with reward, gameMasterFace in book-quest-review.ts
- [x] Update updateBookQuest to persist reward (clamp 0–99) and gameMasterFace
- [x] Add createThreadFromQuest(questId) action in book-quest-review.ts
- [x] Add reward and gameMasterFace to Quest type and edit form in BookQuestReviewList
- [x] Add GAME_MASTER_FACES constant and conditional face dropdown (when moveType growUp)
- [x] Add approved quests section to BookQuestReviewList with Upgrade to thread button
- [x] Pass approvedQuests from page to BookQuestReviewList
- [x] Add revalidatePath for createThreadFromQuest (admin/journeys, admin/books)
