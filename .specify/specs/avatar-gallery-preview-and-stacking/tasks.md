# Tasks: Avatar Gallery Preview and Sprite Stacking Fix

## Phase 1: Stacking Fix

- [x] In `avatar-utils.ts`, change `nationKey: nationKey || 'unknown'` to `nationKey: nationKey || ''`
- [x] In `avatar-utils.ts`, change `playbookKey: playbookKey || 'unknown'` to `playbookKey: playbookKey || ''`
- [x] In `Avatar.tsx`, add `failedLayers.has('base')` to `showFallback` condition so base failure triggers initials fallback

## Phase 2: Preview in Assign Avatar Form

- [x] Import `deriveAvatarConfig` in `AssignAvatarForm.tsx`
- [x] Add `useMemo` to derive `previewConfig` from `nationId`, `playbookId`, `genderKey`, `nations`, `playbooks`
- [x] Add preview section (e.g. above form) with `<Avatar player={{ name: 'Preview', avatarConfig: previewConfig }} size="xl" />`
- [x] Ensure preview updates when any of nation, playbook, or base variant change

## Verification

- [ ] Playbook-only assign: no 404s, base + playbook layers visible
- [ ] Nation + playbook assign: full composition visible
- [ ] Base fails: initials fallback shown
- [ ] Form dropdown changes: preview updates without submit
- [ ] Assigned avatar matches preview
