# Spec Kit Prompt: Avatar Overwrite, Transparency, and Size Fix

## Role

Fix avatar layers that overwrite instead of stack when selecting nation or archetype. Address transparency, simplify overlay objects to fit base proportions, provide ChatGPT prompts for asset generation, consider avatar size increase.

## Objective

Implement per [.specify/specs/avatar-overwrite-transparency-fix/spec.md](../specs/avatar-overwrite-transparency-fix/spec.md). Root cause: nation/archetype assets likely have opaque backgrounds or are full-character sprites instead of partial overlays.

## Requirements

- **Overlay-only**: Nation and playbook sprites must be partial overlays (clothing, badge), not full characters. Transparent everywhere except overlay region.
- **Proportions**: Content must fit base-silhouette.json regions (nation_body 28×33, nation_accent 8×8, etc.)
- **ChatGPT prompts**: Document prompts for generating base-aligned overlays
- **Placeholders**: Regenerate with npm run sprites:nation-placeholders as reference
- **Optional**: Increase Avatar display sizes (sm/md/lg) for readability

## Deliverables

- [ ] CHATGPT_PROMPTS.md in spec folder
- [ ] SPRITE_ASSETS.md overlay-only section
- [ ] Placeholder regeneration and verification
- [ ] (Optional) Avatar sizeClasses update
- [ ] Test with one AI-generated overlay

## Reference

- Spec: [.specify/specs/avatar-overwrite-transparency-fix/spec.md](../specs/avatar-overwrite-transparency-fix/spec.md)
- Plan: [.specify/specs/avatar-overwrite-transparency-fix/plan.md](../specs/avatar-overwrite-transparency-fix/plan.md)
- base-silhouette.json: [public/sprites/parts/base-silhouette.json](../../public/sprites/parts/base-silhouette.json)
