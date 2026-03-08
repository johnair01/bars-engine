# Plan: Adventure Completion Record

## Summary

Add query helpers for "adventure completed" using existing schema. Option B (query convention): treat ThreadProgress.completedAt where thread.adventureId = X as adventure completed. No schema changes.

## Implementation

### Phase 1: Query helpers

**File**: `src/lib/adventure-completion.ts`

- `hasCompletedAdventure(playerId, adventureId): Promise<boolean>` — returns true when ThreadProgress exists with completedAt set and thread.adventureId = adventureId
- `getCompletedAdventureIds(playerId): Promise<string[]>` — returns adventure IDs the player has completed (for badges, history, UI)

### Phase 2: Integration (optional)

- Callers that need "adventure completed" can import from `@/lib/adventure-completion`
- Adventures page, campaign page, or badge UI can use `hasCompletedAdventure` or `getCompletedAdventureIds`

### Deferred: Option A (AdventureCompletion model)

- If badges/history need a dedicated table with extra metadata, add AdventureCompletion model later
- Populate when advanceThreadForPlayer completes a thread with adventureId
