# Spec: Deck Card Share Permalink (`/c/[cardId]`)

## Purpose

Give every Allyship Deck card a **public, linkable home** so a card can be *shared* — the atomic
unit of the "draw a card in public" content motion (for MTGOA and Cascade Camp alike). Today the
app already copies a share URL (`masteringallyship.com/c/{cardId}`, `AllyshipDeckReader.tsx:544`)
but **the route does not exist (404)**, and the "share card" action ships as a **disabled stub**
(`recommendation-card-view-model.ts:67` → `share_card: enabled: false`). This spec closes that
already-made-and-broken promise with the smallest correct surface: a public card page + rich
social preview + one tracked CTA back to the deck.

Core product rule:

```text
A card you can draw is a card you can link. One card is a teaser for 120.
```

## Practice (why this scope, and not more)

Written **after a hostile review** of a broader "marketing workflow" analysis. The review killed
most of it and this spec deliberately excludes the casualties:

- **No content calendar / scheduler / marketing-content-in-repo tooling.** Marketing copy belongs
  where marketing lives, not engineered into this repo. Out of scope.
- **No metrics dashboard.** UTM params on the CTA + Gumroad's built-in analytics + a spreadsheet
  is the v1 attribution loop. No build.
- **No reply/quest recommender.** "Drop your project, I'll draw a card" is unvalidated demand.
  Defer until it earns a spec.
- **Branded card graphics ARE the v1 deliverable** (creator's call — correcting the review's
  instinct to defer). The shareable asset is the **visual card**, not text: the trading-card look
  *is* the brand (`UI_COVENANT.md`), and on Instagram/Threads a link preview doesn't render at all,
  so the graphic is what actually gets posted. The open question is the *generation approach* and
  *fidelity*, not whether.
- **The launch is not blocked on this.** Friday's posts are paste-ready text today. This is the
  **evergreen** unlock that makes the *next* weeks ergonomic, not a launch dependency.

Deftness: reuse the built card renderer and card lookup; deterministic; API/contract before UI;
degrade gracefully (a card with no art still shares as clean text).

## Design Decisions

| Topic | Decision |
|---|---|
| Route | **`/c/[cardId]`** — exactly the URL the app already copies. Public, unauthenticated. |
| Scope of cards | **All 120 move cards** get a permalink. A single card is a *teaser* (same logic as `/deck/preview`), never the paid deck. Instruction cards optional (v2). |
| What renders | Reuse **`AllyshipCard variant="full"`** (`src/components/deck/AllyshipCard.tsx`) — the whacked card face (title, question, Your move, The practice, flavor, Avoid/How-it-slips, applications). No new card UI. |
| Card lookup | **`getCardById`** (`assemble.ts` — client-safe, no DB/fs) resolves the card at build/request time. Unknown id → `notFound()` (404). |
| Access | Add `/c/[cardId]` to the **public route allowlist** (alongside `/deck/sales`, `/deck/preview`, `/deck/glossary`) per the deck-only product-access model. Never gated. |
| Social preview | `generateMetadata` emits **OpenGraph + Twitter** tags: title = card title; description = `flavor` (fallback: `remediation`); image = the **branded card graphic** (below). |
| **Card graphic (v1 core)** | A **branded trading-card image** per card — element frame + gem + move pip + gold edge + title + flavor + "Your move", in the cultivation-card look. Serves **double duty**: the OG unfurl image *and* a **directly-downloadable image** the creator posts where link-unfurls don't work (IG/Threads/stories). |
| **Generation approach** | Two viable paths: **(A) Satori / `ImageResponse`** — rebuild the card layout in satori-safe JSX (flex, `linear-gradient`, loaded fonts; **no `color-mix`**) → on-brand, on-demand, Vercel-native, *not pixel-identical* to the DOM card. **(B) Playwright build-time screenshots** — render the real `AllyshipCard` DOM to PNG for all 120 → **pixel-perfect**, but needs Chromium in the build and ships static PNG assets. **Lean A** (fidelity ↔ ops balance); choose B only if pixel-parity with the in-app card is a hard requirement. *This is Open Question #1 — decide before build.* |
| **Formats** | **Landscape 1200×630** for link OG (LinkedIn/X/FB) **and** **square 1080×1080** for direct posting (IG/Threads). Portrait 1080×1350 optional. At least landscape + square in v1. |
| **Download** | The card page and the (now-enabled) `share_card` action let the creator **save the card image** directly — the atomic "draw a card in public" asset, no Canva. |
| CTA | One primary CTA → **`/deck/sales`** carrying **UTM params** (below). Secondary: link to `/deck/glossary` ("what is this?"). |
| Attribution | UTMs are the whole measurement story for v1: `utm_source=card_share`, `utm_medium=social`, `utm_campaign=deck`, `utm_content={cardId}`. Read in Gumroad/GA + a sheet. |
| Enable the stub | Flip `share_card` → `enabled: true` and point it at the now-live `/c/[cardId]` link (the copy already targets that URL). |

