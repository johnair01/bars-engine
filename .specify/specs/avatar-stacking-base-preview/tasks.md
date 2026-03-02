# Tasks: Avatar Stacking Fix and Base-Only Preview

## Phase 1: Base-Only Preview

- [x] In `avatar-utils.ts`, update `parseAvatarConfig` to accept configs with empty nationKey and playbookKey (base-only)
- [x] In `AssignAvatarForm.tsx`, when `!nationId && !playbookId`, build base-only config and pass to preview instead of null
- [x] Ensure base variant dropdown affects base-only preview (genderKey in config)

## Phase 2: Stacking Fix

- [x] In `Avatar.tsx`, add `bg-zinc-900` to the avatar container div(s) so transparent areas show solid background

## Verification

- [ ] Clear nation and archetype: preview shows base avatar (not initials)
- [ ] Select Argyra + Bold Heart: preview shows base + nation + playbook layers (or document if asset opacity is the blocker)
- [ ] Base variant change: preview updates when default/male/female/neutral selected
