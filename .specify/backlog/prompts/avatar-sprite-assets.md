# Prompt: Avatar Sprite Assets

**Use this prompt when generating or sourcing sprite assets for the JRPG composable avatar.**

## Context

The avatar system supports layered sprites (base, nation_body, playbook_outfit, nation_accent, playbook_accent). Paths are defined in `avatar-parts.ts`. Missing assets fall back to initials. This spec adds the base layer assets and documents LPC sourcing for future layers.

## Prompt text

> Create avatar sprite assets. Add 4 base layer PNGs (default, male, female, neutral) to public/sprites/parts/base/ — 64x64 pixels, transparent background. Use AI image generation or LPC 4wall.ai. Create docs/SPRITE_ASSETS.md with asset layout, LPC workflow, attribution, and nation/playbook key reference table.

## Checklist

- [ ] base/default.png, base/male.png, base/female.png, base/neutral.png (64x64, transparent)
- [ ] docs/SPRITE_ASSETS.md: layout, LPC workflow, attribution, key reference

## Reference

- Spec: [.specify/specs/avatar-sprite-assets/spec.md](../specs/avatar-sprite-assets/spec.md)
- Plan: [.specify/specs/avatar-sprite-assets/plan.md](../specs/avatar-sprite-assets/plan.md)
- Tasks: [.specify/specs/avatar-sprite-assets/tasks.md](../specs/avatar-sprite-assets/tasks.md)
- Extends: [jrpg-composable-sprite-avatar](../specs/jrpg-composable-sprite-avatar/spec.md)
