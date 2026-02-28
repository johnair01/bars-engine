# Plan: Event Page Campaign Editor

## Summary

Add editable Wake Up and Show Up content to the Instance model; enable admins to edit campaign copy directly from the event page (modal) and from Admin Instances; unblock the invitation-to-donate flow.

## Implementation

### 1. Schema

**File**: `prisma/schema.prisma`

- Add to Instance model:
  - `wakeUpContent` (String?) — main Wake Up paragraph
  - `showUpContent` (String?) — main Show Up paragraph

Run `npm run db:sync`.

### 2. Instance actions

**File**: `src/actions/instance.ts`

- Add `updateInstanceCampaignCopy(instanceId, { wakeUpContent, showUpContent, theme, targetDescription })` — admin-only, updates Instance.
- Update `upsertInstance` to accept and persist wakeUpContent, showUpContent (when form includes them).

### 3. Event page: editable sections

**File**: `src/app/event/page.tsx`

- Add `getCurrentPlayer` with roles check for `isAdmin`.
- Render `instance.wakeUpContent ?? DEFAULT_WAKE_UP` and `instance.showUpContent ?? DEFAULT_SHOW_UP` (constants for current hardcoded text).
- For admins: render `EventCampaignEditor` component (or inline Edit button + modal).

### 4. Event campaign editor component

**File**: Create `src/app/event/EventCampaignEditor.tsx`

- Client component: Edit button (admin only, passed as prop). On click, open modal with form:
  - wakeUpContent (textarea)
  - showUpContent (textarea)
  - theme (input)
  - targetDescription (input)
- Submit: call `updateInstanceCampaignCopy` server action. On success, close modal, revalidate.
- Optional: "Edit in Admin" link to `/admin/instances`.

### 5. Admin Instances form

**File**: `src/app/admin/instances/page.tsx`

- Add wakeUpContent and showUpContent to the create/update form (textarea or input).
- Ensure upsertInstance receives and persists these fields.

### 6. Update upsertInstance

**File**: `src/actions/instance.ts`

- Parse wakeUpContent, showUpContent from FormData in upsertInstance.
- Include in Instance create/update.

### 7. Verification quest

**File**: `scripts/seed-cyoa-certification-quests.ts`

- Add `cert-event-campaign-editor-v1` — Twine story: go to /event, click Edit, update Wake Up content, save, confirm it appears. Narrative: preparing the party for the Bruised Banana Fundraiser.

## File structure

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` |
| Modify | `src/actions/instance.ts` |
| Modify | `src/app/event/page.tsx` |
| Create | `src/app/event/EventCampaignEditor.tsx` |
| Modify | `src/app/admin/instances/page.tsx` |
| Modify | `scripts/seed-cyoa-certification-quests.ts` |

## Default content (fallback)

```ts
const DEFAULT_WAKE_UP = `The Bruised Banana Residency is a creative space and community supporting artists, healers, and changemakers.
Your awareness and participation help the collective thrive.`

const DEFAULT_SHOW_UP = `Contribute money (Sponsor above) or play the game by signing up and choosing your domains.
This instance runs on quests, BARs, vibeulons, and story clock.`
```

## Verification

- Admin visits /event → sees Edit campaign button. Clicks → modal opens. Paste and save → content updates.
- Admin visits /admin/instances → edit instance → wakeUpContent and showUpContent fields present. Save → /event reflects changes.
- Run `npm run seed:cert:cyoa` → cert-event-campaign-editor-v1 appears.

## Reference

- Spec: [.specify/specs/event-page-campaign-editor/spec.md](spec.md)
- Bruised Banana campaign: [.specify/specs/bruised-banana-donation/spec.md](../bruised-banana-donation/spec.md)
