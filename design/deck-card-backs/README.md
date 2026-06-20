# Handoff: Allyship Deck — Premium Card Backs & Gumroad Images

## Overview
Print-and-store art for **The Allyship Deck** (product surface of *Mastering the Game of Allyship* / BARS Engine). Two deliverables:

1. **Card backs** — four directions; the approved one is **"Struck Gold"** (Back A).
2. **Gumroad product images** — cover banner, card fan, box shot, **product thumbnail**, and a front+back pairing, all rendered in the Struck Gold treatment.

The work here is the *premium-print detailing*: simulated gold foil, blind-deboss, guilloché engraving, hexagon "spotlight," substrate tooth, and a spot-gloss sheen — the things that make a printed deck feel like an object in the hand (think MTG / tarot).

## About the Design Files
The files in this bundle are **design references created in HTML** (Design Components, `.dc.html`) — prototypes showing intended look and behavior, **not** production code to ship directly. The task is to **recreate these designs in the target environment** using its established patterns. Two realistic targets:

- **Print/export** — these surfaces are art destined for a printer and for Gumroad. The most likely "implementation" is exporting each surface to a high-res PNG/PDF at the stated pixel dimensions (see *Print spec* below). The HTML already renders at exact pixel sizes for this.
- **Web (if embedding the marketing visuals)** — recreate in the codebase's framework (the real app is **Next.js 14 / React**, repo `johnair01/bars-engine`) using its existing card tokens (`src/lib/ui/card-tokens.ts`, `src/styles/cultivation-cards.css`).

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, dimensions, and the full effect stack are specified below. Recreate pixel-perfectly.

## The Struck Gold treatment (the core of this handoff)
Every card *back* surface is built from the same layered stack, back-to-front. Reproduce all layers:

1. **Card body** — `460×644` canonical (2.5:3.5 ratio), `border-radius:18px`, `overflow:hidden`, `border:3px solid var(--gold)`.
   Background: `radial-gradient(120% 80% at 50% 42%, #161220 0%, #0a0810 60%, #060509 100%)`.
   Box-shadow: `inset 0 1px 0 rgba(255,255,255,.07), 0 0 34px 1px color-mix(in srgb,var(--bars-liminal) 26%,transparent), 0 30px 64px -28px rgba(0,0,0,.95)`.
2. **Substrate tooth (linen)** — full-bleed overlay, `mix-blend-mode:overlay`:
   `repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px), repeating-linear-gradient(90deg,rgba(0,0,0,.08) 0 1px,transparent 1px 3px)`.
   (Alternate substrates available in the source: `noise` = SVG `feTurbulence` fractalNoise baseFrequency 0.85; `smooth` = none.)
3. **Guilloché engraved field** — concentric woven rosette rings, `opacity:.5`, stroke `color-mix(in srgb,var(--gold) ~16%,transparent)`, `stroke-width:0.7–1`.
   Generator (see `Spotlight Back - Premium Treatments.dc.html` logic): `r(θ)=baseR + amp·cos(petals·θ + phase)`; field = `guilloche(cx=230, cy=322, r0=64, r1=250, rings=11, amp=9, petals=18)`, alternating `phase = (i%2)·π/petals`.
4. **Hexagon spotlight** — five nested hexagons, points (in the `0 0 460 644` viewBox):
   - `230,82 438,202 438,442 230,562 22,442 22,202` — gold 26%
   - `230,129 397,225 397,418 230,515 63,418 63,225` — fire gem 32%
   - `230,176 356,249 356,395 230,468 104,395 104,249` — wood gem 30%
   - `230,223 316,272 316,371 230,421 144,371 144,272` — water gem 34%
   - `230,266 278,294 278,350 230,378 182,350 182,294` — gold 32%
   (all `stroke-width:1.4`). On smaller surfaces, drop to the inner 2–3 hexagons.
5. **Center glow** — `360×360` circle, `radial-gradient(circle, color-mix(in srgb,var(--bars-liminal) 30%,transparent), transparent 62%)`, centered.
6. **Mark** — `assets/logo/mtgoa-logo-transparent.png`, centered, ~`368px`, `filter: drop-shadow(0 0 26px color-mix(in srgb,var(--bars-liminal) 55%,transparent))`.
7. **Spot-gloss sheen** — a clipped band sweeping across the mark; `@keyframes sheensweep` translateX(-160%→260%) skewX(-18deg), ~6.5s ease-in-out infinite; band is `linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent)`.
8. **Emboss / glow underlay** — `inset:14px; border-radius:11px;` box-shadow:
   `inset 0 0 0 1px rgba(255,255,255,.22), 0 0 0 1px rgba(0,0,0,.5), 0 0 16px -3px color-mix(in srgb,var(--gold) 50%,transparent), inset 0 0 22px -10px color-mix(in srgb,var(--gold) 60%,transparent)`.
9. **Foil gradient ring** — `inset:14px; border-radius:11px; padding:3px;` masked ring:
   `background: linear-gradient(115deg,#7d5f22,#e9d290,#fff7da,#c9a14a,#fdf2c0,#b8862e,#f1e2a0,#8a6d28); background-size:240% 240%;`
   Masked to a ring with `-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude;`
   Animated via `.foil-anim { animation: foilshift 7s linear infinite }` (`@keyframes foilshift` sweeps `background-position` 0%→100%→0%). Honors `prefers-reduced-motion`.
