# Plan: Book Quest Enhancements

## Summary

1. Add `gameMasterFace` to CustomBar schema.
2. Extend `updateBookQuest` with `reward` and `gameMasterFace`.
3. Add `createThreadFromQuest(questId)` action.
4. Update BookQuestReviewList: reward input, conditional gameMasterFace dropdown, approved section with Upgrade button.
5. Pass approved quests from page to list.

## Implementation

### 1. Schema (prisma/schema.prisma)

Add to CustomBar:

```prisma
gameMasterFace String?  // shaman | challenger | regent | architect | diplomat | sage
```

Run `npm run db:sync` after change.

### 2. book-quest-review.ts

- Extend `UpdateBookQuestData`:
  - `reward?: number`
  - `gameMasterFace?: string | null`
- In `updateBookQuest`: persist `reward` (clamp 0–99) and `gameMasterFace`.
- Add `createThreadFromQuest(questId: string)`:
  - Require admin
  - Fetch quest; return error if not found
  - Create QuestThread: title `"[Quest Title] Thread"`, creatorType `'admin'`, no bookId
  - Create ThreadQuest with position 1
  - Return `{ threadId }` or `{ error }`

### 3. BookQuestReviewList.tsx

- Add `reward` and `gameMasterFace` to Quest type and editForm.
- Add number input for reward (label: "Vibeulons", min 0, max 99).
- Add gameMasterFace select, shown only when `moveType === 'growUp'`.
- Add GAME_MASTER_FACES constant.
- Display reward and face badges in read-only view.
- Add approved quests section when `approvedQuests.length > 0`.
- For each approved quest: title, tags, "Upgrade to thread" button.
- On success: link to `/admin/journeys/thread/[threadId]` or toast + refresh.

### 4. page.tsx

- Fetch approved quests (already returned by getBookApprovedQuests).
- Pass `approvedQuests` to BookQuestReviewList.

### 5. getBookApprovedQuests

- Ensure it returns `reward` and `gameMasterFace` in the select (already returns full CustomBar via findMany).

## File Impacts

| Action | Path |
|--------|------|
| Modify | prisma/schema.prisma (gameMasterFace) |
| Modify | src/actions/book-quest-review.ts (reward, gameMasterFace, createThreadFromQuest) |
| Modify | src/app/admin/books/[id]/quests/BookQuestReviewList.tsx |
| Modify | src/app/admin/books/[id]/quests/page.tsx |

## Verification

1. Edit a draft quest: set reward to 2, moveType to growUp, gameMasterFace to shaman.
2. Save and approve; complete quest as player; verify 2 vibeulons minted.
3. View approved quests; click "Upgrade to thread" on one.
4. Verify new thread created; navigate to journeys admin; add more quests to thread.
