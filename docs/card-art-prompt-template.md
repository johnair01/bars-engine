# BARS Engine — Card Art Prompt Template

> Governing specification for all card art generation passes.
> Produced from six-face GM council review (2026-03-21).
> Apply to every generation pass — Flux+LoRA, Ideogram, and future models.

---

## The Three-Channel Contract

Every card must encode all three channels simultaneously:

| Channel | Encoding | How |
|---------|----------|-----|
| **Element** | Color palette | Frame, glow, gem hex values from `card-tokens.ts` |
| **Altitude** | Border treatment | Tier 0/1/2 — see Border Tier Map below |
| **Playbook** | Composition | Figure pose, action, environmental detail — see Playbook Briefs |

A card that encodes element but not playbook is 67% complete. A card that encodes element but has the wrong border is broken governance.

---

## Required Pixel-Art Enforcement

**Every prompt must include these terms** (or equivalent):

### Positive terms (add to prompt)
```
pixel art, 16-bit RPG aesthetic, hard pixel edges, dithering pattern,
retro game sprite style, crisp pixel detail, no smooth gradients,
symmetric pixel composition, muted desaturated palette
```

### Negative prompt (add to negative_prompt field)
```
smooth illustration, vector art, concept art, painted, soft gradients,
anti-aliased edges, photography, watermark, signature, copyright notice,
text overlay, UI chrome, logo, words, letters
```

The negative prompt is not cosmetic — it is what prevents vector-smooth output from the Flux model. **Never omit it.**

---

## Figure Anchor (Required)

Every card must contain a human figure. This is the compositional grammar of the set: a cultivator on a journey. Without the figure, the card loses its human scale and its invitation to the player.

**Add to every prompt:**
```
Lone robed cultivator figure, centered in frame, silhouetted against the elemental
light source. Figure occupies one-third of frame height. Back-facing unless the
playbook brief specifies otherwise.
```

**Three cards from Pass 1 are missing the figure:** `virelune-subtle-influence`,
`argyra-truth-seer`, `meridia-bold-heart`. These must be regenerated with the
figure anchor applied.

---

## Border Tier Map (Altitude Channel)

Choose one border tier per card based on its altitude level. This must be consistent within a playbook across all nations (e.g., `bold-heart` always uses the same tier).

| Tier | Altitude | Border Treatment | Prompt addition |
|------|----------|-----------------|-----------------|
| **0** | Dissatisfied / Seed | No border — full bleed to edge. Dark vignette only. | `"No frame border. Scene bleeds to the edge. Dark vignette fades to near-black at all four edges."` |
| **1** | Neutral / Growing | Solid 8px pixel-art border in the element's frame color. | `"BORDER: Render a visible pixel-art border frame, 8 pixels wide, solid [FRAME_HEX], at all four edges of the image. Hard pixel lines — no anti-aliasing, no glow bleed into the border. The border is part of the illustration."` |
| **2** | Satisfied / Composted | Full ornate pixel frame with nation-specific filigree and inner glow. | `"BORDER: Render a visible ornate pixel-art border frame, 8 pixels wide, solid [FRAME_HEX] with pixel-art filigree corner details, at all four edges. Inner glow [GLOW_HEX] at the frame's interior edge. Hard pixel lines — no anti-aliasing. The border is part of the illustration."` |

> **Current state:** Border tiers are not yet assigned per playbook. This is
> governance work for the team before Pass 2. Assign tiers in `card-art-registry.ts`
> alongside each playbook definition, then inject the correct border prompt.

---

## Playbook Compositional Briefs

These modifiers encode the archetype's energy into the composition. Add to every prompt after the element grammar.

| Playbook | Trigram | Compositional brief |
|----------|---------|---------------------|
| **bold-heart** | Heaven ☰ | Figure faces the light source directly, arms open or raised — courageous, forward-moving. The scene has an ascending diagonal. |
| **devoted-guardian** | Lake ☱ | Figure in protective stance, slightly turned, one arm extended as a shield. A threshold or ward is visible behind them. |
| **decisive-storm** | Thunder ☳ | Figure in dynamic motion — diagonal composition, implied velocity. Lightning or sudden illumination flash. Not centered: movement toward a point. |
| **danger-walker** | Water ☵ | Figure at a threshold or crossing — one foot forward, liminal space. Above/below split: sky above, void or depth below. |
| **still-point** | Mountain ☶ | Figure seated or deeply rooted, not standing. Radial or mandala-like composition — concentric rings emanating from the still center. Receptive posture. |
| **subtle-influence** | Wind ☴ | Figure partially concealed — off-center, in shadow, or at the edge of frame. Indirect light. The environment responds to the figure rather than the figure commanding it. |
| **truth-seer** | Fire ☲ | Figure faces the viewer — rare frontal composition. Eyes or face illuminated. What is hidden becomes visible: a veil lifts, a shadow recedes, something beneath the surface is revealed. |
| **joyful-connector** | Earth ☷ | Multiple beings, creatures, or life-forms present. Birds, flowers, other figures, or luminous orbs. Warmth in the composition. The scene implies gathering rather than solitude. |

---

## Element Palette Reference

Hex values from `src/lib/ui/card-tokens.ts` — never hardcode, always reference the source file.

