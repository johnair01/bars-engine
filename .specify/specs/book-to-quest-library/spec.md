# Spec: Book-to-Quest Library — PDF Ingestion + Quest Library

## Purpose

Turn Personal Development books (PDFs) into quest content that players can pull from to Grow Up. The **Quest Library** is a distinct content pool separate from player-created quests and story-engine quests. Players browse and pull quests/threads into their active journey.

**Problem**: Reading books to become a better ally often becomes procrastination. By turning books into quest content, we can measure which books help whom and when.

**Terminology**: Integral Emergence = the game; bars-engine = the program.

## API Contracts (API-First)

> Define before implementation. Server Actions for forms and data; Route Handler only if external consumers need library search.

### getQuestLibraryContent

**Input**: `{ playerId: string }` (or from session)  
**Output**: `Promise<QuestThreadSummary[]>` — threads where `creatorType = 'library'`, filtered by player nation, playbook, developmental hint.

- **Server Action** — /library page data fetch. Returns threads with gateNationId, gatePlaybookId applied.

### pullFromLibraryAction

**Input**: `{ threadId?: string; questId?: string }` — one required  
**Output**: `Promise<{ success: true; threadProgressId?: string; playerQuestId?: string } | { error: string }>`

- **Server Action** — "Pull" / "Start" button. `threadId` → create ThreadProgress; `questId` → assign standalone via PlayerQuest.

### uploadBookAction

**Input**: `FormData` (file: PDF)  
**Output**: `Promise<{ success: true; bookId: string } | { error: string }>`

- **Server Action** — Admin upload. Store to Blob/S3; create Book record with `status: 'draft'`.

### triggerExtractionAction

**Input**: `{ bookId: string }`  
**Output**: `Promise<{ success: true } | { error: string }>`

- **Server Action** — Admin trigger. Extract text; persist to Book.extractedText; `status` → extracted.

### triggerAnalysisAction

**Input**: `{ bookId: string }`  
**Output**: `Promise<{ success: true } | { error: string }>`

- **Server Action** — Admin trigger. Chunk + AI analysis; create CustomBar, QuestThread, ThreadQuest; `status` → analyzed.

## Conceptual Model (Game Language)

- **WHO**: Player (browser, puller), Admin (uploader, analyzer)
- **WHAT**: Book, CustomBar (quests), QuestThread (library threads)
- **WHERE**: Allyship domains (GATHERING_RESOURCES, DIRECT_ACTION, etc.)
- **Energy**: Vibeulons (reward for quest completion)
- **Personal throughput**: 4 moves — Wake Up, Clean Up, Grow Up, Show Up (content categorized into these)

## Quest Library Concept

| Source | Description |
|--------|-------------|
| Player-created quests | Wizard, BAR creation |
| Story engine quests | Hexagram, orientation, story clock |
| **Quest Library** | Curated system content (book-derived) for Grow Up |

Players *pull from* the Quest Library. No auto-assignment.

## User Stories

### Admin

- As an admin, I can upload a PDF and trigger text extraction so the book enters the system.
- As an admin, I can trigger AI analysis to extract BARs, Quests, Skills, and move classifications (wake up, clean up, grow up, show up).
- As an admin, I can view the derived QuestThread and reorder quests if needed.
- As an admin, I can see book status: draft | extracted | analyzed | published.

### Player

- As a player, I can browse the Quest Library filtered by my nation, playbook, and developmental hint.
- As a player, I can filter library content by move type (Wake Up, Clean Up, Grow Up, Show Up) and allyship domain.
- As a player, I can pull a thread or quest from the library to add it to my active journey.

## Functional Requirements

### Phase 1: PDF Ingestion

- **FR1**: Book model: id, title, author, slug, sourcePdfUrl, extractedText, status (draft|extracted|analyzed|published), metadataJson.
- **FR2**: Admin upload flow: accept PDF file, store to disk (public/uploads/books/ or env S3), create Book record.
- **FR3**: Text extraction: use pdf-parse or pdf-parse-new to extract text; persist to Book.extractedText; status → extracted.
- **FR4**: Admin page /admin/books: list books, upload form, trigger extraction.

### Phase 2: AI Analysis

- **FR5**: Chunk extracted text (by chapter or ~2000 tokens) to fit AI context.
- **FR6**: AI analysis: input chunk, output (Zod) bars, quests, moveClassifications (wakeUp, cleanUp, growUp, showUp).
- **FR7**: Create CustomBar records: title, description, moveType, allyshipDomain, isSystem: true, completionEffects: { source: 'library', bookId }.
- **FR8**: Status: extracted → analyzed.

### Phase 3: Quest Thread → Quest Library

- **FR9**: Create QuestThread with creatorType: 'library', bookId; create ThreadQuest links in order.
- **FR10**: QuestThread supports gateNationId, gatePlaybookId, allowedPlaybooks for personalization.
- **FR11**: Status: analyzed → published.
- **FR11a**: Re-publish behavior: If a book already has a published thread, offer (a) replace existing thread with new one, and (b) opportunity to save the new thread (e.g. before replacing, or save as new version).

### Phase 4: Quest Library API + Pull

- **FR12**: getQuestLibraryContent(): returns threads where creatorType = 'library', filtered by player nation, playbook, developmental hint.
- **FR13**: pullFromLibrary(threadId): create ThreadProgress for player (start thread).
- **FR14**: pullFromLibrary(questId): assign standalone quest via PlayerQuest (if supported).

### Phase 5: Quest Library UI

- **FR15**: /library page: browse library threads, filter by move type, allyship domain, book.
- **FR16**: "Pull" / "Start" button to add thread to player's journey.

### Phase 6: Admin UX

- **FR17**: Admin /admin/books: list books, status badges, trigger analysis, view derived thread, reorder quests.

## Key Entities

- **Book**: Source document; title, author, slug, extractedText, status, metadataJson.
- **QuestThread**: creatorType = 'library', bookId; gateNationId, gatePlaybookId for gating.
- **CustomBar**: Quest records with moveType, allyshipDomain, completionEffects: { source: 'library', bookId }.
- **ThreadQuest**: Links CustomBar to QuestThread with position.

## Non-functional Requirements

- Admin-only upload for MVP (no player-uploaded books).
- Text-based PDFs only (no OCR in MVP).
- AI analysis: batch, admin-triggered, cache results.
- Spawn cap: reasonable limits on analysis jobs per day (configurable).

## Verification Quest

- **ID**: `cert-book-to-quest-library-v1`
- **Steps**: Admin uploads PDF; triggers extraction; triggers analysis; views derived thread; player browses /library; pulls thread; completes first quest.

## Dependencies

- CustomBar, QuestThread, ThreadQuest, PlayerQuest (existing)
- OpenAI (existing generate-quest pattern)
- pdf-parse or pdf-parse-new

## Out of Scope (MVP)

- Player-uploaded books
- Per-nation/per-archetype quest variants (one thread per book)
- EPUB or other formats
- Analytics dashboard ("which books help whom")
- OCR for scanned PDFs
