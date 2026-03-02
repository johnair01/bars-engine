# Tasks: Book Quest Draft and Admin Review

- [x] Change book-analyze to create CustomBars with status: 'draft'
- [x] Create src/actions/book-quest-review.ts (getBookDraftQuests, approveQuest, rejectQuest, approveAllQuests, updateBookQuest)
- [x] Update book-to-thread to filter status: 'active' and return error if no approved quests
- [x] Create src/app/admin/books/[id]/quests/page.tsx (review page)
- [x] Add quest list with edit form (title, description, moveType, allyshipDomain)
- [x] Add Approve / Reject buttons per quest
- [x] Add Approve all button
- [x] Add "Review quests" link to BookList when book is analyzed
- [x] Verify Market and thread queries exclude draft quests (Market already filters status: active)
- [ ] Test: Analyze → Review → Edit → Approve → Publish flow