| Element | Nation | Frame | Glow | Gem |
|---------|--------|-------|------|-----|
| Fire 火 | Pyrakanth | `#c1392b` cinnabar | `#e8671a` ember-ochre | `#e74c3c` bright ember |
| Water 水 | Lamenth | `#1a3a5c` deep navy | `#1a7a8a` deep teal | `#2980b9` ocean blue |
| Wood 木 | Virelune | `#1a4a2a` deep forest | `#27ae60` jade | `#2ecc71` bright jade |
| Metal 金 | Argyra | `#3a4a5c` steel-slate | `#8e9aab` silver-slate | `#b0bec5` pale silver |
| Earth 土 | Meridia | `#b5651d` terracotta | `#d4a017` ochre-amber | `#d4a017` warm gold |

---

## Quarantined Cards

Do not serve these cards in any UI. Regenerate before next commit.

| Card | Reason | Status |
|------|--------|--------|
| `argyra-truth-seer` | Visible `©Rudfren.com` watermark — third-party attribution | QUARANTINED |
| `pyrakanth-joyful-connector` | Visible `BQ×Kahuna` watermark — third-party attribution | QUARANTINED |

> **LoRA audit required:** Watermarks in generated output indicate the LoRA was trained on watermarked
> reference images. Audit `docs/card-art-references/` before running Pass 2 again. If any reference
> image contains embedded watermarks or style-attribution marks, remove it and regenerate a clean
> replacement before re-training.

---

## Full Prompt Structure (Copy Template)

```
[PIXEL_ART_PREAMBLE] [ELEMENT_GRAMMAR] [FIGURE_ANCHOR] [PLAYBOOK_COMPOSITIONAL_BRIEF] [BORDER_TIER] [NATION_LORE] [ARCHETYPE_ENERGY] [COMPOSITION_MOOD]

negative_prompt: smooth illustration, vector art, concept art, painted, soft gradients, anti-aliased edges, photography, watermark, signature, copyright notice, text overlay, UI chrome, logo, words, letters
```

### Example — `lamenth-still-point` (Water / Mountain ☶ / Tier 0)

```
Pixel art, 16-bit RPG aesthetic, hard pixel edges, dithering, retro game sprite style,
no smooth gradients. Flat graphic illustration for a dark Taoist cultivation card game.
Style: 8-bit pixel art meets Wes Anderson. Background: deep near-black #1a1a18.
Aspect ratio 1:1. Square. No text, no words.

Wuxing channel: WATER 水. Frame border: #1a3a5c deep navy. Core light source: #1a7a8a
deep teal phosphorescent glow from beneath the still surface. Accent highlights: #2980b9
ocean blue. Bilateral symmetry via perfect water reflection at horizontal midline.
Bioluminescent teal rising from depth. Still surface mist at outer edges. Material
qualities: obsidian, polished lapis, dark pearl, wet stone with teal veins.

Lone robed cultivator figure, centered, silhouetted against the teal glow. Figure
seated cross-legged on a stone at the water's surface. Occupies one-third of frame.
Radial composition — concentric ripple rings emanate from the figure's still center.
Receptive posture, deeply rooted.

Nation: Lamenth — deep current of emotion, intuition, and flow.
Archetype: The Still Point (Mountain ☶). Energy: stillness, patient receptivity,
the eye of the storm. The figure channels Water's intuitive depth through absolute
stillness — the mountain inside the current.

No border. Scene bleeds to the edge. Dark navy vignette fades to near-black at all edges.

Mood: contemplative cultivation, quiet power, long-game patience.
Saturation deliberately low — cultivation is a long game, not a spectacle.

negative_prompt: smooth illustration, vector art, concept art, painted, soft gradients,
anti-aliased edges, photography, watermark, signature, copyright notice, text overlay,
UI chrome, logo, words, letters
```

---

## Pass 1 Regeneration Targets

Minimum set to regenerate before production. Use `--force` flag for each:

```bash
# Quarantined (watermarks) — mandatory
npx tsx scripts/generate-card-art.ts --generate --element=fire --playbook=joyful-connector --force
npx tsx scripts/generate-card-art.ts --generate --element=metal --playbook=truth-seer --force

# Non-pixel-art (smooth vector renders)
npx tsx scripts/generate-card-art.ts --generate --element=fire --playbook=bold-heart --force
npx tsx scripts/generate-card-art.ts --generate --element=fire --playbook=devoted-guardian --force
npx tsx scripts/generate-card-art.ts --generate --element=water --playbook=devoted-guardian --force
npx tsx scripts/generate-card-art.ts --generate --element=water --playbook=decisive-storm --force
npx tsx scripts/generate-card-art.ts --generate --element=metal --playbook=bold-heart --force
npx tsx scripts/generate-card-art.ts --generate --element=metal --playbook=subtle-influence --force

# Missing figure
npx tsx scripts/generate-card-art.ts --generate --element=wood --playbook=subtle-influence --force
npx tsx scripts/generate-card-art.ts --generate --element=earth --playbook=bold-heart --force

# Thematic failure (gnarled tree ≠ joy)
npx tsx scripts/generate-card-art.ts --generate --element=wood --playbook=joyful-connector --force

# Undersized / resolution
npx tsx scripts/generate-card-art.ts --generate --element=water --playbook=still-point --force
```

---

*Governance spec produced from six-face council review, 2026-03-21.*
*Update this document when the generation pipeline changes.*
