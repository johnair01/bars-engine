# Reconciliation: PR #183 (built) × deck-card-share-permalink (this branch)

> **Why this exists.** Two unmerged branches independently built the same feature — a public
> per-card page + per-card social image:
> - **PR #183** `claude/card-landing-pages-zh3rtf` — `/deck/card/[id]` page + per-card OG image +
>   `DeckCardLanding` component + `/api/deck/events` analytics. **Built, CI-green, verified,
>   mergeable, open.** (Deck Sprint #1, a parallel Claude session.)
> - **This branch** — the `deck-card-share-permalink` spec + a `/c/[cardId]/image` satori
>   prototype (flavor/whack-forward, downloadable/square-intended).
>
> **Ruling: PR #183 is the BASE. Do not rebuild it.** This branch contributes the *deltas* #183
> lacks and folds its prototype in. One card-share surface ships, not two.

---

## 1. What PR #183 already built (the base)

| File | What |
|---|---|
| `src/app/deck/card/[id]/page.tsx` | RSC page; `generateStaticParams` (all 120 move cards), `generateMetadata` (og/twitter), id normalized to upper-case, unknown → `redirect('/deck/sales')`. |
| `src/components/deck/DeckCardLanding.tsx` | Client landing: 5:7 card, MovePip + id + FaceBadge, title, 3 glossary-linked tags, **self↔for-others toggle**, the **question**, "Restores {capabilities}" footer, fixed CTA → `/deck/sales`. |
| `src/app/deck/card/[id]/opengraph-image.tsx` | Per-card OG 1200×630 via `next/og`, **question-forward** (title + `primaryQuestion` + move/op/domain pills), element-tinted, static-generated. |
| `src/app/api/deck/events/route.ts` | `card_view` / `cta_click` beacon (`sendBeacon`), structured log, keyed by card id. |

**Two design calls #183 got right — adopt them:**
1. **Teaser depth.** The public page shows the **question only**; `forbiddenMoves` / `failureModes` /
   `remediation` stay **deck-only depth** ("the free page is the question; the paid deck is the
   working"). *This supersedes this spec's "show the full card face" lean.*
2. **On-site funnel analytics** (`/api/deck/events`) — per-card view + cta_click. More direct than
   the UTM-only plan for *engagement* attribution.

---

## 2. Where the two already agree (converged foundation)

- Public, ungated per-card page; reuse `getMoveCardById` + deck visual primitives (no new data model).
- Static-generated per card (`generateStaticParams`); `next/og` for the image; Satori-safe markup.
- Fixed CTA to `/deck/sales`, brand voice, no scarcity.
- The card graphic must *look like the card* the post was about.

That's ~80% of this spec, already shipped and tested by #183.

---

## 3. Conflicts → rulings

| # | Conflict | #183 | This branch | **Ruling** |
|---|---|---|---|---|
| C1 | **Route** | `/deck/card/[id]` | `/c/[cardId]` (the URL the app already copies) | **Canonical = `/deck/card/[id]`** (built, SEO-descriptive). **Add `/c/[cardId]` → 308 redirect** to it — short link is nicer for social and the app already copies it. Keep the app copying `/c/`; the redirect carries OG. |
| C2 | **Page depth** | question-only teaser | full face | **#183 wins — question-only.** Protects the paid deck. |
| C3 | **Image direction** | question-forward | flavor + "Your move" | **Lead with the FLAVOR line** (title + aphorism): punchier and *more* shareable than the question, and — unlike "Your move" — it reveals **no working**, so it respects C2's teaser boundary. **Drop "Your move" from the public graphic** (that's paid depth). *Open decision — see §5.* |
| C4 | **Analytics** | `/api/deck/events` beacon (built) | UTM on CTA | **Keep both — complementary.** Beacon = on-site engagement (view→cta). **UTM on the `/deck/sales` CTA** = attributes the *Gumroad sale* the beacon can't see. |
| C5 | **Downloadable / square** | OG preview only, 1200×630 | download + 1080² intended | **Add as a delta.** IG/Threads don't render link previews — the creator needs a **downloadable** graphic and a **square 1080×1080** to post directly. #183 lacks this; it's the real marketing need. |
| C6 | **`share_card` stub + app copy** | not wired | spec'd | **Enable `share_card`; wire the app copy → `/c/` (which redirects).** Close the already-broken share promise. |

---

## 4. The plan (deltas on top of #183)

**Step 0 — merge / rebase.** Land PR #183 first (or rebase these deltas onto it). Everything below
assumes #183 is in.

**Deltas this branch adds to #183:**
1. **`/c/[cardId]` short alias** → 308 redirect to `/deck/card/[id]`; wire `AllyshipDeckReader`'s
   copy action (already targets `/c/`) + flip `share_card` `enabled: true`. (C1, C6)
2. **Downloadable + square graphic** (C5): generalize #183's `opengraph-image` into a shared
   `BrandedCardGraphic({ card, format })` supporting **og 1200×630 + square 1080×1080**, and add a
   **"Save card image"** affordance on `DeckCardLanding`.
3. **Flavor-forward graphic** (C3): change the image hook from `primaryQuestion` to **`card.flavor`**
   (title + flavor aphorism), no "Your move". Pending Wendell's §5 call.
4. **UTM on the CTA** (C4): `/deck/sales?utm_source=card_share&utm_medium=social&utm_campaign={ctx}&utm_content={cardId}` via a shared `share.ts` helper.
5. **Font fidelity** (from the prototype's open lever): load Jost/Futura (`DECK_FONTS.display`) into
   the `ImageResponse` — the biggest felt-authenticity jump for both #183's OG and the downloadable.

**Retire:** the standalone `src/app/c/[cardId]/image/route.tsx` **prototype** — its design folds into
#183's image route as the `BrandedCardGraphic` + square/download deltas. Don't keep two image routes.

---

## 5. Open decision for Wendell (the one real fork)

**Image creative direction — what's the hook on the shared graphic?**
- **(a) Flavor-forward** *(recommended)* — title + the aphorism (*"The naming is the first move."*).
  Punchy, scroll-stopping, reveals no working (respects the teaser boundary), best for a post people
  actively share.
- **(b) Question-forward** *(#183 as built)* — title + the primary question. More "curiosity/teaser,"
  keeps the answer paid, already shipped.
- **(c) Both** — question-forward for the *link OG unfurl*, flavor-forward for the *downloadable
  square*. Most work; most tailored per surface.

*Lean (a)* — it's the shareable hook and it honors #183's teaser logic. Decide this before the C3/C5
deltas are built.

---

## 6. Net

- **#183 ships the surface** (page + OG + analytics + teaser depth) — merge it.
- **This branch adds the marketing last-mile** (short `/c/` link, downloadable + square graphic,
  flavor hook, UTM sale-attribution, font fidelity) — as deltas, not a parallel build.
- **The `deck-card-share-permalink` spec** stands as the intent; its route/depth/creative decisions
  are updated by this doc (C1 route, C2 depth → #183; C3 hook → flavor; C5 download/square retained).

### Source
- PR #183: `johnair01/bars-engine#183` (`claude/card-landing-pages-zh3rtf`), 4 files, open.
- This spec: `.specify/specs/deck-card-share-permalink/spec.md`. Prototype (to retire):
  `src/app/c/[cardId]/image/route.tsx`. App copy: `AllyshipDeckReader.tsx:544`. Stub:
  `recommendation-card-view-model.ts:67`.
