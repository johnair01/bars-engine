# Canonical Base Sprite Process

**Problem**: Base sprites (default, male, female, neutral) had too much deviation—nation/playbook layers won't align across variants.

**Solution**: One **canonical base** sprite defines the silhouette and registration. Male/female/neutral are **palette swaps** of the same shape. Zero deviation.

## How Other Systems Do It

| System | Approach |
|--------|----------|
| **Stardew Valley** | Base layer uses specific colors (skin, eyes, boots). Game recolors at runtime from character creation. Same structure for male/female. |
| **LPC** | Male and female have separate base templates; clothing overlays are designed per base type. Registration locked within each type. |
| **Modular sprites** | Alignment consistency: all layers share same anchor, dimensions, z-order. Variants = palette or minor detail swap, never shape change. |

## Our Approach: Canonical + Palette Swap

1. **Create one canonical base** (`base/canonical.png`) — the single source of truth.
2. **Define color regions** — each pixel color maps to a semantic region (skin, hair, outline).
3. **Derive variants** — male, female, neutral, default via palette swap. Same pixels, different colors.
4. **Lock registration** — nation/playbook layers align to canonical; all base variants share identical silhouette.

## Canonical Color Palette (Index Colors)

The canonical base MUST use these exact hex values. The build script swaps them per variant.

| Region | Canonical (index) | Default | Male | Female | Neutral |
|--------|-------------------|---------|------|--------|---------|
| skin_light | `#FF0001` | `#f4d4b8` | `#e8c4a0` | `#f5dcc8` | `#f0d0b0` |
| skin_mid | `#FF0002` | `#e8b88c` | `#d4a574` | `#e8c4a8` | `#e0b890` |
| skin_dark | `#FF0003` | `#c98b5c` | `#b87850` | `#c99a70` | `#c09060` |
| hair_dark | `#FF0004` | `#2d2d2d` | `#2d2d2d` | `#2d2d2d` | `#2d2d2d` |
| hair_mid | `#FF0005` | `#4a4a4a` | `#4a4a4a` | `#4a4a4a` | `#4a4a4a` |
| outline | `#000000` | `#1a1a1a` | `#1a1a1a` | `#1a1a1a` | `#1a1a1a` |
| eye_white | `#FFFFFF` | `#ffffff` | `#ffffff` | `#ffffff` | `#ffffff` |

Index colors (`#FF0001`–`#FF0005`) are chosen to be distinct and rarely occur in art; swap script replaces them.

## Locked Registration

| Element | Position | Constraint |
|---------|----------|------------|
| **Anchor** | Center-bottom (32, 64) | All layers align here |
| **Face** | Centered in upper 40px | Eyes, nose, mouth in fixed region |
| **Silhouette** | Same for all base variants | No shape change; palette only |
| **Overlay bounds** | nation_body, playbook_outfit | Must align to canonical silhouette edges |

## Workflow

1. **Artist** creates `base/canonical.png` using index colors. One shape, one composition.
2. **Script** runs `npm run sprites:derive-base` → outputs default.png, male.png, female.png, neutral.png.
3. **Verify** in `/admin/avatars` — all four should stack identically with nation/playbook layers.

## Script: `scripts/derive-base-sprites.ts`

Reads `base/canonical.png`, applies palette swap per variant, writes to `base/{default,male,female,neutral}.png`. Uses `sharp` or `jimp` for pixel-level color replacement.

## Fallback

If canonical doesn't exist: keep current base/*.png. Script no-ops. When canonical is ready, run script to regenerate.
