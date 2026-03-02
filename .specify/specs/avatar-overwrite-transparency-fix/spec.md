# Spec: Avatar Overwrite, Transparency, and Size — Emergent Fix

## Purpose

Fix avatar layers that overwrite instead of stack when selecting nation or archetype. Address transparency issues, simplify nation/archetype objects to fit base proportions, provide ChatGPT prompts for base-aligned asset generation, and consider increasing avatar size.

## Root cause analysis

### 1. Overwrite behavior

**Perceived**: Selecting nation or archetype fully replaces the avatar instead of layering.

**Root causes**:
- **Opaque backgrounds**: Nation/playbook sprites have opaque (non-transparent) pixels outside the intended overlay region. Those pixels cover the base layer.
- **Full-character sprites**: Assets may be full 64×64 character portraits instead of partial overlays (clothing/vest only). A full character sprite replaces the base.
- **Wrong proportions**: Overlay sprites don't align to `base-silhouette.json` regions; they may extend into face/neck areas or use wrong dimensions.

### 2. Transparency

- Overlay layers (nation_body, nation_accent, playbook_outfit, playbook_accent) MUST have **transparent pixels** everywhere except the overlay content (clothing, badge).
- Face, neck, and background must be fully transparent so the base shows through.
- AI generators often produce sprites with subtle opaque backgrounds or anti-aliased edges that appear opaque.

### 3. Proportions (base-silhouette.json)

| Layer | Region | Dimensions | Purpose |
|-------|--------|------------|---------|
| nation_body | (17, 24) | 28×33 | Torso/vest overlay; transparent where face/neck show through |
| nation_accent | (27, 32) | 8×8 | Small badge centered on torso |
| playbook_outfit | (17, 24) | 28×33 | Archetype clothing overlay |
| playbook_accent | (25, 36) | 12×8 | Archetype flourish (badge, motif) |

Assets must fit these regions. Content outside = transparent.

### 4. Avatar size constraint

- **Source**: All sprites are 64×64 px.
- **Display**: sm=32px, md=40px, lg=56px, xl=256px.
- **Issue**: 64×64 may be too small for readable detail; upscaling to 256px can look blurry. Larger source (e.g. 128×128) would allow crisper display but requires asset and code changes.

## Expected behavior

1. **Stacking**: Base → nation_body → playbook_outfit → nation_accent → playbook_accent. Each layer composites; transparent areas reveal layers below.
2. **Overlays only**: Nation and archetype sprites are partial overlays (clothing, badge) that fit the base silhouette. No full-character replacement.
3. **Readable at size**: Avatar displays clearly at sm/md/lg; xl shows detail without excessive blur.

## User stories

**As an admin**, when I assign nation and archetype to a player, I see the full composed avatar with all layers stacked—base visible, nation clothing over base, archetype over nation, accents on top. Transparent overlay areas show layers below.

**As a contributor**, I can use ChatGPT (or similar) prompts to generate nation/archetype overlay sprites that align with the base layer and stack correctly.

## Solution approach

### Phase 1: Asset requirements and prompts (no code change)

1. **Regenerate placeholders** — Run `npm run sprites:nation-placeholders` to create correct overlay shapes. Use these as reference for transparency and proportions.
2. **ChatGPT prompts** — Provide prompts that explicitly describe overlay-only, region dimensions, and base alignment. See [CHATGPT_PROMPTS.md](CHATGPT_PROMPTS.md) in this spec.
3. **Asset checklist** — Verify each asset: 64×64, PNG, transparent background, content only in overlay region, fits base-silhouette.json.

### Phase 2: Code and config (if needed)

4. **Verify stacking** — Avatar component already uses `object-contain` and `absolute inset-0`. Ensure container has `bg-zinc-900`. No 404s for nation/playbook when unselected (use empty string, not 'unknown').
5. **Avatar size** — Optionally increase source resolution to 128×128 or display sizes (sm/md/lg) for better readability. Requires asset pipeline and Avatar component updates.

### Phase 3: Documentation

6. **Update SPRITE_ASSETS.md** — Add "Overlay-only" section: nation/playbook sprites must be partial overlays, not full characters. Link to base-silhouette.json and ChatGPT prompts.

## Functional requirements

- **FR1**: Nation and playbook overlay sprites MUST have transparent backgrounds. Opaque pixels only in the overlay region (clothing, badge).
- **FR2**: Overlay content MUST fit the regions defined in `base-silhouette.json`. Content outside region = transparent.
- **FR3**: ChatGPT prompts MUST be documented for generating base-aligned overlay sprites.
- **FR4**: Placeholder generator (`npm run sprites:nation-placeholders`) MUST produce correct overlay shapes for verification.
- **FR5** (optional): Avatar display sizes MAY be increased (e.g. sm=40px, md=48px, lg=64px) for better readability.

## Out of scope

- Full 128×128 source pipeline (future enhancement)
- Real-time sprite compositing (canvas/SVG)
- Custom per-layer positioning (beyond base-silhouette.json)

## Reference

- [docs/SPRITE_ASSETS.md](../../../docs/SPRITE_ASSETS.md)
- [public/sprites/parts/base-silhouette.json](../../../public/sprites/parts/base-silhouette.json)
- [.specify/specs/avatar-sprite-quality-process/STYLE_GUIDE.md](../avatar-sprite-quality-process/STYLE_GUIDE.md)
- [.specify/specs/avatar-stacking-base-preview/spec.md](../avatar-stacking-base-preview/spec.md)
- [src/components/Avatar.tsx](../../../src/components/Avatar.tsx)