10. **Arched label** — `top:44px`, centered, Space Mono `11px`, letter-spacing `.34em`, color `color-mix(in srgb,var(--gold) 82%,transparent)`, content `◆ THE ALLYSHIP DECK ◆`.
11. **Corner gems** — four element-colored hexagon gems at 40px insets (fire TL, water TR, wood BL, earth BR), each `filter: drop-shadow(0 0 6px <element glow> 80%)`.

> **Scaling note:** every secondary surface (box, leaning card, thumbnail, pairing back, cover deck) reuses this stack by giving its inner SVGs `viewBox="0 0 460 644"` with `preserveAspectRatio="none"` and scaling width/height to the element. The foil ring + emboss are inset CSS that scale automatically.

## Surfaces / Views
All in `Deck Backs & Gumroad.dc.html`. Append the listed URL `#hash` to isolate one surface for export.

| Surface | Size (px) | `#hash` | Notes |
|---|---|---|---|
| Card back A — Struck Gold | 460×644 | `#back1` | **Approved direction.** Full stack above. |
| Card backs B / C / D | 460×644 | `#back2/3/4` | Alternate directions (Gold Seal, Violet, Poster). Not selected. |
| Cover / hero banner | 1280×720 | `#cover` | Left copy ("Knowing isn't the same as doing."), right = Struck Gold deck-in-hand (tuck box behind + hero back card, halo + floor glow). |
| Card fan | 1080×1080 | `#fan` | Five card **fronts** fanned (front-face design, not the back). |
| Box shot ("What you get") | 1080×1080 | `#box` | Struck Gold tuck box (300×430) + leaning card (248×347), floor glow. |
| **Product thumbnail** | 1080×1080 | `#thumb` | Struck Gold back as hero + title block. Square, legible at grid scale. |
| Front + back pairing | 1080×1080 | `#pair` | Struck Gold back (left) + a card front (right). |

Card **fronts** (fan, cover fan, pairing front) are a separate typographic layout — title, move pip, face badge, domain, ask copy, MIN + ♦ reward — driven by the `cards[]` data and `theme()/cardObj()` helpers in the logic class. They are NOT part of the Struck Gold back treatment.

## Design Tokens
**Gold** (tweakable prop `goldTone`, default) `#C9A84C` → CSS `var(--gold)`.
**Foil gradient stops:** `#7d5f22 #e9d290 #fff7da #c9a14a #fdf2c0 #b8862e #f1e2a0 #8a6d28` (115°, size 240%).
**Surfaces (near-black):** `#161220 #0a0810 #060509` (Struck Gold field); aubergine variant `#281c3e #160f28 #0a0714`.
**Element gems / glows** (from BARS design-system `tokens/colors.css`): `--bars-fire-gem/-glow`, `-water-`, `-wood-`, `-metal-`, `-earth-`; liminal/action purple `--bars-liminal` (`#7c3aed`, reserved — never an element).
**Radii:** card 18px outer / 11px inner ring; box 14px; thumbnail card 20px.
**Type:** Display = **Jost** (`--bars-font-display`, titles, tight -0.02em); Body = **Nunito** (`--bars-font-body`); Mono = **Space Mono** (`--bars-font-mono`, uppercase wide-tracked chrome labels). (Brand spec is Futura PT Bold for display — substituted with Jost; swap if licensed files are available.)
**Motion:** `foilshift` 7s linear ∞ (foil); `sheensweep` ~6.5s ease-in-out ∞ (gloss); ease `cubic-bezier(0.16,1,0.3,1)`. All honor `prefers-reduced-motion`.

## Print spec (Struck Gold → printer brief)
- **Gold foil stamp** on the frame ring, the `◆ THE ALLYSHIP DECK ◆` label, and the four corner gems.
- **Blind deboss** on the inner double rule (the emboss underlay).
- **Guilloché engraved field** behind the mark (fine line art).
- **Spot-gloss UV** on the central mark over an otherwise matte field (sheen contrast).
- **Stock:** linen-tooth uncoated, matte.
- Export each surface at the pixel sizes above (300 DPI equivalents for print; the 1080² / 1280×720 are Gumroad-native).

## Assets
- `assets/logo/mtgoa-logo-transparent.png` — the MTGOA wordmark/mark (transparent PNG). Included in this bundle.
- **BARS Engine design system** — colors, type, components. Bound in the project at `_ds/bars-engine-design-system-af69bae5-…/`. The HTML links its token CSS + `_ds_bundle.js`. Source tree / repo: `github.com/johnair01/bars-engine`. NOT copied here in full — wire to the codebase's own copy, or import the token CSS (`tokens/colors.css`, `tokens/typography.css`) for the element + font variables referenced above.

## Files in this bundle
- `Deck Backs & Gumroad.dc.html` — all card backs + Gumroad surfaces (the deliverable).
- `Spotlight Back - Premium Treatments.dc.html` — the 3-variant exploration (Struck Gold / Engraved Light / Deep Tarot) with the guilloché/rosette/rays/filigree generators, well-commented.
- `support.js` — Design Component runtime (lets the `.dc.html` files open directly in a browser for reference).
- `assets/logo/mtgoa-logo-transparent.png` — the mark.

To preview a reference file: open the `.dc.html` in a browser (it self-mounts via `support.js`). Add `#thumb`, `#cover`, `#back1`, etc. to isolate a surface.
