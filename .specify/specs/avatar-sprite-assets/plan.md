# Plan: Avatar Sprite Assets

## Summary

Create the four base layer PNGs (default, male, female, neutral) and `docs/SPRITE_ASSETS.md` with LPC workflow and nation/playbook key reference. Two sourcing paths: AI-generated placeholders or LPC-derived assets.

## Phase 1: Base Layer Assets (4 images)

### 1.1 AI-generated path

Use image generation with prompts specifying:
- 64x64 pixel JRPG character portrait bust
- Transparent background
- Simple, flat silhouette
- Front-facing, centered

| File | Prompt |
|------|--------|
| base/default.png | 64x64 pixel art, JRPG character portrait bust, androgynous human silhouette, front-facing, simple flat colors, transparent background, game avatar |
| base/male.png | 64x64 pixel art, JRPG character portrait bust, male human silhouette, front-facing, simple flat colors, transparent background, game avatar |
| base/female.png | 64x64 pixel art, JRPG character portrait bust, female human silhouette, front-facing, simple flat colors, transparent background, game avatar |
| base/neutral.png | 64x64 pixel art, JRPG character portrait bust, neutral androgynous human silhouette, front-facing, simple flat colors, transparent background, game avatar |

If output dimensions differ, resize to 64x64 (ImageMagick: `convert input.png -resize 64x64 output.png`).

### 1.2 LPC path (alternative)

- Open https://lpc.4wall.ai/
- Body type: Male / Female / Teen (for neutral/default)
- Remove clothing layers for base
- Select Idle animation
- Download spritesheet, extract one frame
- Crop to 64x64, save as base/{male,female,neutral,default}.png

## Phase 2: Documentation

### 2.1 docs/SPRITE_ASSETS.md

Create doc with:
1. Asset layout — path structure, required filenames, 64x64 dimensions
2. LPC 4wall.ai workflow — step-by-step for base layer
3. Attribution — Curt, opengameart.org, LPC; CC-BY-SA 3.0 / GPL 3.0
4. Nation/playbook key reference table (for future nation_body, playbook_outfit, etc.)

## Deliverables

- 4 PNG files in `public/sprites/parts/base/`
- `docs/SPRITE_ASSETS.md`

## Verification

- Visit `/campaign?ref=bruised-banana`, complete BB flow
- Confirm "Your character" preview shows base sprite (or layered when nation/playbook chosen)
- Dashboard header avatar shows sprite when assets load
- Missing assets still fall back to initials (no regression)
