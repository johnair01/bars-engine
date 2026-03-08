# Plan: Gameboard UI Update

## Summary

Add completion validation, admin edit link, merge Add buttons into a modal, extend quest wizard with gameboard context, and implement admin-only grammatical quest generation aligned with nation, playbook, and gameboard state.

## Phases

### Phase 1: Completion validation + Admin edit

- Add `confirm('Are you sure you completed this quest?')` before `completeGameboardQuest` in GameboardClient.
- In gameboard page: use `getCurrentPlayerSafe({ includeRoles: true })`; pass `isAdmin` to GameboardClient.
- In GameboardClient: add `isAdmin` prop; when admin and slot has quest, render Edit link to `/admin/quests/${quest.id}`.

### Phase 2: Add quest modal

- Replace "Add your quest" and "Add subquest" buttons with one "Add quest (1v)" button.
- Create `AddQuestModal` (or inline modal) with:
  - Tab/section: Attach existing (campaign quest list + attachQuestToSlot).
  - Tab/section: Create new:
    - Quick subquest: title + description form → createSubQuest.
    - Full wizard: Link/button to `/quest/create?from=gameboard&questId=&slotId=&campaignRef=`.
    - (Admin) Generate grammatical: button → generateGameboardAlignedQuest.
- Modal opens when "Add quest" clicked; closes on success or cancel.

### Phase 3: Quest wizard context + grammatical generation

- **Wizard**: `/quest/create` reads searchParams; pass `gameboardContext` to QuestWizard. Wizard shows banner, pre-fills campaign, redirects to gameboard after create.
- **generateGameboardAlignedQuest**: New action in `src/actions/gameboard.ts`. Admin check; fetch player (nation, playbook), parent quest, instance; use generateRandomUnpacking; add gameboardContext to compile input (extend buildQuestPromptContext or pass as extra); compileQuestWithAI; create CustomBar; assign to player; return questId.
- **buildQuestPromptContext**: Add optional `gameboardContext?: { parentTitle, parentDescription, period }` to input; append to prompt when present.

### Phase 4: Verification

- `npm run build` and `npm run check`.
- Manual: Complete requires confirm; Admin sees Edit; Add quest opens modal; Create custom → wizard with context; Admin generate → creates quest.

## File Impacts

| File | Action |
|------|--------|
| `src/app/campaign/board/page.tsx` | Use getCurrentPlayerSafe, pass isAdmin |
| `src/app/campaign/board/GameboardClient.tsx` | Confirm on complete; isAdmin + Edit link; Add quest modal |
| `src/app/quest/create/page.tsx` | Read searchParams, pass gameboardContext |
| `src/components/quest-creation/QuestWizard.tsx` | Accept gameboardContext, banner, pre-fill, redirect |
| `src/actions/gameboard.ts` | Add generateGameboardAlignedQuest |
| `src/lib/quest-grammar/buildQuestPromptContext.ts` | Optional gameboardContext in prompt |

## Dependencies

- gameboard-quest-generation (CY) — done
- quest-grammar-compiler (BY) — exists
- random-unpacking-canonical-kernel (CS) — exists
- admin quest edit page — exists
