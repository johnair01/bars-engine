# Walkable Sprites

Top-down avatar spritesheets for the spatial map (Gathertown-style experience). Used when players walk the Conclave and see themselves and others on the map.

**Spec:** [.specify/specs/asset-management-bar-upload-walkable-sprites/spec.md](../.specify/specs/asset-management-bar-upload-walkable-sprites/spec.md)

## Format

| Field | Value |
|-------|-------|
| Dimensions | 64×64 pixels per frame |
| Layout | Row-major: N_idle, N_walk, S_idle, S_walk, E_idle, E_walk, W_idle, W_walk (8 frames) |
| Directions | north, south, east, west |
| States | idle, walk (2 frames per direction) |
| Format | PNG, transparent background |
| Path | `public/sprites/walkable/{key}.png` |

## Key Derivation

Key is derived from avatar config: `{nationKey}-{archetypeKey}`. When nation or archetype is missing, use `default`.

Examples:
- `argyra-bold-heart.png`
- `pyrakanth-still-point.png`
- `default.png` (fallback)

## Frame Layout (8 frames, 64×64 each)

```
| N_idle | N_walk | S_idle | S_walk | E_idle | E_walk | W_idle | W_walk |
```

Total spritesheet size: 512×64 (8 frames × 64px width).

## Usage

```ts
import { getWalkableSpriteUrl } from '@/lib/avatar-utils'

const config = parseAvatarConfig(player.avatarConfig)
const url = getWalkableSpriteUrl(config)
// Returns e.g. /sprites/walkable/argyra-bold-heart.png or /sprites/walkable/default.png
```

## Default Sprite

Create `public/sprites/walkable/default.png` as a generic top-down character sprite. Use same 8-frame layout. Until custom sprites exist, all players use default.

## Reference

- [SPRITE_ASSETS.md](./SPRITE_ASSETS.md) — portrait bust assets
- [avatar-utils.ts](../src/lib/avatar-utils.ts) — `getWalkableSpriteUrl`, `parseAvatarConfig`
