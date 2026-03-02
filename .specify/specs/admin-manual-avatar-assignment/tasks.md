# Tasks: Admin Manual Avatar Assignment

## Phase 1: Avatar Utils

- [x] Add `genderKey?: AvatarConfig['genderKey']` to `DeriveAvatarConfigOptions` in avatar-utils.ts
- [x] In `deriveAvatarConfig`, use `options?.genderKey` when set instead of `deriveGenderFromPronouns`

## Phase 2: Server Actions

- [x] Add `assignAvatarToPlayer(playerId, { nationId?, playbookId?, genderKey? })` in admin.ts
- [x] Extend `updatePlayerProfile` to derive and save `avatarConfig` when nation/playbook change

## Phase 3: Assign Avatar Form

- [x] Create `AssignAvatarForm` client component with player/nation/playbook/base selects
- [x] Add AssignAvatarForm to Avatar Gallery page above the grid
- [x] Fetch nations and playbooks for the form (getAdminWorldData or inline)

## Phase 4: Verification Quest

- [x] Add `cert-admin-manual-avatar-v1` to CERT_QUEST_IDS in seed-cyoa-certification-quests.ts
- [x] Add Twine passages and CustomBar for the certification quest

## Verification

- [ ] Admin can assign avatar from Avatar Gallery and see result in grid
- [ ] Admin can update nation/playbook in Player Editor and avatar updates
- [ ] Certification quest completes and grants reward