## Conceptual Model

| Dimension | This spec |
|---|---|
| **WHO** | Anyone with the link (unauthenticated visitor) — a stranger who saw the card on social. The *sharer* is the creator/partner posting it. |
| **WHAT** | A public, permalinked view of one move card + a tracked path to buy the deck. |
| **WHERE** | New route `src/app/c/[cardId]/page.tsx` + `src/app/c/[cardId]/opengraph-image.tsx`; reuses `AllyshipCard`, `getCardById`; extends the public-route allowlist. |
| **Ergonomic loop** | In the deck reader, "copy share link" (already exists) → paste into any platform → rich preview renders → CTA is tracked. **No dev, no Canva, no scheduler.** |

## API / Type Contracts (contract-first)

```ts
// src/app/c/[cardId]/page.tsx  (RSC)
export function generateStaticParams(): { cardId: string }[]   // all 120 move-card ids (assembleDeck)
export function generateMetadata({ params }): Promise<Metadata> // OG/Twitter from getCardById
export default function CardPermalinkPage({ params }): JSX.Element // renders <AllyshipCard variant="full" /> + CTA, or notFound()

// src/lib/allyship-deck/card-graphic.tsx  (shared branded-card renderer)
export function BrandedCardGraphic(props: { card: MoveCard; format: 'og' | 'square' }): JSX.Element
// satori-safe JSX (approach A): element frame + gem + pip + gold edge + title + flavor + "Your move".

// src/app/c/[cardId]/opengraph-image.tsx      → ImageResponse 1200×630 (format 'og')
// src/app/c/[cardId]/square/opengraph-image.tsx (or /c/[cardId]/image?fmt=square) → 1080×1080 (format 'square')
export const contentType = 'image/png'

// CTA + share helpers (pure)
// src/lib/allyship-deck/share.ts
export function cardPermalinkPath(cardId: string): string          // `/c/${cardId}`
export function cardImagePath(cardId: string, fmt: 'og' | 'square'): string  // downloadable graphic URL
export function deckCtaHref(cardId: string, ctx?: string): string  // `/deck/sales?utm_source=card_share&utm_medium=social&utm_campaign=${ctx ?? 'deck'}&utm_content=${cardId}`
```

- **No schema change, no DB.** Cards are assembled deterministically; the page is static
  (`generateStaticParams` prerenders all 120). Zero per-request cost.
- `share.ts` is the single source of truth for the permalink + UTM'd CTA, imported by both the
  page and the deck reader's copy action (so the copied link and the live route can never drift).

## User Stories

### P1 — A shared card has a real home
As a stranger who clicked a card link on social, I land on a clean page showing that card and a
clear way to get the deck — not a 404.
**Acceptance:** `/c/OPEN-RA-SHAMAN` renders the full card; unknown id → 404; page is public (works logged-out).

### P2 — The card ships as a branded graphic
As the creator posting a card, I get a **branded card image** for it — the trading-card visual —
that (a) unfurls as the rich preview when I paste the link *and* (b) I can **download and post
directly** where link previews don't render (Instagram/Threads). No Canva, no screenshotting.
**Acceptance:** the image is the branded card look (not plain text); a **1200×630** and a **1080×1080**
render exist per card; both are reachable as PNGs and the page offers a download.

### P3 — Every share is a tracked funnel
As the creator, every card page routes to `/deck/sales` with UTM params, so I can see in Gumroad/GA
which card drove interest.
**Acceptance:** CTA href contains the four UTM params incl. `utm_content={cardId}`; `share.ts` is the only place they're built.

### P4 — The copy action works
As a deck user, "copy share link" copies a URL that resolves, and "share card" is no longer a
disabled stub.
**Acceptance:** copied URL === `cardPermalinkPath(cardId)` origin-qualified; `share_card.enabled === true`.

## Acceptance Criteria

