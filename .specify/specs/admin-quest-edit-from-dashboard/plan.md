# Plan: Admin Quest Edit from Dashboard

## Summary

Add an admin-only "Edit quest" link to the quest detail modal when an admin views a quest from the player dashboard (including quests embedded in journeys). The link navigates to the existing Admin → Quests → [id] page, where the admin can edit config and use the Upgrade to CYOA flow.

## Architecture

- **Data flow**: Home page derives `isAdmin` from `player.roles` → passes to `QuestThread` and `QuestPack` → both pass to `QuestDetailModal`.
- **UI**: Small admin link in modal header (e.g. "Edit" or "Config" with gear icon), visible only when `isAdmin` is true.
- **No new routes**: Reuse `/admin/quests/[id]`.

## File Impacts

| File | Change |
|------|--------|
| `src/app/page.tsx` | Derive `isAdmin` from player roles; pass to `QuestThread` and `QuestPack` |
| `src/components/QuestThread.tsx` | Add `isAdmin?: boolean` prop; pass to `QuestDetailModal` |
| `src/components/QuestPack.tsx` | Add `isAdmin?: boolean` prop; pass to `QuestDetailModal` |
| `src/components/QuestDetailModal.tsx` | Add `isAdmin?: boolean` prop; render admin edit link in header when true |

## Implementation Order

1. Add `isAdmin` prop to `QuestDetailModal` and render the edit link.
2. Add `isAdmin` prop to `QuestThread` and `QuestPack`; pass through.
3. Derive `isAdmin` on home page and pass to both components.

## Verification

- Log in as admin; open a quest from a journey on the dashboard; confirm "Edit quest" (or equivalent) link appears.
- Click link; confirm navigation to `/admin/quests/[id]`.
- Log in as non-admin; open same quest; confirm no admin link.
- From edit page, confirm "Upgrade to CYOA" flow is available (existing behavior).
