# Tasks: Book-to-Quest Library

## Phase 1: Schema

- [x] Add Book model to prisma/schema.prisma
- [x] Add QuestThread.bookId (optional, unique), relation to Book
- [x] Run npm run db:sync

## Phase 1: PDF Ingestion

- [x] Add pdf-parse or pdf-parse-new dependency
- [x] Create src/lib/pdf-extract.ts (extractTextFromPdf)
- [x] Create src/actions/books.ts (uploadBook, extractBookText)
- [x] Create src/app/admin/books/page.tsx
- [x] Create BookUploadForm component
- [x] Add admin nav link for Books

## Phase 2: AI Analysis

- [x] Create src/lib/book-chunker.ts (chunk by chapter or token limit)
- [x] Create src/actions/book-analyze.ts (analyzeBookChunks, create CustomBars)
- [x] AI prompt + Zod schema for bars, quests, moveClassifications
- [x] Add "Trigger Analysis" to admin books page

## Phase 3: Quest Thread Generation

- [x] Create src/actions/book-to-thread.ts (createThreadFromBook)
- [x] Create QuestThread with creatorType: 'library', bookId
- [x] Create ThreadQuest links (order: Wake Up → Clean Up → Grow Up → Show Up or chapter order)
- [x] Set CustomBar.completionEffects: { source: 'library', bookId } (done in book-analyze)
- [x] Add "Publish" / "Generate Thread" to admin books page
- [x] Re-publish: if book has published thread, replace ThreadQuests and update thread

## Phase 4: Quest Library API + Pull

- [ ] Create src/actions/quest-library.ts
- [ ] Implement getQuestLibraryContent() (filter by creatorType: 'library', player nation/playbook/developmental)
- [ ] Implement pullFromLibrary(threadId) → ThreadProgress
- [ ] Extend startThread in quest-thread.ts for library threads

## Phase 5: Quest Library UI

- [ ] Create src/app/library/page.tsx
- [ ] Create QuestLibraryBrowser component (list threads, filter by move type, allyship domain, book)
- [ ] Create PullFromLibraryButton (or "Start" button)
- [ ] Add Library link to player nav

## Phase 6: Admin UX Polish

- [ ] Status badges: draft | extracted | analyzed | published
- [ ] View derived thread (link to thread or inline)
- [ ] Admin reorder ThreadQuest positions (optional)

## Verification Quest

- [x] Add cert-book-to-quest-library-v1 to seed script

## Backlog

- [ ] Add AZ to BACKLOG.md
- [ ] Create .specify/backlog/prompts/book-to-quest-library.md
