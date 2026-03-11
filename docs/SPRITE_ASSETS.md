# Avatar Sprite Assets

PNG sprite assets for the JRPG composable avatar. Layers stack in order: base → nation_body → archetype_outfit → nation_accent → archetype_accent. All assets must be **64×64 pixels** with **transparent backgrounds**.

**Style guide**: [.specify/specs/avatar-sprite-quality-process/STYLE_GUIDE.md](../.specify/specs/avatar-sprite-quality-process/STYLE_GUIDE.md) — Gathertown/Stardew vibe, palette, review gates.

## Asset Layout

```
public/sprites/parts/
  base/               canonical.png (source), default.png, male.png, female.png, neutral.png
  base-silhouette.json  overlay region config (from npm run sprites:analyze-base)
  nation_body/        argyra.png, pyrakanth.png, virelune.png, meridia.png, lamenth.png
  nation_accent/      (same keys as nation_body)
  archetype_outfit/
  archetype_accent/
```

Base variants (default, male, female, neutral) are derived from `canonical.png` via palette swap. Run `npm run sprites:derive-base` after editing canonical. Use `--init-from-default` to create canonical from an existing default.png.

Paths are defined in [src/lib/avatar-parts.ts](../src/lib/avatar-parts.ts). Missing assets fall back to initials; no broken images.

## Sourcing Paths

### Option A: AI-generated placeholders (Gathertown/Stardew vibe)

Use image generation with prompts specifying:
- 64×64 pixel art character portrait
- Transparent background
- Cozy, friendly, Stardew Valley / Gathertown style
- 1px outline, warm palette

| File | Prompt |
|------|--------|
| base/default.png | 64x64 pixel art character portrait bust, androgynous, Stardew Valley style, cozy friendly game avatar, front-facing, 1px black outline, warm skin tones, transparent background |
| base/male.png | 64x64 pixel art character portrait bust, male, Stardew Valley style, cozy friendly game avatar, front-facing, 1px black outline, warm skin tones, transparent background |
| base/female.png | 64x64 pixel art character portrait bust, female, Stardew Valley style, cozy friendly game avatar, front-facing, 1px black outline, warm skin tones, transparent background |
| base/neutral.png | 64x64 pixel art character portrait bust, androgynous neutral, Stardew Valley style, cozy friendly game avatar, front-facing, 1px black outline, warm skin tones, transparent background |

Resize to 64×64 if needed: `convert input.png -resize 64x64 output.png` (ImageMagick). Upload via `/admin/avatars/assets`.

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

## Nation Layer (nation_body + nation_accent)

Nation layers overlay the base. **nation_body**: clothing/torso; transparent where face/neck show through. **nation_accent**: signature flourish (badge, motif). Both must align to center-bottom registration.

### Overlay-only requirement (critical)

Nation and archetype sprites MUST be **partial overlays**, not full character portraits. If a sprite has opaque pixels in the face/neck/background, it will **overwrite** the base instead of layering. See [.specify/specs/avatar-overwrite-transparency-fix/CHATGPT_PROMPTS.md](../.specify/specs/avatar-overwrite-transparency-fix/CHATGPT_PROMPTS.md) for prompts that generate base-aligned overlays. Region dimensions: [base-silhouette.json](../public/sprites/parts/base-silhouette.json).

### AI-generated nation sprites

Use these prompts for 64×64 pixel art. Stardew Valley style, transparent background, front-facing bust, 1px black outline.