1. `src/app/c/[cardId]/page.tsx` exists, is public, and renders `AllyshipCard variant="full"` for any of the 120 move-card ids.
2. `getCardById(unknown)` path → `notFound()` (real 404).
3. `generateStaticParams` returns all 120 move-card ids (prerendered; no runtime DB).
4. `generateMetadata` emits OpenGraph + Twitter title/description/image from the card.
5. A **branded card graphic** renders per card (element frame + gem + pip + gold edge + title + flavor + "Your move") in **both 1200×630 and 1080×1080**; both are reachable as PNGs and the page offers a download. (Approach A satori-safe: no `color-mix`, loaded font. Approach B build-time Playwright screenshots — decided in OQ #1.)
6. `share.ts` exports `cardPermalinkPath`, `cardImagePath`, and `deckCtaHref`; the page CTA, the download, and the deck reader's copy action all import from it.
7. `/c/[cardId]` is added to the public/deck-only route allowlist; a logged-out visitor is never gated.
8. `share_card` in `recommendation-card-view-model.ts` is `enabled: true` and targets the permalink.
9. A card with no `artKey` still renders and shares (graceful text-only).
10. `npm run build` and `npm run check` pass (this is the gate that a prior barrel-export bug slipped — the permalink route pulls the card graph into the build).

## Non-Goals

- Content calendar, scheduler (Buffer/Later), or any marketing-copy-in-repo sync.
- Metrics dashboard (UTMs + Gumroad analytics + sheet is v1).
- Reply/quest card recommender.
- Per-platform caption/thread adaptation (the graphic + link is the shared unit; captions stay manual).
- Animated/video card graphics (→ later).
- Instruction-card permalinks (→ v2).
- Gating or entitlement logic on the permalink (it is a public teaser).

## Risks

- **Fidelity vs. ops (the central build tradeoff):** Approach A (satori) is Vercel-native and
  on-demand but won't be pixel-identical to the DOM card (no `color-mix`, limited shadows/fonts);
  Approach B (Playwright build-time screenshots) is pixel-perfect but needs Chromium available in
  the build and ships 120+ static PNGs that must regenerate when card copy changes. This is the
  decision, not a defer (OQ #1). **Mitigation: prototype one card in A, eyeball it against the DOM
  card; only escalate to B if the gap is unacceptable.**
- **Giving away the deck:** a permalink shows one full card. Mitigation: one of 120 is a teaser
  (mirrors `/deck/preview`); the CTA sells the whole deck + the practice layer. Open question below.
- **Build coupling:** prerendering 120 pages pulls the deck graph into `next build` — good (catches
  type errors like the GatePath barrel bug), but it means a deck data error now fails the build.
  Acceptance #10 makes that explicit.
- **Link drift:** if the copy action and the route compute the URL differently they diverge.
  Mitigation: `share.ts` single source (AC #6).

## Open Questions

1. **Generation approach — A (satori) vs B (Playwright screenshots).** Fidelity vs. ops (see Risks).
   *Lean A; prototype one card and eyeball it against the DOM card before committing.* **Decide this
   first — it shapes the whole build.**
2. **Card-graphic content** — the graphic shows title + flavor + "Your move" + marks; does it also
   include the applications, or stay clean (title/flavor/move) for legibility at 1080²? *Lean clean.*
3. **Full card vs. teaser fields on the PAGE** — the `/c` page can show the entire face; hold any
   fields for owners? *Lean: show full — it's one of 120, and a richer share converts better.*
4. **Formats** — landscape 1200×630 + square 1080×1080 are required; add portrait 1080×1350 for
   IG/FB stories in v1, or defer? *Lean: landscape + square now, portrait fast-follow.*
5. **Campaign UTM value** — static `deck`, or per-context (`mtgoa` vs `cascade`)? *Lean: optional
   `?ctx=` → `utm_campaign`, so the same card link is attributable per campaign.*

## Verification Quest

`cert-card-permalink-v1` — a reviewer (or a Twine cert step): draw a card in the deck reader, use
"copy share link," open the copied URL in a logged-out browser, confirm (a) the card renders, (b)
the OG preview unfurls when pasted into a social composer, (c) the CTA lands on `/deck/sales` with
the card's `utm_content`. Frame it toward the launch: "share `OPEN-RA-SHAMAN`, confirm the funnel."

---

### Source / hooks
- Broken link: `src/components/deck/AllyshipDeckReader.tsx:544`. Disabled stub:
  `src/lib/allyship-deck/recommendation-card-view-model.ts:67`.
- Reuse: `getCardById` (`src/lib/allyship-deck/assemble.ts`), `AllyshipCard`
  (`src/components/deck/AllyshipCard.tsx`), public deck pages under `src/app/deck/*`.
- Product-access model / allowlist: `.specify/specs/allyship-deck-practice-page/spec.md`.
