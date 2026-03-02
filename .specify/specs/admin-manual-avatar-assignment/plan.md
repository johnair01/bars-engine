# Plan: Admin Manual Avatar Assignment

## Summary

1. **Extend avatar-utils**: Add `genderKey` to `DeriveAvatarConfigOptions` so admins can override base variant.
2. **Server action**: Add `assignAvatarToPlayer`; extend `updatePlayerProfile` to derive and save `avatarConfig`.
3. **Assign Avatar form**: Client component on Avatar Gallery with player/nation/playbook/base selects.
4. **Verification quest**: Add `cert-admin-manual-avatar-v1` to seed script.

## Phase 1: Avatar Utils

### 1.1 Add genderKey to DeriveAvatarConfigOptions

**File**: [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts)

- Add `genderKey?: AvatarConfig['genderKey']` to `DeriveAvatarConfigOptions`.
- In `deriveAvatarConfig`, when `options?.genderKey` is set, use it instead of `deriveGenderFromPronouns(options?.pronouns)`.

## Phase 2: Server Actions

### 2.1 assignAvatarToPlayer

**File**: [src/actions/admin.ts](../../src/actions/admin.ts)

- New action: `assignAvatarToPlayer(playerId, { nationId?, playbookId?, genderKey? })`
- Resolve Nation/Playbook by ID to get names.
- Call `deriveAvatarConfig(nationId, playbookId, null, { nationName, playbookName, pronouns: player.pronouns, genderKey })`.
- If both nationId and playbookId are empty, return error (need at least one).
- Update `player.avatarConfig`, `nationId`, `playbookId`.
- Revalidate `/admin/avatars`, `/admin/players`.

### 2.2 Extend updatePlayerProfile

**File**: [src/actions/admin.ts](../../src/actions/admin.ts)

- When `nationId` or `playbookId` is provided, fetch player with nation/playbook includes.
- Call `deriveAvatarConfig` with `{ nationName, playbookName, pronouns }`.
- Include `avatarConfig` in the update payload when derived config is non-null.
- When both are cleared, set `avatarConfig` to null.

## Phase 3: Assign Avatar Form

### 3.1 AssignAvatarForm component

**File**: [src/components/admin/AssignAvatarForm.tsx](../../src/components/admin/AssignAvatarForm.tsx) (new)

- Client component. Props: `players`, `nations`, `playbooks`.
- Player select (dropdown, show name + contactValue).
- Nation select, Playbook select, Base variant select (default, male, female, neutral).
- Submit button; on submit call `assignAvatarToPlayer`.
- Show success/error feedback (toast or inline message).
- Use `useTransition` for pending state.

### 3.2 Integrate into Avatar Gallery

**File**: [src/app/admin/avatars/page.tsx](../../src/app/admin/avatars/page.tsx)

- Fetch nations and playbooks (inline or via `getAdminWorldData`).
- Pass players, nations, playbooks to `AssignAvatarForm`.
- Render form above the avatar grid in a collapsible or prominent section.

## Phase 4: Verification Quest

### 4.1 Add cert-admin-manual-avatar-v1

**File**: [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts)

- Add `cert-admin-manual-avatar-v1` to `CERT_QUEST_IDS`.
- Add Twine passages: START → Step 1 (open Avatar Gallery) → Step 2 (use Assign Avatar form) → Step 3 (confirm avatar in grid) → END_SUCCESS.
- Create TwineStory and CustomBar with `isSystem: true`, `visibility: 'public'`, reward 1.
- Frame narrative: "Verify admin avatar assignment so we can test sprite stacking for the party."

## File Structure

| Action | File |
|--------|------|
| Modify | [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts) — add genderKey to options |
| Modify | [src/actions/admin.ts](../../src/actions/admin.ts) — assignAvatarToPlayer, extend updatePlayerProfile |
| Create | [src/components/admin/AssignAvatarForm.tsx](../../src/components/admin/AssignAvatarForm.tsx) |
| Modify | [src/app/admin/avatars/page.tsx](../../src/app/admin/avatars/page.tsx) — add AssignAvatarForm |
| Modify | [scripts/seed-cyoa-certification-quests.ts](../../scripts/seed-cyoa-certification-quests.ts) — add cert quest |

## Verification

- Admin: open /admin/avatars → see Assign Avatar form → pick player, nation, playbook, base → submit → avatar appears in grid.
- Admin: open /admin/players → edit player nation/playbook → save → avatar updates in Avatar Gallery.
- Admin: complete cert-admin-manual-avatar-v1 → receive vibeulon reward.
