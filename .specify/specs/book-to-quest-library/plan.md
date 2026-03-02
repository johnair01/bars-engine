# Plan: Book-to-Quest Library

## Architecture

- **PDF Upload** → store file → Book record (status: draft)
- **Extract** → pdf-parse → Book.extractedText (status: extracted)
- **Analyze** → chunk text → AI (OpenAI) → CustomBar records + moveType (status: analyzed)
- **Thread** → QuestThread (creatorType: library) + ThreadQuest → Quest Library (status: published)
- **Re-publish**: If book already has published thread → offer replace OR save new thread; preserve old thread when replacing
- **Browse** → getQuestLibraryContent() filtered by player
- **Pull** → pullFromLibrary(threadId) → ThreadProgress

## File Impacts

| Action | Path |
|--------|------|
| Create | `prisma/schema.prisma` (add Book model, QuestThread.bookId) |
| Create | `src/lib/pdf-extract.ts` |
| Create | `src/actions/books.ts` |
| Create | `src/actions/book-analyze.ts` |
| Create | `src/lib/book-chunker.ts` |
| Create | `src/actions/book-to-thread.ts` |
| Create | `src/actions/quest-library.ts` |
| Create | `src/app/admin/books/page.tsx` |
| Create | `src/app/admin/books/BookUploadForm.tsx` |
| Create | `src/app/admin/books/BookAnalysisPanel.tsx` |
| Create | `src/app/library/page.tsx` |
| Create | `src/components/QuestLibraryBrowser.tsx` |
| Modify | `src/actions/quest-thread.ts` (add creatorType support, startThread for library) |
| Modify | `src/app/admin/layout.tsx` or nav (add Books link) |
| Modify | Layout/nav (add Library link for players) |

## Schema

- **Book**: id, title, author, slug, sourcePdfUrl, extractedText, status, metadataJson, createdAt, updatedAt
- **QuestThread**: add bookId (optional, unique), relation to Book
- **CustomBar**: use completionEffects JSON for { source: 'library', bookId }
- **QuestThread.creatorType**: extend to support 'library' (existing field)

## Technical Context

- **Language**: TypeScript, Next.js
- **Dependencies**: pdf-parse or pdf-parse-new, @ai-sdk/openai, ai, zod
- **Storage**: PostgreSQL (Prisma), local disk for PDFs (public/uploads/books/)
- **AI**: OpenAI generateObject pattern (see src/actions/generate-quest.ts)

## Verification Quest

- Seed `cert-book-to-quest-library-v1`
- Steps: Admin upload PDF → extract → analyze → view thread; Player browse /library → pull thread → complete quest
