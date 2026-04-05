# Plan: Admin Book Detail Hub

## Summary

Add `/admin/books/[id]` as a full hub for each book: TOC view, summary, domain fit, analysis status, action buttons, links to quests and PDF. Add `getBookById`; update BookList and quest review navigation.

## File Impacts

| Action | Path |
|--------|------|
| Create | `src/app/admin/books/[id]/page.tsx` — book hub (server + client sections) |
| Create | `src/app/admin/books/[id]/BookHubClient.tsx` — client actions (extract, analyze, summary, etc.) |
| Modify | `src/actions/books.ts` — add `getBookById(bookId)` |
| Modify | `src/app/admin/books/BookList.tsx` — link title to `/admin/books/[id]` |
| Modify | `src/app/admin/books/[id]/quests/page.tsx` — Back link to hub |
| Modify | `src/actions/books.ts`, `book-summary.ts`, `book-analyze.ts`, `book-campaign.ts` — add `revalidatePath('/admin/books/[id]')` |

## Implementation

### 1. getBookById

- **File**: `src/actions/books.ts`
- Add `getBookById(bookId: string)` — select id, title, author, slug, sourcePdfUrl, status, metadataJson, createdAt
- Exclude extractedText
- Return null if not found

### 2. Book hub page

- **File**: `src/app/admin/books/[id]/page.tsx`
- Server component: `getBookById(bookId)`; redirect to `/admin/books` if null
- Render: header (title, author, status, PDF link), TOC section, summary section, analysis status
- Include `BookHubClient` for action buttons (extract, analyze, summary, campaign, delete)
- Link to "Review quests" → `/admin/books/[id]/quests`

### 3. BookHubClient

- **File**: `src/app/admin/books/[id]/BookHubClient.tsx`
- Client component: receives book, campaignRef state
- Reuse handlers from BookList (extractText, extractToc, analyze, summary, campaign, delete)
- Campaign selector for summary (default bruised-banana)
- After actions: `router.refresh()` (server component will refetch)

### 4. TOC display

- Inline in page or small component: map `toc.entries` to list items
- Level → indent or badge (part/chapter/section)
- Show title, pageHint if present

### 5. Navigation updates

- **BookList**: `<Link href={/admin/books/${book.id}}>{book.title}</Link>`
- **Quests page**: Fetch book for "Back to [title]" linking to `/admin/books/[id]`

### 6. Revalidation

- In extractBookToc, extractBookText, generateBookSummaryAndLeverage, analyzeBook, createBookCampaign, deleteBook: add `revalidatePath(\`/admin/books/${bookId}\`)` (or pass bookId where available)

## Verification

- Visit `/admin/books` → click book title → lands on hub
- Hub shows TOC when extracted
- Hub shows summary when generated
- Action buttons work; page refreshes after action
- "Review quests" → quest page → "Back to [title]" → hub
