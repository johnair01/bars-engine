# Prompt: Avatar Stacking Fix and Base-Only Preview

**Use this prompt when implementing base-only preview and stacking fix for the Avatar Gallery.**

## Context

1. **Perceived**: When nation and archetype are unselected, the preview shows initials instead of the base avatar. **Expected**: Preview shows the base model (default or selected gender variant) so admins can verify it before adding overlays.
2. **Perceived**: When Argyra + Bold Heart are selected, only the red heart accent appears on a checkered background—no base, no nation layers. **Expected**: Base + nation_body + playbook_outfit + nation_accent + playbook_accent stacked in order.
3. **Root causes**: (a) deriveAvatarConfig returns null when both nation and playbook are unselected; (b) parseAvatarConfig rejects configs with empty nationKey/playbookKey; (c) avatar container may lack solid background so transparency shows checkered; (d) overlay assets may have opaque backgrounds (asset issue).

## Prompt text

> Implement avatar stacking fix and base-only preview: (1) In parseAvatarConfig, accept configs with empty nationKey and playbookKey (base-only). (2) In AssignAvatarForm, when nationId and playbookId are both empty, build base-only config (nationKey: '', playbookKey: '', genderKey, variant: 'default') and pass to preview instead of null. (3) In Avatar component, add bg-zinc-900 to the avatar container so transparent sprite areas show a solid background. Verify: base-only preview when nothing selected; full stacking when nation/archetype selected. If stacking still fails, document overlay asset transparency requirements.

## Checklist

- [ ] avatar-utils: parseAvatarConfig accepts base-only config
- [ ] AssignAvatarForm: base-only previewConfig when !nationId && !playbookId
- [ ] Avatar.tsx: bg-zinc-900 on container
- [ ] Base variant affects base-only preview
- [ ] Full stacking visible when nation + archetype selected (or asset audit if not)

## Reference

- Spec: [.specify/specs/avatar-stacking-base-preview/spec.md](../specs/avatar-stacking-base-preview/spec.md)
- Assign form: [src/components/admin/AssignAvatarForm.tsx](../../src/components/admin/AssignAvatarForm.tsx)
- Avatar: [src/components/Avatar.tsx](../../src/components/Avatar.tsx)
- Sprite assets: [docs/SPRITE_ASSETS.md](../../docs/SPRITE_ASSETS.md)
