# Tasks: Admin Book Detail Hub

## Phase 1: Data + Navigation

- [x] Add `getBookById(bookId)` in `src/actions/books.ts` — select metadata, exclude extractedText
- [x] BookList: wrap book title in `<Link href={/admin/books/${book.id}}>`
- [x] Quest review page: "Back to [Book Title]" links to `/admin/books/[id]`

## Phase 2: Book hub page

- [x] Create `src/app/admin/books/[id]/page.tsx` — server component, getBookById, 404 redirect
- [x] Create `src/app/admin/books/[id]/BookHubClient.tsx` — action buttons, campaign selector
- [x] Hub: header (title, author, status, PDF link)
- [x] Hub: TOC section — entries with level, title, pageHint
- [x] Hub: summary section — summary, leverage, domain fit (campaign selector)
- [x] Hub: analysis status — page/word count, chunks, quests created
- [x] Hub: link to "Review quests"

## Phase 3: Revalidation

- [x] Add revalidatePath for book detail in books.ts, book-summary.ts, book-analyze.ts, book-campaign.ts

## Phase 4: Verification

- [x] Run `npm run build` and `npm run check`
- [ ] Manual: list → hub → TOC visible, summary visible, actions work
