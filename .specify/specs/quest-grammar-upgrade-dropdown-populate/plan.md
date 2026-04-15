# Plan: Quest Grammar Upgrade Dropdown Populate

## Overview

Fix the "Start from existing quest" dropdown so it populates with available quests and surfaces loading/error/empty states. Add `getAdminQuestsForUpgrade` with error-return shape and filter; update UpgradeFromQuest for loading, error, and empty UX.

## Implementation Order

### 1. Server action (Phase 1)

- Add `getAdminQuestsForUpgrade` to `src/actions/admin.ts`.
- Wrap checkAdmin in try/catch; return `{ success: false, error }` instead of throwing.
- Wrap DB query in try/catch; return `{ success: false, error }` on failure.
- Filter: `type in ['quest','vibe']`, `status = 'active'`.
- Select: id, title, description, moveType, storyContent.
- Order: createdAt desc; take 200.

### 2. UI (Phase 2)

- Update UpgradeFromQuest to call `getAdminQuestsForUpgrade` instead of `getAdminQuests`.
- Add loading state and setError state.
- Handle success: setQuests; handle error: setError.
- Disable select while loading; show "Loading…" in placeholder.
- Show error message below select when error.
- Show empty state ("No quests available. Create a quest first." with link) when no error and no quests.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/actions/admin.ts` | Add getAdminQuestsForUpgrade |
| `src/app/admin/quest-grammar/UpgradeFromQuest.tsx` | Use new action; add loading, error, empty states |

## Verification

1. As admin: Upgrade from quest tab → dropdown shows quests (or loading then quests).
2. Auth failure: error message shown.
3. Empty DB: "No quests available. Create a quest first." with link.
