# Plan: Admin Mobile Readiness

## Summary

Enable all post-launch admin updates from the app on mobile: instance edit with prefill, quick donation progress update, mint/transfer without `prompt()`. Add verification quest for mobile-admin flows.

## Implementation

### 1. Instance actions: update path and new action

**File**: `src/actions/instance.ts`

- Update `upsertInstance` update path (when `id` is set): add `storyBridgeCopy` and `campaignRef` to the `data` object so full instance edit is possible.
- Add `updateInstanceFundraise(instanceId, { currentAmountCents?, goalAmountCents? })` — admin-only server action. Parses FormData or accepts object. Updates Instance with provided fields. Revalidates `/admin/instances`, `/event`, `/`.

### 2. Admin Instances: Edit with prefill

**File**: `src/app/admin/instances/page.tsx`

- Add "Edit" button per instance in the list. On click, open a modal (or expand inline form) with all instance fields pre-filled.
- Modal/form: same fields as create form (slug, name, domainType, theme, targetDescription, wakeUpContent, showUpContent, storyBridgeCopy, campaignRef, goalAmount, currentAmount, stripeOneTimeUrl, patreonUrl, venmoUrl, cashappUrl, paypalUrl, kotterStage, isEventMode). Hidden input `id` with instance id.
- Submit: call `upsertInstance` with form data including `id`. On success, close modal, revalidate.
- Option: extract InstanceEditForm as a client component to avoid duplicating form markup.

### 3. Quick donation progress update

**File**: `src/app/event/page.tsx`

- For admins: add a compact "Update progress" section (collapsible or always visible) with:
  - currentAmount (number input, `inputMode="decimal"`)
  - goalAmount (number input, optional)
  - "Save" button
- Form action: `updateInstanceFundraise` with active instance id.

**File**: `src/app/admin/instances/page.tsx`

- Per instance in list: add "Update $" or "Progress" button that opens a small inline form or modal with currentAmount, goalAmount. Submit calls `updateInstanceFundraise(instanceId, ...)`.

### 4. AdminPlayerEditor: replace prompt() with inline inputs

**File**: `src/components/admin/AdminPlayerEditor.tsx`

- **Mint**: Replace `handleMint` that uses `prompt()`. Add:
  - Number input (default 1, `inputMode="numeric"`)
  - "Mint" button
  - On submit: parse amount, call `adminMintVibulons`, show feedback.
- **Transfer**: Replace `handleTransfer` that uses `prompt()`. Add:
  - Target player select (dropdown of players, or searchable) — need `getAdminPlayers` or pass players list
  - Amount input
  - "Transfer" button
  - On submit: call `adminTransferVibulons(player.id, targetId, amount)`.

Note: AdminPlayerEditor receives `player` and `worldData`. For transfer target, we need a list of players. Options: (a) pass `players` from parent (Admin Players page has it), (b) call `getAdminPlayers()` in the modal. Option (a) is simpler — Admin Players page already fetches players; pass them to AdminPlayerEditor.

### 5. Verification quest

**File**: `scripts/seed-cyoa-certification-quests.ts`

- Add `cert-admin-mobile-readiness-v1` — Twine story with passages:
  - Step 1: Go to Admin → Instances. Click Edit on an instance. Confirm form is pre-filled. Save. (Or: update one field and save.)
  - Step 2: Go to /event. Use "Update progress" to set currentAmount. Confirm progress bar updates.
  - Step 3: Go to Admin → Players. Open a player. Use inline Mint input (no prompt). Mint 1 vibeulon. Confirm wallet updates.
  - Final passage: no link; completing mints reward.
- Narrative: "Verify the admin console works on mobile so the residency team can manage the Bruised Banana Fundraiser from anywhere."

### 6. Mobile UX polish (optional)

- Ensure primary admin buttons have `min-h-[44px]` or `py-3` for touch targets.
- Verify modals use `max-h-[90vh] overflow-y-auto`.

## File structure

| Action | File |
|--------|------|
| Modify | `src/actions/instance.ts` |
| Modify | `src/app/admin/instances/page.tsx` |
| Modify | `src/app/event/page.tsx` |
| Modify | `src/components/admin/AdminPlayerEditor.tsx` |
| Modify | `src/app/admin/players/page.tsx` (pass players to AdminPlayerEditor for transfer target) |
| Modify | `scripts/seed-cyoa-certification-quests.ts` |

## Verification

- Admin on mobile (or narrow viewport): Edit instance → form pre-filled → save → instance updated.
- Admin on /event: Update progress → currentAmount, goalAmount → save → progress bar reflects change.
- Admin on Admin → Instances: Quick "Update progress" per instance → save.
- Admin on Admin → Players → [player]: Mint via inline input (no prompt). Transfer via inline inputs.
- Run `npm run seed:cert:cyoa` → cert-admin-mobile-readiness-v1 appears.

## Reference

- Spec: [.specify/specs/admin-mobile-readiness/spec.md](spec.md)
- Event campaign editor: [.specify/specs/event-page-campaign-editor/spec.md](../event-page-campaign-editor/spec.md)
