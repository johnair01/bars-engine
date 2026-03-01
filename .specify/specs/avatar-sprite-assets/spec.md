# Spec: Avatar Sprite Assets

## Purpose

Provide PNG sprite assets for the JRPG composable avatar so layered rendering displays real artwork instead of falling back to initials. Start with base layer (default, male, female, neutral); document paths for nation and playbook layers.

**Extends**: [JRPG Composable Sprite Avatar](../jrpg-composable-sprite-avatar/spec.md) (AT)

## Rationale

- **Progressive enhancement**: Avatar component and OnboardingAvatarPreview already support layered sprites; missing assets fall back to initials. Adding assets improves the experience without code changes.
- **Two sourcing paths**: AI-generated art for quick placeholders; LPC (Liberated Pixel Cup) for license-friendly, professional pixel art.
- **Stable layout**: All layers use 64x64 PNG with transparent backgrounds; paths follow `avatar-parts.ts` conventions.

## Conceptual Model (Game Language)

| Dimension | Maps to |
|-----------|---------|
| **Identity** (base) | base/default.png, base/male.png, base/female.png, base/neutral.png |
| **WHO** (Nation) | nation_body/{nationKey}.png, nation_accent/{nationKey}.png |
| **WHO** (Archetype) | playbook_outfit/{playbookKey}.png, playbook_accent/{playbookKey}.png |

## User Stories

### P1: Base layer assets

**As a player**, I want the base avatar layer to render as a sprite (not initials), so my character has a visual foundation before nation/playbook layers load.

**Acceptance**: `public/sprites/parts/base/{default,male,female,neutral}.png` exist; Avatar and OnboardingAvatarPreview render base layer when assets load.

### P2: LPC sourcing path

**As a contributor**, I want documented steps to source LPC-derived assets, so I can add professional pixel art with correct licensing.

**Acceptance**: `docs/SPRITE_ASSETS.md` includes LPC 4wall.ai workflow, attribution requirements, and nation/playbook key reference.

### P3: Nation and playbook key reference

**As a contributor**, I want a reference table of slugified keys for nations and playbooks, so I can name assets correctly.

**Acceptance**: docs/SPRITE_ASSETS.md lists nation keys (argyra, pyrakanth, virelune, meridia, lamenth) and playbook keys (bold-heart, devoted-guardian, etc.).

## Functional Requirements

- **FR1**: Base layer MUST include four PNGs: `default.png`, `male.png`, `female.png`, `neutral.png` in `public/sprites/parts/base/`.
- **FR2**: All sprite assets MUST be 64x64 pixels with transparent backgrounds for proper layering.
- **FR3**: Create `docs/SPRITE_ASSETS.md` with: asset layout, LPC 4wall.ai workflow, attribution (CC-BY-SA 3.0 / GPL 3.0), nation/playbook key reference.
- **FR4**: Assets MAY be AI-generated (placeholders) or LPC-derived; both paths documented.

## Asset Directory Structure

```
public/sprites/parts/
  base/       default.png, male.png, female.png, neutral.png
  nation_body/  argyra.png, pyrakanth.png, virelune.png, meridia.png, lamenth.png
  nation_accent/
  playbook_outfit/
  playbook_accent/
```

Base layer is in scope for this spec. Nation and playbook layers are documented for future implementation.

## Nation and Playbook Keys (Reference)

| Nation (name) | nationKey |
|---------------|-----------|
| Argyra | argyra |
| Pyrakanth | pyrakanth |
| Virelune | virelune |
| Meridia | meridia |
| Lamenth | lamenth |

| Playbook (name) | playbookKey |
|-----------------|-------------|
| The Bold Heart | bold-heart |
| The Devoted Guardian | devoted-guardian |
| The Decisive Storm | decisive-storm |
| The Danger Walker | danger-walker |
| The Still Point | still-point |
| The Subtle Influence | subtle-influence |
| The Truth Seer | truth-seer |
| The Joyful Connector | joyful-connector |

## Non-functional Requirements

- Fallback MUST continue to work when assets are missing (no regression).
- LPC assets require attribution: Curt, opengameart.org, LPC; CC-BY-SA 3.0 / GPL 3.0.

## Out of Scope (this spec)

- Nation_body, nation_accent, playbook_outfit, playbook_accent assets (documented only)
- Animated sprite sheets
- Custom asset editing UI

## Reference

- [JRPG Composable Sprite Avatar](../jrpg-composable-sprite-avatar/spec.md)
- [avatar-parts.ts](../../src/lib/avatar-parts.ts)
- LPC: https://lpc.opengameart.org/content/character-rpg-sprites
- LPC Generator: https://lpc.4wall.ai/
