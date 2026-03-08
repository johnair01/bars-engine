# Plan: Prisma P6009 Response Size Fix + Anti-Fragile Queries

## Summary

Fix listBooks over-fetching (exclude extractedText), add error handling to admin books page, add P6009 detection helper, document patterns.

## Phases

### Phase 1: Immediate Fix

1. **listBooks select** — Change `db.book.findMany` to use `select` excluding `extractedText`. Include: id, title, author, slug, sourcePdfUrl, status, metadataJson, createdAt, thread: { select: { id } }.
2. **Verify** — BookList already expects this shape (no extractedText). Run build, check.

### Phase 2: Error Handling

3. **Page try/catch** — Wrap `listBooks()` in try/catch. On error, render error message + optional retry. Pass empty array or error state to BookList.
4. **isPrismaP6009** — Create `src/lib/prisma-errors.ts` with `isPrismaP6009(e: unknown): boolean`. Check for code P6009 or P5000 with P6009 in message.
5. **Log** — When P6009 detected, log with context (action name, model).

### Phase 3: Documentation

6. **Developer docs** — Add note to DEVELOPER_ONBOARDING or docs: "List queries for models with large text fields (Book.extractedText, CustomBar.storyContent) must use select to exclude them to avoid P6009."

## File Impacts

| File | Action |
|------|--------|
| src/actions/books.ts | Modify listBooks: add select |
| src/app/admin/books/page.tsx | Add try/catch, error state |
| src/lib/prisma-errors.ts | Create (isPrismaP6009) |

## Verification

- Deploy; open /admin/books with books that have large extractedText. Page loads.
- Simulate error (e.g. invalid query): page shows friendly message, no crash.
