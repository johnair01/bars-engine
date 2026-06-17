# Card Art Design Brief — The Allyship Deck

**For:** Claude Design (visual / art direction)
**Product:** The Allyship Deck — a consultable 150-card deck (120 move cards + ~30 instruction cards)
**Backlog:** 1.81 ADK · Spec: `.specify/specs/allyship-deck/`
**Status:** Deck is content-complete (all 120 cards authored). This brief covers the **visual/art system** to dress them — for the digital deck (`/deck`) and the print-house physical deck (Kickstarter).

---

## 1. What this deck is

A "spellbook for **Mastering Allyship Moves**." You draw a card for inspiration, or consult it to solve a real allyship problem — for your own inner work (**Allyship for self**) or a campaign that helps others (**Allyship for others**). Each card names a **move** you can make.

It is **not** an oracle of mysticism or a morality deck. It sells **"recoverable agency inside unconscious social reality"** — the felt relief of *"oh, I can play this differently."* The art must feel **grounded, human, warm, and a little wry** — never shaming, preachy, purity-coded, or coldly corporate.

**Audience:** emotionally literate, creatively overwhelmed adults — organizers, facilitators, artists, founders, neurodivergent systems-thinkers. **Backers** of a Kickstarter.

**Tone words:** compostable, alchemical, embodied, integral, playful, honest. **Avoid:** saccharine, sanctimonious, dystopian, AI-slick.

> **Community note:** the Portland community around this project has a strong allergy to AI-generated art. The deck's existing pixel-art set was generated; for this deck **favor a hand-crafted, human-made feel** (or clearly authored illustration), and be ready to show provenance. If AI tooling is used, the *direction* and finishing must read as authored, not generic.

---

## 2. The core design problem — a system, not 120 paintings

The deck has **120 move cards** built from three axes:

| Axis | Members | Count |
|------|---------|-------|
| **Basic Move** | Wake Up · Open Up · Clean Up · Grow Up · Show Up | 5 |
| **Operation** (the "face") | Shaman · Challenger · Regent · Architect · Diplomat · Sage | 6 |
| **Domain** (allyship context) | Gather Resources · Raise Awareness · Direct Action · Skillful Organizing | 4 |

5 × 6 × 4 = **120**. Bespoke-illustrating 120 cards is neither affordable nor coherent.

**The ask: design a combinatorial visual system** where each card's art is *assembled* from a small library of components, so 120 cards feel like one family yet each is distinct. Proposed decomposition (open to your refinement):

- **Operation = the figure / central motif** → 6 archetypal symbols or characters (the "who/how" performing the move). *This is the biggest illustration investment: ~6 base motifs.*
- **Move = color + posture/treatment** → the 5 moves get a developmental color arc + a gesture (see §4).
- **Domain = frame / border world** → 4 distinct frame treatments or background environments (resources, awareness, action, organizing).
- **Channel/Capability = accent** (latent) → 5 elemental accent colors (see §4), used sparingly.

Net production: roughly **6 operation motifs × 5 move treatments + 4 domain frames + a glyph set** → 120 distinct, coherent cards. Show how the system combines with a worked grid.

---

## 3. Three-channel encoding (house rule — must follow)

This project encodes meaning redundantly across **three independent visual channels** (see `UI_COVENANT.md`, `src/lib/ui/card-tokens.ts`). Honor it so cards are legible *and* colorblind-safe:

1. **Color = element/channel** (the emotional capability in play).
2. **Border / frame = altitude** (intensity — e.g., dissatisfied → neutral → satisfied; or move stage).
3. **Density / texture = stage** (seed → growing → composted).

Every distinction must be carried by **at least two channels** (e.g., color *and* a glyph), never color alone.

---

## 4. Palette, glyphs & the axes → visual variables

### Elemental colors (canonical — from `card-tokens.ts`)
Use these exact hexes for the **capability/channel** accents:

| Channel | Capability | Frame hex | Glow hex |
|---------|-----------|-----------|----------|
| **Fire** | Agency ("I can act") | `#c1392b` | `#e8671a` |
| **Water** | Connection ("I can connect") | `#1a3a5c` | `#1a7a8a` |
| **Metal** | Exploration ("I can explore") | `#8e9aab` | `#bdc3c7` |
| **Earth** | Rest ("I can rest") | `#b5651d` | `#d4a017` |
| **Wood** | Participation ("I can participate") | `#4a7c59` | `#27ae60` |

Frame furniture (from oracle layout): deep green `#0F3B2F`, gold `#C9A84C`, cream `#F6F1E8`.

### The 5 Move glyphs (design these — 4 exist, need a 5th)
Existing SVGs to **evolve into a unified set**: `public/oracle/icons/{wake-up,clean-up,grow-up,show-up}.svg`. **Design a 5th: Open Up.** Suggested developmental color arc + meaning:
- **Wake Up** — *see* (eye / dawn). Detect charge.
- **Open Up** — *receive* (open hand / threshold / unarmored). The newest move; pairs with Water/Connection.
- **Clean Up** — *transform* (flow / alchemical vessel). Metabolize charge.
- **Grow Up** — *develop* (sprout / gate). Build capacity.
- **Show Up** — *invest* (hand placing / forge). Make the artifact.

### The 6 Operation symbols (design these — the central motif system)
Each is a *verb/stance*, not a class. Give each a distinct silhouette/symbol:
- **Shaman** — *Notice* ("What is here?") — threshold, mask, the one who names.
- **Challenger** — *Challenge* ("What resists?") — the edge, the pressing line.
- **Regent** — *Steward* ("What deserves responsibility?") — the holding hand, the seal.
- **Architect** — *Amplify* ("What value wants to increase?") — blueprint, lattice.
- **Diplomat** — *Care* ("What relationships matter?") — the bridge, the open circle.
- **Sage** — *Integrate* ("What larger truth is emerging?") — the mirror, the hexagram.

