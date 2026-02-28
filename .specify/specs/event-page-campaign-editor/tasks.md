# Tasks: Event Page Campaign Editor

## Phase 1: Schema
- [x] Add `wakeUpContent` (String?) and `showUpContent` (String?) to Instance in prisma/schema.prisma
- [x] Run `npm run db:sync`

## Phase 2: Instance actions
- [x] Add `updateInstanceCampaignCopy` server action (admin-only)
- [x] Update `upsertInstance` to accept and persist wakeUpContent, showUpContent

## Phase 3: Event page
- [x] Add isAdmin check; pass to EventCampaignEditor
- [x] Render instance.wakeUpContent ?? DEFAULT_WAKE_UP
- [x] Render instance.showUpContent ?? DEFAULT_SHOW_UP
- [x] Create EventCampaignEditor component (Edit button + modal with form)
- [x] Add optional "Edit in Admin" link

## Phase 4: Admin Instances

- [x] Add wakeUpContent and showUpContent fields to form
- [x] Ensure upsertInstance persists them

## Phase 5: Verification quest
- [x] Add cert-event-campaign-editor-v1 to seed-cyoa-certification-quests.ts
- [x] Twine story: edit campaign copy on /event, confirm change

## Verification
- Admin on /event: Edit button → modal → paste → save → content updates
- Admin on /admin/instances: edit instance → wakeUpContent, showUpContent → save
- Run `npm run seed:cert:cyoa` → certification quest appears
