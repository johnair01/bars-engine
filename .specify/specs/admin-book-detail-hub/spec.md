# Spec: Admin Book Detail Hub

## Purpose

Provide a dedicated admin page per book that serves as a full hub: TOC view, summary, domain fit, analysis status, quest links, campaign creation, and PDF link. Fixes the gap where "Extract TOC" succeeds but admins cannot view the extracted TOC.

**Problem**: Book list shows TOC entry count only; summary is inline-expandable but TOC is never visible. Admin workflows (quest review, campaign creation) require navigating between list and quests page with no central book context.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Route structure | `/admin/books/[id]` = book hub; `/admin/books/[id]/quests` = quest review (existing) |
| Data loading | Exclude `extractedText` (P6009 risk); include `metadataJson` for TOC, summary, analysis |
| TOC display | Tree/list by level (part, chapter, section); title, optional page hint, char range |
| Actions | Reuse existing server actions (extractText, extractToc, analyze, summary, campaign); hub orchestrates |

## Conceptual Model

| Concept | Location |
|---------|----------|
| **Book hub** | Single page per book; all metadata and actions in one place |
| **TOC** | `metadataJson.toc.entries` — title, level, charStart, charEnd, pageHint |
| **Summary** | `metadataJson.summaryLeverage[campaignRef]` — summary, leverageInCampaign, domainFitAnalysis |
| **Analysis** | `metadataJson.analysis`, `metadataJson.pageCount`, `metadataJson.wordCount` |

## API Contracts (API-First)

### getBookById(bookId)

**Input**: `bookId: string`  
**Output**: `Promise<Book | null>`

```ts
// Select: id, title, author, slug, sourcePdfUrl, status, metadataJson, createdAt
// Exclude: extractedText (P6009)
```

- Server-side only; used by book hub page. No Route Handler.

### Existing actions (unchanged)

- `extractBookText`, `extractBookToc`, `analyzeBook`, `generateBookSummaryAndLeverage`, `createBookCampaign`, `deleteBook`

## User Stories

### P1: View TOC

**As an admin**, I want to see the extracted table of contents for a book, so I can verify structure and use it for curation.

**Acceptance**: Book hub displays TOC entries as a list/tree with title, level, optional page hint.

### P2: Full book context in one place

**As an admin**, I want all book metadata (TOC, summary, domain fit, analysis status) on one page, so I can review before quest review or campaign creation.

**Acceptance**: Book hub shows TOC, summary + leverage + domain fit, analysis stats, action buttons, links to quests and PDF.

### P3: Navigate from list to hub

**As an admin**, I want to click a book title in the list and land on the book hub, so I can work from the hub as the central entry point.

**Acceptance**: BookList book titles link to `/admin/books/[id]`.

### P4: Navigate from quests back to hub

**As an admin**, I want "Back" from the quest review page to return to the book hub (not just the list), so I stay in book context.

**Acceptance**: Quest review page "Back" links to `/admin/books/[id]`.

## Functional Requirements

### Phase 1: Book hub page

- **FR1**: Create `/admin/books/[id]/page.tsx` — server component; fetch book via `getBookById`; 404 if not found.
- **FR2**: Display header: title, author, status badge, PDF link (when `sourcePdfUrl`).
- **FR3**: Display TOC section: entries from `metadataJson.toc.entries`; indent by level; show title, level label, optional page hint.
- **FR4**: Display summary section: summary, leverage in campaign, domain fit from `summaryLeverage[campaignRef]`; campaign selector (default bruised-banana).
- **FR5**: Display analysis status: page count, word count, chunks analyzed/total, quests created.
- **FR6**: Action buttons: Extract Text, Extract TOC, Trigger Analysis, Summary, Create Campaign, Remove — reuse logic from BookList (client component or server actions).
- **FR7**: Link to "Review quests" → `/admin/books/[id]/quests`.

### Phase 2: Navigation

- **FR8**: BookList: wrap book title in `<Link href={/admin/books/${book.id}}>`.
- **FR9**: Quest review page: "Back to [Book Title]" links to `/admin/books/[id]` (not `/admin/books`).
- **FR10**: Add `getBookById(bookId)` in `src/actions/books.ts`; select id, title, author, slug, sourcePdfUrl, status, metadataJson, createdAt; exclude extractedText.

### Phase 3: Revalidation

- **FR11**: After extractToc, generateSummary, extractText, analyzeBook, createBookCampaign, deleteBook: `revalidatePath('/admin/books/[id]')` so hub refreshes.

## Non-Functional Requirements

- Exclude `extractedText` from `getBookById` to avoid P6009 (response size).
- Hub page should load quickly; no large payloads.

## Dependencies

- [pdf-to-campaign-autogeneration](.specify/specs/pdf-to-campaign-autogeneration/spec.md) — summary, leverage, domain fit schema
- [book-quest-targeted-extraction](.specify/specs/book-quest-targeted-extraction/spec.md) — TOC structure

## References

- [src/app/admin/books/BookList.tsx](src/app/admin/books/BookList.tsx) — existing actions, metadata parsing
- [src/app/admin/books/[id]/quests/page.tsx](src/app/admin/books/[id]/quests/page.tsx) — quest review page
- [src/lib/book-toc.ts](src/lib/book-toc.ts) — TocEntry, TocLevel
