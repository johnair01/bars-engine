# Allyship Deck — card backs & Gumroad images

This folder vendors the **Claude Design** handoff for the Allyship Deck's premium
card backs and Gumroad product images, plus the pipeline that turns it into
shippable assets.

## What's here

- `README.md` — the original design handoff (Struck Gold treatment spec, surface
  list, print spec, design tokens). **Read this first.**
- `Deck Backs & Gumroad.dc.html` — the design reference for every card back +
  Gumroad surface (a Design Component prototype, not production code).
- `Spotlight Back - Premium Treatments.dc.html` — the 3-variant exploration with
  the guilloché / rosette generators.

## How it's wired into the app

The approved **"Struck Gold"** back (Back A) is recreated as a React component:

- `src/components/deck/DeckCardBack.tsx` — the card back, authored in the canonical
  460×644 space and CSS-scaled so every layer stays pixel-faithful at any size.
- `src/lib/allyship-deck/card-visuals.ts` — `CARD_BACK`, `FOIL_GRADIENT`,
  `guillocheField()`, `MTGOA_MARK_SRC` (the engraved-field generator + back tokens).
- `src/styles/allyship-deck.css` — foil / sheen / flip-in keyframes (reduced-motion
  aware), imported by `src/app/deck/layout.tsx`.
- The MTGOA mark lives at `public/allyship-deck/mtgoa-logo-transparent.png`.

It replaces the old placeholder "B" face-down card in the Draw view of `/deck`.

## Regenerating the Gumroad images

```bash
npm run deck:render-gumroad
# → writes PNGs to ./gumroad-exports/ (gitignored)
```

The script (`scripts/render-gumroad.mjs`) reproduces each surface from the handoff
HTML in this folder — resolving the template placeholders (guilloché field, fan /
front-card data) in Node, supplying the BARS tokens as CSS variables, and
screenshotting with Playwright at native pixel sizes:

| File | Surface | Size |
|---|---|---|
| `card-back-struck-gold.png` | Struck Gold back (Back A) | 460×644 |
| `gumroad-cover-1280x720.png` | Cover / hero banner | 1280×720 |
| `gumroad-card-fan-1080.png` | Five card fronts, fanned | 1080×1080 |
| `gumroad-box-shot-1080.png` | Tuck box + leaning card | 1080×1080 |
| `gumroad-thumbnail-1080.png` | Product thumbnail | 1080×1080 |
| `gumroad-front-back-1080.png` | Front + back pairing | 1080×1080 |

Requires Playwright + a Chromium build. If not on the default path:

```bash
PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers node scripts/render-gumroad.mjs
```