| File | Prompt |
|------|--------|
| nation_body/argyra.png | 64x64 pixel art character clothing overlay, silver metallic collar and shoulders, precise geometric lines, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| nation_accent/argyra.png | 64x64 pixel art small geometric badge or silver emblem, Argyra metal nation, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| nation_body/pyrakanth.png | 64x64 pixel art character clothing overlay, flame-orange vest or shoulders, burning garden aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| nation_accent/pyrakanth.png | 64x64 pixel art small flame motif or ember badge, Pyrakanth fire nation, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| nation_body/virelune.png | 64x64 pixel art character clothing overlay, leaf-green vest or vine-trimmed shoulders, organic growth aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| nation_accent/virelune.png | 64x64 pixel art small leaf or vine motif, Virelune wood nation, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| nation_body/meridia.png | 64x64 pixel art character clothing overlay, earth-toned golden-brown vest or balanced shoulders, midday sun aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| nation_accent/meridia.png | 64x64 pixel art small sun or balance motif, Meridia earth nation, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| nation_body/lamenth.png | 64x64 pixel art character clothing overlay, water-blue flowing collar or crystalline shoulders, tear-like elegance, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| nation_accent/lamenth.png | 64x64 pixel art small water droplet or crystalline tear motif, Lamenth water nation, Stardew Valley style, transparent background, centered on chest, 1px black outline |

Resize to 64×64 if needed: `convert input.png -resize 64x64 output.png` (ImageMagick). Upload via `/admin/avatars/assets`.

### Placeholder sprites (verify stacking)

When you change the base model, overlay layers must align to the new silhouette:

1. **Analyze base** — `npm run sprites:analyze-base`  
   Reads `base/default.png`, infers torso/badge regions, writes `public/sprites/parts/base-silhouette.json`.

2. **Regenerate placeholders** — `npm run sprites:nation-placeholders`  
   Uses `base-silhouette.json` to draw nation_body, nation_accent, archetype_outfit, and archetype_accent. Each layer gets a colored fill plus 1px black outline so they're visually distinct (not flat grey blocks).

3. **Verify** — Open `/admin/avatars` and confirm base + nation + playbook layers stack correctly.

You can edit `base-silhouette.json` manually to tune overlay positions (x, y, width, height) if the auto-analysis is off.

### LPC for nation layer

