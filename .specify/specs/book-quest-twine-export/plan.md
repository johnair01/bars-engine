# Plan: Book Quest Twine Export

## Summary

1. Add `getBookQuestsForTwineExport(bookId)` server action.
2. Add "Export for Twine" button to book quest review page that downloads JSON.

## Implementation

### 1. Server action (book-quest-review.ts or new book-twine-export.ts)

Create `getBookQuestsForTwineExport(bookId: string)`:

- Require admin
- Fetch book; return error if not found
- Fetch approved quests (status: active, completionEffects contains bookId)
- If book has thread (QuestThread.bookId), get ThreadQuest order; else sort by MOVE_ORDER
- Return `{ book: { id, title, author }, quests: [{ id, title, description, moveType, allyshipDomain, gameMasterFace, reward, position }] }`

### 2. Book quest review page

- Add "Export for Twine" button (visible when approvedQuests.length > 0)
- On click: call action, create Blob, trigger download with filename `{slug}-quests.json`

### 3. File placement

- Add action to `src/actions/book-quest-review.ts` (keeps book-quest logic together) or create `src/actions/book-twine-export.ts` for clarity. Prefer book-quest-review.ts to avoid extra file.

## File Impacts

| Action | Path |
|--------|------|
| Modify | src/actions/book-quest-review.ts (add getBookQuestsForTwineExport) |
| Modify | src/app/admin/books/[id]/quests/page.tsx (add Export button + client handler) |

## Verification

1. Publish a book with quests.
2. Open Review quests page.
3. Click "Export for Twine".
4. Verify JSON file downloads with book + quests array; positions match thread order.