### The 4 Domain marks / worlds
- **Gather Resources** — supply, the cup/hearth, mutual aid.
- **Raise Awareness** — light, signal, the made-visible.
- **Direct Action** — the line, the intervention, protection.
- **Skillful Organizing** — structure, lattice, the coordinated many.

---

## 5. Card anatomy & layout

Cards are **300 × 420 px** on screen = **2.5″ × 3.5″** (standard poker). Zones (from `src/lib/oracle/cardLayout.ts`):

```
┌─────────────────────────┐  HEADER  (8%)  — operation · move · domain glyph strip
│  ░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░    ART / MOTIF     ░  │  IMAGE   (62%) — operation motif × move treatment × domain world
│  ░░░░░░░░░░░░░░░░░░░░░░░  │
├─────────────────────────┤  TITLE   (7%)  — the card name (e.g. "The Ask You're Avoiding")
│  question · practice     │  CONTENT (23%) — primary question + the practice (set by the reader)
└─────────────────────────┘
```
- The **digital reader** sets type; your job is the **art zone + frame + glyph system + header strip**, designed to sit behind/around reader-rendered text. Provide both a **full-card composition** and the **art-only layer** (so the digital reader can overlay live text).
- **Card back** — one shared design (evolve `public/oracle/card-back*.png`). Should signal "Allyship Deck," carry the 5-move spine or the elemental wheel, and look great fanned.

---

## 6. Technical specs (print-house ready)

- **Trim:** 2.5″ × 3.5″ (poker). Confirm final house — **default The Game Crafter / MakePlayingCards** poker spec.
- **Bleed:** 0.125″ all sides → full art **825 × 1125 px @ 300 dpi** (2.75″ × 3.75″ with bleed).
- **Safe zone:** keep text/critical art ≥ 0.125″ inside trim.
- **Digital:** also export at the on-screen **300 × 420** ratio (5:7) for `/deck`.
- **Formats:** print = CMYK-ready PNG/PDF per card + a shared back; source = layered (Figma/SVG/PSD) so the combinatorial system stays editable.
- **File naming = card id** so art maps 1:1 to data: `OPEN-GR-SHAMAN.png`, `WAKE-DA-CHALLENGER.png`, etc. (Move abbrevs: WAKE/OPEN/CLEAN/GROW/SHOW; domains: GR/RA/DA/SO; operation = full lowercase or UPPER.) A `manifest.json` maps id → file.
- **Color:** design in sRGB, deliver a CMYK soft-proof for print.

---

## 7. Accessibility

- Redundant encoding (color **+** glyph **+** density) per §3 — never rely on hue alone.
- Min contrast for any text-bearing furniture: WCAG AA.
- Operation/move glyphs must be distinguishable at thumbnail size and in grayscale.

---

## 8. Deliverables & phasing

**Phase A — the system (highest value first):**
1. A **style frame**: 2–3 directions for one card (recommend `OPEN-GR-SHAMAN — "The Empty Cup"`, the deck's emotional keystone), so we lock mood.
2. The **component libraries**: 5 move glyphs (incl. new Open Up), 6 operation motifs, 4 domain frames, 5 channel accents, card back.
3. A **worked 5-card row** — one full move across operations (or one operation across moves) — proving the combinatorial system reads as distinct + coherent.

**Phase B — scale:** assemble all 120 from the system + per-card crops; deliver print files + manifest.

**Phase C (optional):** instruction-card visual treatment (the ~30 guidebook cards) + box / Kickstarter key art.

---

## 9. References & existing assets

- **Encoding & tokens:** `UI_COVENANT.md`, `src/lib/ui/card-tokens.ts`, `src/styles/cultivation-cards.css`.
- **Layout:** `src/lib/oracle/cardLayout.ts` (zones), `src/components/oracle/OracleReader.tsx`.
- **Existing move icons:** `public/oracle/icons/*.svg` (evolve into the unified set + add Open Up).
- **Existing card backs:** `public/oracle/card-back*.png`.
- **Prior art set (style reference / what to evolve *past*):** `public/card-art/*.png` — 40 nation×archetype pixel-art cards (16-bit RPG). Useful as identity-layer reference; the *move* cards want their own, more grown-up visual language.
- **The cards themselves (copy + structure):** `public/allyship-deck/allyship-deck.json`; the worked voice: `.specify/specs/allyship-deck/slice-open-up-gathering-resources.md`.

---

## 10. Open questions for the team

1. **Figural vs symbolic:** do the 6 operations want *characters* (figures) or *symbols/sigils*? (Symbols scale and dodge representation/identity pitfalls; figures are warmer but heavier to produce and riskier re: who's depicted.)
2. **Identity layer:** should nation/archetype (the existing 40 art assets) appear on move cards at all, or stay a separate cosmetic layer? (Recommend: keep move cards identity-agnostic; offer identity as an optional back/frame.)
3. **Hand-made mandate:** how strict is the no-AI-art line for the physical deck — fully hand-illustrated, or AI-assisted with heavy human finishing + disclosed provenance?
4. **Deck size for print:** 120 move cards + ~30 instruction cards = 150. Confirm the physical SKU includes the instruction cards (vs a printed booklet).
5. **Print house:** The Game Crafter vs MakePlayingCards vs other → locks exact bleed/spec.
