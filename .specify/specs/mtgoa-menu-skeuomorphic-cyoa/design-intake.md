# Design Intake — MtGoA Menu Skeuomorphic CYOA Redesign

> Phase 0 brief for [spec.md](./spec.md). Answered with the host 2026-06-15. Read
> `UI_COVENANT.md` before any implementation. This brief + the token map below are the gate
> the implementation phases unlock.

## The decision in one line

The *Mastering the Game of Allyship* hub becomes a **deck of cards laid on a dark-slate
table**: the eight curriculum spokes are **`CultivationCard`s carrying the player's nation
element**, and you **"Draw"** a card to enter its spoke.

## Answered intake

### A. Object metaphor
- **A1 — Metaphor:** **Deck of cards on a table.** Leans into the card-game identity; each
  spoke is a physical card you can pick up. (Not the book-TOC or field-map options.)
- **A2 — Card material:** the existing **`CultivationCard` primitive** — warm near-black
  body (`#1a1a18`), element frame/glow/gem, the covenant's top-edge `inset` highlight that
  makes a flat card read as a held object. No bespoke card system.
- **A3 — Surface:** a **dark-slate table** — cool, matte, neutral, modern; lets the colorful
  cards sit forward. (Chosen over wood/leather/green-felt; green felt was rejected for the
  Wood-element semantic clash.)

### B. Light & depth
- **B4 — Light source:** **top-left** (default), consistent across bevels/shadows so every
  card and the table vignette agree.
- **B5 — Depth:** **Medium / clearly tactile** — top-edge highlight + frame + one soft drop
  shadow onto the slate + faint grain. Unmistakably physical, still WCAG-AA safe and fast.
- **B6 — Texture:** restrained grain on the slate; cards keep the covenant card texture. No
  heavy aging.

### C. CYOA reading
- **C7 — Reading:** **Open board.** All eight cards are freely choosable — no linear gating,
  no lock-shaming (honors the covenant's non-pressure ethos). A suggested-next may be added
  later but is not required.
- **C8 — Card face content:** **RESOLVED via [SIX_FACES_FUNNEL_ANALYSIS.md](./SIX_FACES_FUNNEL_ANALYSIS.md).**
  Each card shows: roman numeral + title, emoji + Kotter stage, one feeling chip, a quiet
  **funnel ribbon** (one congruent hook, tinted with its barn-wall token), and the "Draw →"
  affordance. The Kotter arc maps 1:1 to the funnel ladder (free doors → first gift → become →
  co-create), so each hook is the spoke's natural destination, not a bolt-on.
- **C9 — Enter affordance:** **"Draw"** — tapping a card draws it to enter the spoke. Primary
  action sits in the thumb zone (covenant Law 5).

### D. Tokens & scope
- **D10 — New tokens:** a **slate table surface** treatment (background + vignette + grain)
  added to `cultivation-cards.css` / `card-tokens.ts`; a **"draw" interaction** (lift + glow,
  the covenant's Active/Ritual states) — reuse `CultivationCard` motion, do not invent
  component-local values. Cards themselves need **no new color tokens** (element via
  `NationProvider`).
- **D11 — Scope:** **Hub + spoke page + reusable menu primitive.** Redesign
  `/mastering-allyship/hub` and `/mastering-allyship/spoke/[index]`, and extract a shared
  **"card-table menu"** primitive other surfaces can adopt.
- **Card color (semantic):** every spoke card carries the **player's nation element** via
  `NationProvider` — semantically "this is *your* curriculum deck," covenant-blessed, avoids
  arbitrary per-spoke colors (Law 9). Unauthenticated fallback: neutral element-less card.

## Token map (visual decision → token)

| Visual decision | Token / source | Notes |
|---|---|---|
| Card body | `--surface-card` `#1a1a18` (covenant) | Never pure black |
| Card frame / glow / gem | `ELEMENT_TOKENS[playerElement]` via `NationProvider` | Player's nation element |
| Top-edge physical highlight | `.cultivation-card` `inset 0 1px 0 rgba(255,255,255,.06)` | The "make it real" trick |
| Altitude border/glow | `ALTITUDE_TOKENS` | Static unless progress wired |
| Table surface (slate) | **new** `--surface-table-slate` + `.card-table` class | Add to token files, not component |
| Table vignette + grain | **new** `.card-table` CSS | top-left light, restrained grain |
| "Draw" interaction | covenant Active/Ritual states (`cultivation-card--*`) | lift + glow; reduced-motion guard |
| Numerals / labels | Futura PT Bold tabular (covenant typography) | — |
| Contrast / targets | WCAG AA, 44px (covenant Law 11) | build gate |

## Open items (need host before/along implementation)

1. ~~**Card-face content respec (C8).**~~ **DONE** — see
   [SIX_FACES_FUNNEL_ANALYSIS.md](./SIX_FACES_FUNNEL_ANALYSIS.md). Spoke list unchanged; the
   existing 8 ladder correctly onto the funnel. Implementation reads a small `spokeFunnelMap`
   (the analysis table) → ribbon. Live destinations for spokes IV/VII/VIII depend on **MBLD**.
2. **Progress/completion state** — wire only after a per-player spoke-progress source exists
   (may pull from GSCP). Until then cards render at neutral altitude, no lock state.
3. **Reusable primitive surface** — confirm which *other* pages adopt the card-table menu
   (campaign hub? lobby?) so the primitive's API fits more than MtGoA.

## Status
- T0.1 read covenant + handbook + tokens — ✅
- T0.2 run intake with host — ✅ (this doc)
- T0.3 write `design-intake.md` + token map — ✅
- T0.4 confirm scope — ✅ hub + spoke + reusable primitive
- **Gate:** Phase 1 (token/material foundation) may start; **C8 card-face content is blocked**
  on the launch-goals respec (Open item 1).
