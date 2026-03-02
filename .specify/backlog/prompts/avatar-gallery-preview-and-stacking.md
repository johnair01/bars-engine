# Prompt: Avatar Gallery Preview and Sprite Stacking Fix

**Use this prompt when implementing the avatar preview and stacking fix for the Avatar Gallery.**

## Context

1. **Perceived**: Avatar layers appear to replace each other instead of compositing—only the top layer (e.g. playbook_accent heart) is visible. **Expected**: Base + nation + playbook layers should stack with transparent overlays showing layers below.
2. **Perceived**: No preview before assigning; admins must assign to a player to see the result. **Expected**: Assign Avatar form shows a live preview of the composed avatar as nation, playbook, and base variant are selected.
3. **Root cause (stacking)**: When only playbook is selected, `nationKey: 'unknown'` causes 404s for `nation_body/unknown.png`. Base layer failure leaves only accent visible.

## Prompt text

> Implement avatar gallery preview and stacking fix: (1) In deriveAvatarConfig, use empty string for nationKey/playbookKey when not selected instead of 'unknown', so getAvatarPartSpecs skips nation layers and avoids 404s. (2) In Avatar component, when base layer fails to load, show initials fallback instead of partial avatar. (3) Add live preview to AssignAvatarForm: derive previewConfig from form state (nationId, playbookId, genderKey) via deriveAvatarConfig, render Avatar with that config; preview updates when dropdowns change. Preview appears above the form, no player selection required.

## Checklist

- [ ] avatar-utils: nationKey/playbookKey empty instead of 'unknown'
- [ ] Avatar.tsx: failedLayers.has('base') triggers full fallback
- [ ] AssignAvatarForm: useMemo for previewConfig from form state
- [ ] AssignAvatarForm: preview section with Avatar size xl
- [ ] Preview updates on nation/playbook/base change

## Reference

- Spec: [.specify/specs/avatar-gallery-preview-and-stacking/spec.md](../specs/avatar-gallery-preview-and-stacking/spec.md)
- Assign form: [src/components/admin/AssignAvatarForm.tsx](../../src/components/admin/AssignAvatarForm.tsx)
- Avatar: [src/components/Avatar.tsx](../../src/components/Avatar.tsx)
