# Tasks: Admin Quest Edit from Dashboard

## Phase 1: QuestDetailModal

- [x] Add `isAdmin?: boolean` to `QuestDetailModalProps`
- [x] In modal header, when `isAdmin` is true, render a link to `/admin/quests/${quest.id}` (e.g. "Edit" or "Config" with subtle admin styling)
- [x] Ensure link opens in same tab (or new tab if preferred for workflow)

## Phase 2: Prop Propagation

- [x] Add `isAdmin?: boolean` to `QuestThread` props; pass to `QuestDetailModal`
- [x] Add `isAdmin?: boolean` to `QuestPack` props; pass to `QuestDetailModal`

## Phase 3: Home Page

- [x] In `src/app/page.tsx`, derive `isAdmin` from `player?.roles?.some(r => r.role.key === 'admin')`
- [x] Pass `isAdmin` to `QuestThread` and `QuestPack` where they are rendered

## Verification

- [ ] Admin: open quest from journey → see edit link → click → land on admin quest edit page
- [ ] Non-admin: open same quest → no edit link
- [x] `npm run build` and `npm run check` pass
