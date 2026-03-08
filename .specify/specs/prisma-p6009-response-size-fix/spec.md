# Spec: Prisma P6009 Response Size + Anti-Fragile Data Queries

## Purpose

Fix the `/admin/books` crash when `listBooks()` triggers Prisma P6009 (response size exceeded 5MB). Make the system increasingly anti-fragile to large-query errors so pages degrade gracefully instead of crashing.

**Problem**: `db.book.findMany()` fetches all fields including `extractedText` (full book text, often >5MB). Prisma Accelerate enforces a 5MB response limit. The page crashes with an unhandled error.

**Practice**: Deftness Development — fix root cause (exclude large fields), add graceful degradation, document patterns for future queries.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Root cause | Use `select` to exclude `extractedText` (and optionally `metadataJson`) from list queries. List views never need full text. |
| Error handling | Wrap data-fetching in try/catch; return `{ error, data }` shape; page renders partial state or friendly message. |
| Anti-fragility | Add `isPrismaP6009(e)` helper; log P6009 for admin review; consider audit of other `findMany` calls with large text fields. |
| Config limit | Prisma Accelerate 5MB limit is configurable per project; document in spec but prefer query optimization over raising limit. |

## Prisma P6009 Reference

- **Code**: P6009 (ResponseSizeLimitExceeded)
- **Cause**: Query response > 5MB (Prisma Accelerate default)
- **Typical causes**: Transmitting images/files, over-fetching (missing `select`/`where`), large volume without pagination
- **Docs**: [Prisma Postgres Error Reference](https://www.prisma.io/docs/postgres/error-reference)

## Conceptual Model

| WHO | WHAT | WHERE |
|-----|------|--------|
| Admin | Lists books | /admin/books |
| listBooks | Fetches Book[] | Excludes extractedText |
| Page | Renders list or error | Graceful degradation |

## API Contracts

### listBooks (Server Action)

**Before**: `db.book.findMany({ orderBy, include: { thread } })` — fetches all fields.

**After**: `db.book.findMany({ select: { id, title, author, slug, sourcePdfUrl, status, metadataJson, createdAt, thread: { select: { id } } }, orderBy })` — excludes `extractedText`.

**Error shape**: On throw, caller catches; action can return `{ error: string }` or throw (page handles).

### Admin Books Page

**Input**: Server component fetches via `listBooks()`.

**Output**: Renders BookList with books, or error message. Never crashes with 500.

## User Stories

### P1: Admin lists books without crash

**As an admin**, I want to open `/admin/books` and see the book list, so I can upload, extract, and analyze PDFs. The page must not crash when books have large extracted text.

**Acceptance**: With books containing >5MB extractedText, `/admin/books` loads and shows the list. No P6009.

### P2: Graceful degradation on data errors

**As an admin**, I want to see a clear message if the book list fails to load, so I know what went wrong instead of a blank crash.

**Acceptance**: If listBooks throws (e.g. DB timeout, P6009 from another query), page shows "Unable to load books. Please try again." with optional retry.

## Functional Requirements

### Phase 1: Immediate Fix

- **FR1**: `listBooks()` MUST use `select` to exclude `extractedText`. Include: id, title, author, slug, sourcePdfUrl, status, metadataJson, createdAt, thread: { select: { id } }.
- **FR2**: BookList type MUST match the selected shape (no extractedText).

### Phase 2: Anti-Fragile Error Handling

- **FR3**: Admin books page MUST catch listBooks errors and render a friendly error state instead of throwing.
- **FR4**: Add `isPrismaP6009(error)` helper in `src/lib/prisma-errors.ts` (or similar) for detecting P6009. Log when detected.
- **FR5**: Document in DEVELOPER_ONBOARDING or similar: when adding list/catalog queries for models with large text/binary fields, use `select` to exclude them.

### Phase 3: Audit (Optional)

- **FR6**: Audit other `findMany` calls for models with large fields (Book, CustomBar with storyContent, etc.). Add `select` where list views don't need full content.

## Non-Functional Requirements

- No schema changes.
- Backward compatible: BookList and consumers expect same shape minus extractedText (they never used it).
- Log P6009 occurrences for monitoring.

## References

- [Prisma P6009 Error Reference](https://www.prisma.io/docs/postgres/error-reference)
- [Prisma select](https://www.prisma.io/docs/orm/reference/prisma-client-reference#select)
- Affected: [src/actions/books.ts](../../src/actions/books.ts), [src/app/admin/books/page.tsx](../../src/app/admin/books/page.tsx)
