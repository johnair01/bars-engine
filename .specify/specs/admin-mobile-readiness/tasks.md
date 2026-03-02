# Tasks: Admin Mobile Readiness

## Phase 1: Instance actions
- [x] Add `storyBridgeCopy` and `campaignRef` to `upsertInstance` update path when `id` is set
- [x] Add `updateInstanceFundraise(instanceId, { currentAmountCents?, goalAmountCents? })` server action (admin-only)

## Phase 2: Instance edit with prefill
- [x] Add "Edit" button per instance on Admin Instances page
- [x] Create InstanceEditModal or inline form with all fields pre-filled from selected instance
- [x] Submit calls `upsertInstance` with instance `id`; close modal on success

## Phase 3: Quick donation progress
- [x] Add "Update progress" form on /event (admin only): currentAmount, goalAmount
- [x] Add "Update progress" control per instance on Admin Instances list
- [x] Both call `updateInstanceFundraise`

## Phase 4: AdminPlayerEditor — replace prompt()
- [x] Replace Mint `prompt()` with inline number input + "Mint" button
- [x] Replace Transfer `prompt()` with inline inputs: target player select, amount
- [x] Pass players list to AdminPlayerEditor from Admin Players page (for transfer target dropdown)

## Phase 5: Verification quest
- [x] Add cert-admin-mobile-readiness-v1 to seed-cyoa-certification-quests.ts
- [x] Twine passages: edit instance (prefill), update progress, mint via inline input
- [x] Narrative: residency team manages fundraiser from anywhere

## Phase 6: Mobile UX polish (optional)
- [x] Ensure primary admin buttons have min 44px touch target
- [x] Verify modals use max-h-[90vh] overflow-y-auto

## Verification
- Admin: Edit instance → pre-filled form → save
- Admin: /event Update progress → progress bar updates
- Admin: Instances list → Update progress per instance
- Admin: Players → Mint/Transfer via inline inputs (no prompt)
- Run `npm run seed:cert:cyoa` → cert-admin-mobile-readiness-v1 appears
