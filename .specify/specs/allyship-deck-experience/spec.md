# Spec: Allyship Deck Experience (Sales → App)

> Source: design handoff `Mastering_the_Game_of_Allyship_Book.zip` →
> `design_handoff_deck_experience/` (HTML prototypes + `deck-data.json`). The `.dc.html`
> files are **design references** — recreated as React against the real data + DS primitives.

## Purpose

Turn the (already-authored) 120-card Allyship Deck into a shippable product: a deck **Sales**
landing page that funnels into purchase, and a high-fidelity **card app** (Draw / Browse /
Find-a-card / Card detail → Send to BARS).

## Ground truth (do not re-author)

- **Deck content is real & committed:** `public/allyship-deck/allyship-deck.json` — 120 move
  cards (all `status:"authored"`) + 27 instruction + 6 problems. Built by
  `scripts/assemble-allyship-deck.ts`. `operation` IS the face (no separate mapping).
- **Card app exists** at `/deck` (`AllyshipDeckReader`) — functional but low-fidelity
  (handbook tokens, no gold-edge card anatomy, no Send-to-BARS).
- **Commerce is Gumroad** (`/launch`, the converged funnel). The handoff's in-app
  checkout/auth is **not** built — purchase routes to Gumroad (host decision).

## Design decisions (host)

1. **Commerce → Gumroad `/launch`.** No mock in-app checkout/auth; Sales CTAs hand off to
   the real Gumroad offers. (README defers pricing/SKUs to "the commerce layer.")
2. **Build the card primitive first** — both Sales (fan hero) and the app depend on it.
3. **`reward`/`minutes` are game mechanics, not deck data** — never fabricated on the card;
   they come from the quest/BAR layer (Send to BARS).

## Card anatomy (from the prototype)

Element-tinted body + **gold 2px edge** (`#C9A84C`) + inset-top highlight + element glow.
Banner (title) → marks row (circular **move pip** holding the move glyph, left; squared
**face badge** monogram, right) → `◇ domain` → body (the question) → **"The practice"** well
(`remediation`) → foot (`id` · `→ {outputBar} ♦`). Move→element: Show=Fire, Grow=Wood,
Clean=Water, Wake=Earth, **Open=Liminal purple** (reserved; not an element).

## Slices

- **Slice 1 (this branch) — the card primitive + preview.** `card-visuals.ts` (pure: move→
  element, face colors, glyph paths, brand constants), `MoveIcon` / `MovePip` / `FaceBadge`,
  `AllyshipCard` (`grid` + `full`), and an **unauthenticated** `/deck/preview` gallery of all
  120 cards (also fixes "design can't find the cards"). Unit-tested incl. full-deck coverage.
- **Slice 2 (done) — the card app upgrade.** Rebuilt `/deck` (`AllyshipDeckReader`) on the
  new card: Draw (face-down → 420ms flip → reveal), Browse (filter chips), Find-a-card (the
  authored `problems[]`), card detail overlay with the practice well. Deck layout now loads
  the handoff fonts + scrolls. (The old serif "Guide"/instruction-card tab was dropped to
  match the handoff's Draw/Browse/Find nav; instruction cards remain in the JSON.)
  **Send to BARS** is the detail's remaining seam → slice 3.
- **Slice 3 — Send to BARS.** Card → seed a quest with the originating card in provenance →
  normal BAR flow. (Capture-charge / 3·2·1 live on the generated quest, not the seed.)
- **Slice 4 — deck Sales landing page.** Fan-of-3 hero, five-moves strip, how-it-works,
  social proof ($21,646 / 371 backers), CTAs → Gumroad `/launch`.

## Deferred / not built

- Final operation/face **sigil art** (monogram placeholders today).
- Real in-app checkout/auth (using Gumroad).
- Webfonts (Jost/Nunito/Space Mono) — `card-visuals.DECK_FONTS` falls back gracefully.

## Verification

`npm run test:allyship-deck` (assembler + card-visuals, covers all 120). Visual: `/deck/preview`.
