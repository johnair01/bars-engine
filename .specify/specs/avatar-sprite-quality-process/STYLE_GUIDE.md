# Avatar Sprite Style Guide

**Purpose**: Build capacity (deftness) so anyone can contribute sprites that fit the game. Clear criteria = less friction = more vibeulon flow when players complete character creation and cert quests.

## Teal Design Principles

| Principle | Application |
|-----------|-------------|
| **Grow Up** (skill capacity) | This doc is the skill. Read it → contribute. |
| **Reduce friction** | One clear palette, one registration point, one dimension. |
| **Energy flow** | Better sprites → better Build Your Character → more completions → more vibeulons. |

## Target Aesthetic

**Feel**: Gathertown (retro, friendly, readable) + Stardew Valley (cozy, expressive) + Construct Conclave (playful, ironic, inviting).

**Voice**: Comedic heist (Ocean's 11) + Hitchhiker's Guide wit. Not generic JRPG. Not grimdark.

## Technical Specs

| Spec | Value | Rationale |
|------|-------|------------|
| **Dimensions** | 64×64 px | Dashboard header visibility; no code change |
| **Format** | PNG, transparent background | Layering requires transparency |
| **Registration** | Center-bottom anchor | All layers align; face/head centered |
| **Line weight** | 1px outline (Stardew-style) | Readable at small size |

## Color Palette (Game Harmony)

Shared palette so nation × playbook combos don't clash. 12 colors max per layer.

### Base Layer Palette

| Name | Hex | Use |
|------|-----|-----|
| Skin light | `#f4d4b8` | Default skin |
| Skin mid | `#e8b88c` | Shading |
| Skin dark | `#c98b5c` | Outline, shadow |
| Hair dark | `#2d2d2d` | Hair, eyebrows |
| Hair mid | `#4a4a4a` | Hair highlight |
| White | `#ffffff` | Eye whites, teeth |
| Black | `#1a1a1a` | Pupils, outline |

### Nation Accent Hints (for future layers)

| Nation | Accent color | Vibe |
|--------|--------------|------|
| Argyra | Silver `#c0c0c0` | Geometric, precise |
| Pyrakanth | Flame `#e85c2c` | Passion, transformation |
| Virelune | Leaf `#4a7c4e` | Growth, organic |
| Meridia | Earth `#8b7355` | Stability, nurturing |
| Lamenth | Water `#4a90b8` | Flow, mystery |

## Mood Board References

- **Gathertown**: [Gather.town avatar customization](https://support.gather.town/hc/en-us/articles/15910013784852) — 32×32, customizable, friendly
- **Stardew Valley**: [Farmer sprite structure](https://stardewvalleywiki.com/Modding:Farmer_sprite) — layered, 16×32 body, 32×32 portrait
- **LPC**: [LPC 4wall.ai generator](https://lpc.4wall.ai/) — modular, CC-BY-SA, proven layering

## Canonical Base (Locked Registration)

**Problem**: Base variants (male, female, neutral, default) must share identical silhouette so nation/playbook overlays align.

**Solution**: One canonical base; variants are palette swaps. See [CANONICAL_BASE_SPRITE.md](CANONICAL_BASE_SPRITE.md).

- **Workflow**: Create `base/canonical.png` with index colors, or run `npm run sprites:derive-base -- --init-from-default` to create canonical from default.png.
- **Derive**: `npm run sprites:derive-base` → outputs default, male, female, neutral from canonical.
- **Locked elements**: Face, silhouette, anchor (center-bottom). No shape change between variants.

## Layer Stack Order

```
1. base         (identity: default, male, female, neutral — from canonical)
2. nation_body  (WHO: nation silhouette)
3. playbook_outfit (WHO: archetype clothing)
4. nation_accent   (nation signature)
5. playbook_accent (archetype flourish)
```

Each layer must have transparent areas so lower layers show through.

## Nation Layer Design

### nation_body vs nation_accent

| Layer | Role | Content |
|-------|------|---------|
| **nation_body** | Clothing/torso overlay | Vest, collar, shoulders; nation-colored. Transparent where base (face, neck) shows through. |
| **nation_accent** | Signature flourish | Small badge, motif, or emblem. Sits on top of nation_body. |

### Silhouette alignment

- Nation layers must align to the **same center-bottom anchor** as base.
- Face and neck regions must be **transparent** so base skin shows through.
- Clothing edges should follow the base silhouette; no clipping or overflow.

### Base-driven overlay workflow

When you change the base model, run:

1. `npm run sprites:analyze-base` — infers overlay regions from base, writes `base-silhouette.json`
2. `npm run sprites:nation-placeholders` — regenerates nation placeholders using those regions
3. Verify at `/admin/avatars`

Edit `base-silhouette.json` manually to tune `nationBody` and `nationAccent` (x, y, width, height) if needed.

### Per-nation motif hints

| Nation | nation_body | nation_accent |
|--------|-------------|---------------|
| Argyra | Geometric collar, silver shoulders, mirrored surfaces | Small geometric badge (triangle, hexagon) |
| Pyrakanth | Flame-orange vest, burning garden trim | Flame or ember motif |
| Virelune | Leaf-green vest, vine-trimmed shoulders | Leaf or vine flourish |
| Meridia | Earth-toned vest, balanced golden-brown | Sun or balance symbol |
| Lamenth | Water-blue flowing collar, crystalline shoulders | Water droplet or tear motif |

## Review Gates

Before submitting a sprite, ask:

1. **"Belongs in Construct Conclave?"** — Does it fit playful, ironic, inviting?
2. **"Reads at 64×64?"** — Silhouette clear in dashboard header?
3. **"Stacks correctly?"** — Test with base + one other layer.

## Attribution

LPC-derived assets: Curt, cjc83486 — http://opengameart.org/content/rpg-character-bases-assets — CC-BY-SA 3.0 / GPL 3.0.

Custom assets: Document creator and license in commit or PR.