Use [LPC 4wall.ai](https://lpc.4wall.ai/) with nation-colored clothing (silver, flame, leaf-green, earth-brown, water-blue). Extract one frame, crop to 64×64. Ensure face/neck areas are transparent so base shows through.

## Archetype Keys (archetypeKey)

| Archetype (name) | archetypeKey | Path |
|------------------|--------------|------|
| The Bold Heart | bold-heart | archetype_outfit/bold-heart.png, archetype_accent/bold-heart.png |
| The Devoted Guardian | devoted-guardian | archetype_outfit/devoted-guardian.png, archetype_accent/devoted-guardian.png |
| The Decisive Storm | decisive-storm | archetype_outfit/decisive-storm.png, archetype_accent/decisive-storm.png |
| The Danger Walker | danger-walker | archetype_outfit/danger-walker.png, archetype_accent/danger-walker.png |
| The Still Point | still-point | archetype_outfit/still-point.png, archetype_accent/still-point.png |
| The Subtle Influence | subtle-influence | archetype_outfit/subtle-influence.png, archetype_accent/subtle-influence.png |
| The Truth Seer | truth-seer | archetype_outfit/truth-seer.png, archetype_accent/truth-seer.png |
| The Joyful Connector | joyful-connector | archetype_outfit/joyful-connector.png, archetype_accent/joyful-connector.png |

Keys are derived by `slugifyName()` in [src/lib/avatar-utils.ts](../src/lib/avatar-utils.ts): lowercase, strip "The ", replace spaces with hyphens.

## Archetype Layer (archetype_outfit + archetype_accent)

Archetype layers overlay the nation layers. **archetype_outfit**: archetype clothing/torso; transparent where face/neck show through. **archetype_accent**: archetype signature flourish (badge, motif). Both must align to center-bottom registration. Themes align with I Ching elements and handbook archetype descriptions.

### AI-generated archetype sprites

Use these prompts for 64×64 pixel art. Stardew Valley style, transparent background, front-facing bust, 1px black outline.

| File | Prompt |
|------|--------|
| archetype_outfit/bold-heart.png | 64x64 pixel art character clothing overlay, crimson red vest or heart-themed shoulders, bold creative energy, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| archetype_accent/bold-heart.png | 64x64 pixel art small heart motif or crimson badge, Bold Heart archetype, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| archetype_outfit/devoted-guardian.png | 64x64 pixel art character clothing overlay, soft blue vest or protective shoulders, nurturing guardian aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| archetype_accent/devoted-guardian.png | 64x64 pixel art small shield or protective emblem, Devoted Guardian archetype, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| archetype_outfit/decisive-storm.png | 64x64 pixel art character clothing overlay, purple vest with lightning or storm accents, decisive bold aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| archetype_accent/decisive-storm.png | 64x64 pixel art small lightning bolt or storm motif, Decisive Storm archetype, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| archetype_outfit/danger-walker.png | 64x64 pixel art character clothing overlay, earth-toned brown vest or wilderness-trimmed shoulders, fluid adventurer aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| archetype_accent/danger-walker.png | 64x64 pixel art small wave or path motif, Danger Walker archetype, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| archetype_outfit/still-point.png | 64x64 pixel art character clothing overlay, dark slate vest or mountain-inspired shoulders, calm centered aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| archetype_accent/still-point.png | 64x64 pixel art small mountain or anchor motif, Still Point archetype, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| archetype_outfit/subtle-influence.png | 64x64 pixel art character clothing overlay, lavender or soft purple vest, gentle wind-inspired aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| archetype_accent/subtle-influence.png | 64x64 pixel art small feather or breeze motif, Subtle Influence archetype, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| archetype_outfit/truth-seer.png | 64x64 pixel art character clothing overlay, golden-amber or forest-green vest, radiant clarity aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| archetype_accent/truth-seer.png | 64x64 pixel art small eye or flame motif, Truth Seer archetype, Stardew Valley style, transparent background, centered on chest, 1px black outline |
| archetype_outfit/joyful-connector.png | 64x64 pixel art character clothing overlay, warm orange vest or sunlit shoulders, joyful connection aesthetic, Stardew Valley style, transparent background except clothing, front-facing bust, 1px black outline |
| archetype_accent/joyful-connector.png | 64x64 pixel art small sun or link motif, Joyful Connector archetype, Stardew Valley style, transparent background, centered on chest, 1px black outline |

Resize to 64×64 if needed: `sips -z 64 64 file.png` (macOS) or `convert input.png -resize 64x64 output.png` (ImageMagick). Upload via `/admin/avatars/assets`.

### LPC for archetype layer

Use [LPC 4wall.ai](https://lpc.4wall.ai/) with archetype-colored clothing. Match palette: Bold Heart (crimson), Devoted Guardian (blue), Decisive Storm (purple), Danger Walker (brown), Still Point (slate), Subtle Influence (lavender), Truth Seer (amber/green), Joyful Connector (orange). Extract one frame, crop to 64×64. Ensure face/neck areas are transparent so base and nation layers show through.

## Sprite Quality Checklist

Before uploading (via `/admin/avatars/assets` or committing to repo):

- [ ] 64×64 px, PNG, transparent background
- [ ] Center-bottom registration (face/head centered)
- [ ] Fits game vibe: playful, ironic, inviting (Construct Conclave)
- [ ] Readable at small size (dashboard header)
- [ ] Stacks correctly with base layer (test in admin Avatar Gallery)
- [ ] Attribution documented if LPC-derived (CC-BY-SA 3.0)

## Reference

- Archetype handbook: [src/content/handbook/archetypes/](../src/content/handbook/archetypes/) (I Ching element associations)
- Style guide: [.specify/specs/avatar-sprite-quality-process/STYLE_GUIDE.md](../.specify/specs/avatar-sprite-quality-process/STYLE_GUIDE.md)
- Spec: [.specify/specs/avatar-sprite-assets/spec.md](../.specify/specs/avatar-sprite-assets/spec.md)
- Quality process: [.specify/specs/avatar-sprite-quality-process/spec.md](../.specify/specs/avatar-sprite-quality-process/spec.md)
- LPC Character Sprites: https://lpc.opengameart.org/content/character-rpg-sprites
- LPC Generator: https://lpc.4wall.ai/
