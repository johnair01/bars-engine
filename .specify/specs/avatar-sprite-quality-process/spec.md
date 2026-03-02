# Spec: Avatar Sprite Quality Process

## Purpose

Define a process for developing high-quality avatar sprites that connect with the game's vibe and match the aesthetic of Gathertown, Stardew Valley, and similar games. The sprites must work with the existing modular layer system (base → nation_body → playbook_outfit → nation_accent → playbook_accent).

## Rationale

Current sprites feel disconnected from the game. The user's vision: avatars that look like Gathertown/Stardew Valley—warm, readable, characterful pixel art—while fitting the game's playful, ironic, inviting tone and the Construct Conclave's narrative (comedic heist, elemental nations, archetypes).

## Teal Design Approach

| Goal | How |
|------|-----|
| **Increase deftness** (skill capacity) | STYLE_GUIDE.md documents the process; anyone can contribute. Quality checklist reduces iteration friction. |
| **Increase vibeulon flow** | Better sprites → better Build Your Character → more completions → more Energy. Cert quests already reward verification. |
| **Smallest shippable first** | Base layer (4 PNGs) before nation/playbook layers. Ship → feedback → iterate. |

## Target Aesthetic References

| Reference | Style | Key traits |
|-----------|-------|------------|
| **Gathertown** | Retro pixel art, Zoom-meets-Pokémon | 32×32 tiles, customizable, readable at small size, friendly |
| **Stardew Valley** | Cozy pixel art, layered sprites | 16×32 full-body, 32×32 portraits, warm palette, expressive |
| **Game vibe** | Playful, ironic, inviting | Comedic heist + Hitchhiker's Guide wit; nations have distinct aesthetics |

## Game Vibe Alignment

From [docs/handbook/README.md](../../docs/handbook/README.md):
- **Voice**: Comedic heist (Ocean's 11) + Hitchhiker's Guide wit
- **Tone**: Playful, ironic, inviting

Nation aesthetics (from handbook):
- **Argyra**: Gleaming silver, precise geometries, mirrored surfaces
- **Pyrakanth**: Fire, passion, transformation
- **Virelune**: Wood, growth, organic
- **Meridia**: Earth, stability, nurturing
- **Lamenth**: Water, flow, mystery

Sprites should feel like they belong in this world—not generic JRPG, but Construct Conclave.

## Modular Layer Requirements

The existing architecture ([avatar-parts.ts](../../src/lib/avatar-parts.ts)) stacks layers in order:

```
base → nation_body → playbook_outfit → nation_accent → playbook_accent
```

**For modularity to work**:
1. **Registration**: All layers must align to the same anchor (e.g. center-bottom for full-body, or center for bust)
2. **Transparency**: Each layer has transparent areas so lower layers show through
3. **Consistent dimensions**: Same pixel size across all layers (currently 64×64)
4. **Color harmony**: Nation/playbook layers should share a palette or accent system so combinations don't clash

## Development Process

### Phase 1: Style Guide & Base Layer

1. **Define style guide**
   - Pixel dimensions: 64×64 (current) vs 32×32 (Gathertown) vs 16×32 (Stardew full-body). Decision: keep 64×64 for dashboard/header visibility, or downscale for consistency with Gathertown?
   - Color palette: 8–16 colors per layer; shared "game palette" for harmony
   - Line weight: 1px outlines vs no outlines (Stardew uses outlines; Gathertown varies)
   - Expression: neutral default; avoid uncanny or overly realistic

2. **Base layer (identity)**
   - Create 4 bases: default, male, female, neutral
   - Focus: readable silhouette, warm/approachable, fits game tone
   - Review gate: "Does this feel like it belongs in Construct Conclave?"

### Phase 2: Nation Layer (WHO)

3. **Nation body + accent**
   - For each nation (argyra, pyrakanth, virelune, meridia, lamenth):
     - nation_body: skin/clothing base that reflects nation aesthetic
     - nation_accent: signature element (Argyra = silver geometry; Pyrakanth = flame; etc.)
   - Ensure layers stack correctly; test combinations with base
   - Review gate: "Can you tell which nation at a glance?"

### Phase 3: Playbook Layer (WHO)

4. **Playbook outfit + accent**
   - For each playbook (bold-heart, devoted-guardian, decisive-storm, etc.):
     - playbook_outfit: archetype-identifying clothing/gear
     - playbook_accent: signature flourish
   - Must layer over nation_body without clipping
   - Review gate: "Does the archetype read clearly?"

### Phase 4: Integration & Polish

5. **Combo testing**
   - Test nation × playbook combinations (5 × 8 = 40 combos)
   - Flag clashing pairs; adjust accent opacity or palette
   - Verify fallback (initials) still works when assets missing

6. **Documentation**
   - Update docs/SPRITE_ASSETS.md with style guide, palette, attribution
   - Add "Sprite Quality Checklist" for future contributors

## Sourcing Options

| Option | Pros | Cons |
|--------|------|-----|
| **LPC (4wall.ai)** | License-friendly, modular by design, professional | May not match game vibe; requires adaptation |
| **Commission pixel artist** | Full control, game-specific | Cost, iteration time |
| **AI + manual edit** | Fast iteration | Licensing, consistency, may feel generic |
| **Hybrid** | LPC base + custom nation/playbook accents | Best of both; more work |

**Recommendation**: Start with LPC base layer (proven modularity), then commission or hand-craft nation/playbook layers to match game lore. Accents are the highest leverage for "game vibe."

## Dimension Decision

Current: 64×64 portrait bust. Alternatives:
- **64×64**: Good for dashboard header, readable; larger than Gathertown/Stardew
- **32×32**: Matches Gathertown; may feel small in header
- **48×48**: Compromise; still readable

**Proposal**: Keep 64×64 for v1 (no code change); document 32×32 as future option if we add a "mini avatar" mode (e.g. movement feed, quest cards).

## Out of Scope (this spec)

- Animated sprite sheets (idle, walk)
- Avatar editing UI
- Changing the layer model (base/nation/playbook structure stays)

## Reference

- [avatar-parts.ts](../../src/lib/avatar-parts.ts)
- [docs/SPRITE_ASSETS.md](../../docs/SPRITE_ASSETS.md)
- [avatar-sprite-assets](../../avatar-sprite-assets/spec.md)
- [jrpg-composable-sprite-avatar](../../jrpg-composable-sprite-avatar/spec.md)
- [docs/handbook/README.md](../../docs/handbook/README.md)
- [docs/handbook/nations/argyra.md](../../docs/handbook/nations/argyra.md)
