# Prompt: Admin Manual Avatar Assignment

**Use this prompt when implementing admin manual avatar assignment for testing sprite stacking.**

## Context

1. **Perceived**: Admins cannot assign avatars to accounts without going through the character-generation quest. **Expected**: Admin should be able to manually set avatar config (nation, playbook, base variant) on any player for testing.
2. **Perceived**: No way to verify sprite assets stack correctly from the UI. **Expected**: Admin assigns avatar from Avatar Gallery, sees result immediately in the grid.
3. **Perceived**: Changing nation/playbook in Player Editor does not update avatar. **Expected**: `updatePlayerProfile` should derive and save `avatarConfig` when nation/playbook change.

## Prompt text

> Implement admin manual avatar assignment: add an "Assign Avatar" form to /admin/avatars with player, nation, playbook, and base variant (default/male/female/neutral) selects. On submit, update player.avatarConfig via deriveAvatarConfig; grid refreshes to show the new avatar. Extend updatePlayerProfile so that when nation or playbook is changed in Admin Player Editor, avatarConfig is derived and saved. Add optional genderKey override to deriveAvatarConfig options. Add verification quest cert-admin-manual-avatar-v1 that walks through assigning an avatar and confirming it appears in the Avatar Gallery.

## Checklist

- [ ] genderKey in DeriveAvatarConfigOptions (avatar-utils)
- [ ] assignAvatarToPlayer server action
- [ ] updatePlayerProfile derives and saves avatarConfig
- [ ] AssignAvatarForm component on Avatar Gallery
- [ ] router.refresh() on success so grid updates
- [ ] cert-admin-manual-avatar-v1 verification quest

## Reference

- Spec: [.specify/specs/admin-manual-avatar-assignment/spec.md](../specs/admin-manual-avatar-assignment/spec.md)
- Avatar Gallery: [src/app/admin/avatars/page.tsx](../../src/app/admin/avatars/page.tsx)
- Admin actions: [src/actions/admin.ts](../../src/actions/admin.ts)
