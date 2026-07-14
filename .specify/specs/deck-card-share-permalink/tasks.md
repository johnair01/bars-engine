# Tasks: Deck Card Share Permalink

Ordered, checkable. Approach-decision → contract → route → **branded graphic** → wire → verify.

## Phase 0 — Decide the graphic approach (blocks Phase 3)
- [ ] T0. **OQ #1: prototype one card's graphic via satori (Approach A)** and eyeball it against the
  in-app `AllyshipCard`. Commit to A (Vercel-native, on-demand) or escalate to **B (Playwright
  build-time screenshots)** only if pixel-parity is required. Record the decision in the spec.

## Phase 1 — Contract (pure, tsx-testable)
- [ ] T1. `src/lib/allyship-deck/share.ts` — `cardPermalinkPath(id)`, `cardImagePath(id, fmt)`,
  `deckCtaHref(id, ctx?)` with UTM params. Pure; unit-test UTM string + `ctx → utm_campaign`.
- [ ] T2. Test: all 120 assembled move-card ids yield valid permalink + image + CTA URLs.

## Phase 2 — The public route
- [ ] T3. `src/app/c/[cardId]/page.tsx` (RSC): `generateStaticParams` = 120 ids; resolve via
  `getCardById`; unknown → `notFound()`; render `AllyshipCard variant="full"` + CTA (`deckCtaHref`)
  + glossary link.
- [ ] T4. Add `/c/[cardId]` to the public / deck-only route allowlist; confirm logged-out access.
- [ ] T5. Layout: mobile-first, thumb CTA in bottom 40% (UI_COVENANT); reuse deck shell/tokens.

## Phase 3 — Branded card graphic (v1 CORE)
- [ ] T6. `src/lib/allyship-deck/card-graphic.tsx` — `BrandedCardGraphic({ card, format })`: the
  trading-card visual (element frame + gem + move pip + gold edge + title + flavor + "Your move").
  One renderer, two sizes; satori-safe (no `color-mix`; loaded font) for Approach A.
- [ ] T7. `src/app/c/[cardId]/opengraph-image.tsx` → 1200×630 PNG via `BrandedCardGraphic` (`og`).
- [ ] T8. Square endpoint → 1080×1080 PNG (`square`) for direct IG/Threads posting.
- [ ] T9. `generateMetadata`: OpenGraph + Twitter (title, description = flavor ?? remediation,
  image = landscape graphic).
- [ ] T10. Page affordance: **"Save card image"** (download landscape + square).

## Phase 4 — Wire the existing surfaces
- [ ] T11. Point `AllyshipDeckReader` copy action at `cardPermalinkPath` (via `share.ts`) so the
  copied URL == the route.
- [ ] T12. Flip `recommendation-card-view-model.ts` `share_card` → `enabled: true`; wire it to the
  permalink + image download.

## Phase 5 — Verify (the gate that caught us before)
- [ ] T13. `npm run build` + `npm run check` green (permalink prerender pulls the deck graph into the
  build — the missing barrel-error gate).
- [ ] T14. `cert-card-permalink-v1`: copy link → open logged-out → card renders → paste unfurls the
  branded OG → download the square → CTA lands on `/deck/sales?...utm_content=<id>`.

## Deferred (explicit non-goals — do not build here)
- Reply recommender · content calendar/scheduler · metrics dashboard · per-channel captions ·
  animated/video cards · instruction-card permalinks (v2).
