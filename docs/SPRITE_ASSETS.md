# Avatar Sprite Assets

PNG sprite assets for the JRPG composable avatar. Layers stack in order: base → nation_body → playbook_outfit → nation_accent → playbook_accent. All assets must be **64×64 pixels** with **transparent backgrounds**.

## Asset Layout

```
public/sprites/parts/
  base/           default.png, male.png, female.png, neutral.png
  nation_body/    argyra.png, pyrakanth.png, virelune.png, meridia.png, lamenth.png
  nation_accent/  (same keys as nation_body)
  playbook_outfit/
  playbook_accent/
```

Paths are defined in [src/lib/avatar-parts.ts](../src/lib/avatar-parts.ts). Missing assets fall back to initials; no broken images.

## Sourcing Paths

### Option A: AI-generated placeholders

Use image generation with prompts specifying:
- 64×64 pixel JRPG character portrait bust
- Transparent background
- Simple, flat silhouette
- Front-facing, centered

| File | Prompt |
|------|--------|
| base/default.png | 64x64 pixel art, JRPG character portrait bust, androgynous human silhouette, front-facing, simple flat colors, transparent background, game avatar |
| base/male.png | 64x64 pixel art, JRPG character portrait bust, male human silhouette, front-facing, simple flat colors, transparent background, game avatar |
| base/female.png | 64x64 pixel art, JRPG character portrait bust, female human silhouette, front-facing, simple flat colors, transparent background, game avatar |
| base/neutral.png | 64x64 pixel art, JRPG character portrait bust, neutral androgynous human silhouette, front-facing, simple flat colors, transparent background, game avatar |

Resize to 64×64 if needed: `convert input.png -resize 64x64 output.png` (ImageMagick).

### Option B: LPC (Liberated Pixel Cup)

1. Open [LPC Spritesheet Generator](https://lpc.4wall.ai/)
2. **Body type**: Male / Female / Teen (for neutral/default)
3. Remove clothing layers for base-only, or keep minimal
4. Select **Idle** animation
5. Download spritesheet (Credits or Download pack)
6. Extract one frame, crop to 64×64
7. Save as `base/{male,female,neutral,default}.png`

**Attribution** (required for LPC assets):
- Curt, cjc83486 — http://opengameart.org/content/rpg-character-bases-assets
- License: CC-BY-SA 3.0 / GPL 3.0

## Nation Keys (nationKey)

| Nation (name) | nationKey | Path |
|---------------|-----------|------|
| Argyra | argyra | nation_body/argyra.png, nation_accent/argyra.png |
| Pyrakanth | pyrakanth | nation_body/pyrakanth.png, nation_accent/pyrakanth.png |
| Virelune | virelune | nation_body/virelune.png, nation_accent/virelune.png |
| Meridia | meridia | nation_body/meridia.png, nation_accent/meridia.png |
| Lamenth | lamenth | nation_body/lamenth.png, nation_accent/lamenth.png |

## Playbook Keys (playbookKey)

| Playbook (name) | playbookKey | Path |
|-----------------|-------------|------|
| The Bold Heart | bold-heart | playbook_outfit/bold-heart.png, playbook_accent/bold-heart.png |
| The Devoted Guardian | devoted-guardian | playbook_outfit/devoted-guardian.png, playbook_accent/devoted-guardian.png |
| The Decisive Storm | decisive-storm | playbook_outfit/decisive-storm.png, playbook_accent/decisive-storm.png |
| The Danger Walker | danger-walker | playbook_outfit/danger-walker.png, playbook_accent/danger-walker.png |
| The Still Point | still-point | playbook_outfit/still-point.png, playbook_accent/still-point.png |
| The Subtle Influence | subtle-influence | playbook_outfit/subtle-influence.png, playbook_accent/subtle-influence.png |
| The Truth Seer | truth-seer | playbook_outfit/truth-seer.png, playbook_accent/truth-seer.png |
| The Joyful Connector | joyful-connector | playbook_outfit/joyful-connector.png, playbook_accent/joyful-connector.png |

Keys are derived by `slugifyName()` in [src/lib/avatar-utils.ts](../src/lib/avatar-utils.ts): lowercase, strip "The ", replace spaces with hyphens.

## Reference

- Spec: [.specify/specs/avatar-sprite-assets/spec.md](../.specify/specs/avatar-sprite-assets/spec.md)
- LPC Character Sprites: https://lpc.opengameart.org/content/character-rpg-sprites
- LPC Generator: https://lpc.4wall.ai/
