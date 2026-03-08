# Spec: Gameboard UI Update — Completion Validation, Admin Edit, Add Quest Modal

## Purpose

Improve the gameboard UX to prevent accidental quest completions, enable admin editing, consolidate add-quest actions into a modal, and support quest creation from the wizard with gameboard context—including an admin-only grammatical quest generator aligned with nation, playbook, and gameboard state.

## Context / Goal

- **Gameboard** = 8 slots per period; campaign quests complete here. Players can attach existing quests or create subquests.
- **Current gap**: (1) Complete button has no confirmation—accidental clicks complete quests; (2) Admins cannot edit quests from the board; (3) Two separate buttons ("Add your quest", "Add subquest") clutter the card; (4) No way to create a quest from the wizard with gameboard context; (5) No admin path to generate grammatical quests aligned with player + gameboard.
- **Model**: Bruised Banana Residency, GATHERING_RESOURCES, Kotter 8-stage alignment.

## User Stories

### P1: Completion validation

**As a player**, I want to confirm before completing a gameboard quest, so I don't accidentally complete one I haven't done.

**Acceptance**: Clicking "Complete" shows a confirmation (e.g. "Are you sure you completed this quest?") before the action runs.

### P2: Admin edit from gameboard

**As an admin**, I want to edit gameboard quests directly from the board, so I can fix descriptions or metadata without leaving the flow.

**Acceptance**: When admin, each quest card shows an "Edit" link to `/admin/quests/[questId]`.

### P3: Add quest modal

**As a player**, I want a single "Add quest" button that opens a modal with options, so the card is less cluttered and the flow is clearer.

**Acceptance**: One "Add quest (1v)" button opens a modal with:
- **Attach existing quest** — pick from player's campaign-tagged quests.
- **Create new quest** — sub-options:
  - Quick subquest (inline title + description, calls `createSubQuest`).
  - Full wizard (navigate to `/quest/create?from=gameboard&questId=...&slotId=...&campaignRef=...`).
  - (Admin only) Generate grammatical quest — creates quest aligned with nation, playbook, gameboard state.

### P4: Quest wizard with gameboard context

**As a player**, I want the quest wizard to know I came from a gameboard quest, so it can pre-fill campaign context and return me appropriately.

**Acceptance**: `/quest/create?from=gameboard&questId=X&slotId=Y&campaignRef=Z` shows a banner with parent quest; wizard pre-fills campaignRef/campaignGoal; on create, redirect to `/campaign/board?ref=Z`.

### P5: Admin grammatical quest generation

**As an admin**, I want to generate a grammatical quest aligned with the player's nation, playbook, and current gameboard state, so we can add high-quality content without manual unpacking.

**Acceptance**: Admin-only "Generate grammatical quest" in the Add quest modal calls a server action that uses `generateRandomUnpacking` + `compileQuestWithAI` with gameboard context; creates quest; assigns to player; optionally attaches to slot.

## Functional Requirements

### FR1: Completion validation

- Before calling `completeGameboardQuest`, show confirmation (native `confirm()` or modal).
- On cancel, do nothing.

### FR2: Admin edit link

- Gameboard page fetches `isAdmin` via `getCurrentPlayerSafe({ includeRoles: true })`.
- Pass `isAdmin` to `GameboardClient`.
- When `isAdmin` and slot has quest, render Link to `/admin/quests/${quest.id}` (styled like QuestDetailModal Edit link).

### FR3: Add quest modal

- Replace "Add your quest" and "Add subquest" with one "Add quest (1v)" button.
- On click, open modal with:
  - Attach existing: list from `getPlayerCampaignQuestsForSlot`; select → `attachQuestToSlot`.
  - Create new:
    - Quick subquest: inline form (title, description) → `createSubQuest(parentId, { title, description })`.
    - Full wizard: `router.push('/quest/create?from=gameboard&questId=...&slotId=...&campaignRef=...')`.
    - (Admin) Generate grammatical: call `generateGameboardAlignedQuest(parentQuestId, slotId, campaignRef)`.

### FR4: Quest wizard context

- `/quest/create` reads searchParams: `from`, `questId`, `slotId`, `campaignRef`.
- Pass `gameboardContext` to `QuestWizard`.
- Wizard shows banner when context present; pre-fills campaign fields; redirects to gameboard after create.

### FR5: Generate gameboard-aligned quest (admin)

- New server action: `generateGameboardAlignedQuest(parentQuestId, slotId, campaignRef)`.
- Verify admin; fetch player (nation, playbook), parent quest, instance (period).
- Use `generateRandomUnpacking` with player context.
- Extend compile input with gameboard theme (parent title/description, period).
- Call `compileQuestWithAI`; create CustomBar; assign to player; optionally attach to slot.
- Return `{ success: true, questId }` or `{ error }`.

## API Contracts

### generateGameboardAlignedQuest (new)

```ts
function generateGameboardAlignedQuest(
  parentQuestId: string,
  slotId: string,
  campaignRef: string
): Promise<{ success: true; questId: string } | { error: string }>
```

- Admin-only. Uses nation/playbook for unpacking; gameboard context for prompt.

### QuestWizard props (extended)

```ts
gameboardContext?: {
  questId: string
  slotId: string
  campaignRef: string
  parentTitle?: string
}
```

## References

- [Gameboard Quest Generation](../gameboard-quest-generation/spec.md)
- [Gameboard and Campaign Deck](../gameboard-campaign-deck/spec.md)
- [Quest Grammar Compiler](../quest-grammar-compiler/spec.md)
- [Random Unpacking Canonical Kernel](../random-unpacking-canonical-kernel/spec.md)
- Quest nesting: [src/actions/quest-nesting.ts](../../src/actions/quest-nesting.ts)
- Admin quest edit: [src/app/admin/quests/[id]/page.tsx](../../src/app/admin/quests/[id]/page.tsx)
