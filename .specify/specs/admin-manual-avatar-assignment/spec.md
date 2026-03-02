# Spec: Admin Manual Avatar Assignment

## Purpose

Enable admins to manually assign avatar config (nation, playbook, base variant) to any player for testing, without going through the character-generation quest flow. This supports verifying sprite stacking in the Avatar Gallery when developing or replacing sprite assets.

## Rationale

- **Testing workflow**: Admins need to quickly assign avatars to accounts to verify that sprite layers (base → nation_body → playbook_outfit → nation_accent → playbook_accent) stack correctly. Currently avatars are only set via the quest flow; there is no direct UI path.
- **Asset verification**: When uploading or replacing sprites at `/admin/avatars/assets`, admins must confirm composition in the Avatar Gallery. Without manual assignment, they cannot test combinations on real player records.
- **Data consistency**: When admins edit nation/playbook in the Player Editor, `avatarConfig` should be derived and saved so the avatar reflects the change.

## Expected Behavior

1. **Avatar Gallery**: An "Assign Avatar" section lets admins pick a player, nation, playbook, and base variant; on save, the player's `avatarConfig` is updated and the avatar appears in the grid.
2. **Player Editor**: When nation or playbook is changed in Admin Players, `avatarConfig` is derived and saved automatically.
3. **Verification quest**: A certification quest walks admins through assigning an avatar and confirming it appears in the Avatar Gallery.

## User Stories

### P1: Admin assigns avatar from Avatar Gallery

**As an admin**, I can assign an avatar to any player from the Avatar Gallery page, so I can verify sprite stacking without running the character-generation quest.

**Acceptance**: Avatar Gallery includes an "Assign Avatar" form: player dropdown, nation dropdown, playbook dropdown, base variant (default/male/female/neutral). On submit, `player.avatarConfig` is updated; the grid refreshes and shows the new avatar.

### P2: Player Editor updates avatar when nation/playbook change

**As an admin**, when I change a player's nation or archetype in the Player Editor, their avatar updates to match.

**Acceptance**: `updatePlayerProfile` derives `avatarConfig` from nation/playbook names and saves it alongside `nationId`/`playbookId`. Avatar Gallery and dashboard reflect the change.

### P3: Verification quest

**As a tester**, I can complete a certification quest that verifies the admin manual avatar assignment flow.

**Acceptance**: Quest `cert-admin-manual-avatar-v1` walks through: open Avatar Gallery, use Assign Avatar form to set nation/playbook/base on a player, confirm avatar appears in grid. Completing the quest grants a vibeulon reward.

## Functional Requirements

- **FR1**: Admin MUST have an "Assign Avatar" form on `/admin/avatars` with: player select, nation select, playbook select, base variant select (default, male, female, neutral).
- **FR2**: Submitting the form MUST call a server action that updates `player.avatarConfig` (and optionally `nationId`/`playbookId` for consistency). At least nation OR playbook must be selected.
- **FR3**: `updatePlayerProfile` MUST derive and save `avatarConfig` when `nationId` or `playbookId` is provided. Use `deriveAvatarConfig` with nation/playbook names from DB.
- **FR4**: `deriveAvatarConfig` options MUST support optional `genderKey` override for admin-selected base variant.
- **FR5**: Verification quest `cert-admin-manual-avatar-v1` MUST exist: Twine story with steps to assign avatar and confirm in Avatar Gallery; CustomBar with `isSystem: true`, `visibility: 'public'`, deterministic id.

## Non-functional Requirements

- No schema changes; uses existing `Player.avatarConfig`, `nationId`, `playbookId`.
- Reuse `deriveAvatarConfig` from `avatar-utils`; extend options for `genderKey` override.
- Admin-gated; layout already gates `/admin` routes.

## AvatarConfig Reference

From [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts):

```ts
{ nationKey, playbookKey, domainKey?, variant, genderKey?: 'male'|'female'|'neutral'|'default' }
```

Layers: base (genderKey) → nation_body → playbook_outfit → nation_accent → playbook_accent.

## Reference

- Avatar Gallery: [src/app/admin/avatars/page.tsx](../../src/app/admin/avatars/page.tsx)
- Avatar utils: [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts)
- Admin actions: [src/actions/admin.ts](../../src/actions/admin.ts)
- Player Editor: [src/components/admin/AdminPlayerEditor.tsx](../../src/components/admin/AdminPlayerEditor.tsx)
