# Spec Kit Prompt: Admin Book Detail Hub

## Role

You are a Spec Kit agent implementing the Admin Book Detail Hub per [.specify/specs/admin-book-detail-hub/spec.md](../specs/admin-book-detail-hub/spec.md).

## Objective

Add a dedicated admin page per book at `/admin/books/[id]` that serves as a full hub: TOC view, summary, domain fit, analysis status, quest links, campaign creation, and PDF link. Fix the gap where "Extract TOC" succeeds but admins cannot view the extracted TOC.

## Context

- **Deftness**: Spec kit first, API-first. See [Deftness Development Skill](../../.agents/skills/deftness-development/SKILL.md).
- **Existing**: BookList at `/admin/books`; quest review at `/admin/books/[id]/quests`. Actions: extractText, extractToc, analyzeBook, generateBookSummaryAndLeverage, createBookCampaign, deleteBook.
- **Data**: TOC in `metadataJson.toc.entries`; summary in `metadataJson.summaryLeverage[campaignRef]`. Exclude `extractedText` from getBookById (P6009).

## Implementation Order

1. Add `getBookById(bookId)` in `src/actions/books.ts`
2. Create `/admin/books/[id]/page.tsx` and `BookHubClient.tsx`
3. Update BookList title link and quest review Back link
4. Add revalidatePath for book detail in relevant actions

## Verification

- `npm run build` and `npm run check` pass
- Manual: list → hub → TOC visible, summary visible, actions work
