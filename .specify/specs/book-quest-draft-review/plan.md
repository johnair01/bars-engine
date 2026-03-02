# Plan: Book Quest Draft and Admin Review

## Summary

1. Change `analyzeBook` to create CustomBars with `status: 'draft'`.
2. Create `/admin/books/[id]/quests` review page with list, edit, approve/reject.
3. Update `createThreadFromBook` to only include `status: 'active'` quests.
4. Add "Review quests" link from books list when book is analyzed.

## Implementation

### 1. book-analyze.ts

Change CustomBar creation:

```ts
status: 'draft',  // was 'active'
```

### 2. book-to-thread.ts

Update the quest query:

```ts
where: {
  completionEffects: { contains: `"bookId":"${bookId}"` },
  status: 'active',  // only approved quests
  ...
}
```

Add early return if no approved quests:

```ts
if (quests.length === 0) {
  return { error: 'No approved quests. Review and approve quests first.' }
}
```

### 3. New: src/app/admin/books/[id]/quests/page.tsx

- Server component: fetch book + draft quests (status: draft, completionEffects contains bookId).
- Render list of quests with inline edit or link to edit form.
- Actions: approveQuest(questId), rejectQuest(questId), approveAllQuests(bookId).

### 4. New: src/actions/book-quest-review.ts

- `getBookDraftQuests(bookId)`: return draft CustomBars for book.
- `approveQuest(questId)`: set status → 'active'.
- `rejectQuest(questId)`: set status → 'archived' (or delete).
- `approveAllQuests(bookId)`: approve all draft quests for book.
- `updateBookQuest(questId, data)`: update title, description, moveType, allyshipDomain.

### 5. Edit form

- Inline edit on the review page, or separate `/admin/books/[id]/quests/[questId]/edit` page.
- Form fields: title, description, moveType (select), allyshipDomain (select, nullable).
- Reuse MOVE_TYPES and ALLYSHIP_DOMAINS from book-analyze.

### 6. BookList updates

- Add "Review quests" link when status === 'analyzed' or 'published'.
- Link to `/admin/books/[id]/quests`.
- Optionally: show count of draft vs approved (e.g. "12 draft, 55 approved").

### 7. Verify exclusions

- Ensure Market (`getMarketContent`), thread queries, and future `getQuestLibraryContent` exclude `status: 'draft'`. Check existing filters.

## File Impacts

| Action | Path |
|--------|------|
| Modify | src/actions/book-analyze.ts (status: draft) |
| Modify | src/actions/book-to-thread.ts (filter status: active, error if none) |
| Create | src/actions/book-quest-review.ts |
| Create | src/app/admin/books/[id]/quests/page.tsx |
| Modify | src/app/admin/books/BookList.tsx (Review quests link) |

## Verification

1. Analyze a book → quests created with status draft.
2. Open Review quests → see draft list.
3. Edit a quest, approve it → status becomes active.
4. Reject a quest → status becomes archived.
5. Approve all → all drafts become active.
6. Publish → only active quests in thread.
7. Publish with no approved quests → error.
