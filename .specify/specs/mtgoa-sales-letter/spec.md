# Spec: MTGOA Sales Letter — book + deck cold-open funnel

**Slug**: `mtgoa-sales-letter`
**Status**: Design spec (copy + flow) → ready for Claude Design
**Owner**: Wendell

---

## Purpose

Write the **Mastering the Game of Allyship (MTGOA)** sales page — a long-form **sales letter** for the
**book + the Oracle Deck** — and wire the **Superpower quiz** and the **Allyship Myth quiz** into it as
the interactive hooks that pull a cold reader in, personalize the pitch, and convert to a purchase.

This is the **book's cold-open funnel** (ref `allyship-book`). It is **not** The Crossing. The
superpower/myth interactions exist here **to sell the book and the deck** — their payoff is an offer,
not character creation.

**Problem**: The book sales page does not exist yet, and the two most compelling interactive assets we
have (the mature Superpower quiz + the myth work) are currently buried inside a campaign-onboarding
funnel (`/campaign/[ref]/begin`) whose payoff is "create your character." On a *sales* page the payoff
must be **"you just felt the game work on you — now get the book + deck that teach it."**

**Practice**: Deftness — copy + flow first (this spec), then Claude Design for the visual, then wire the
existing quiz/myth components + the `offers.ts` Gumroad SKUs. Deterministic (no AI) on the reader's path.

---

## The three artifacts in this folder

1. **[`SALES_LETTER.md`](SALES_LETTER.md)** — the actual long-form sales copy. This is the thing you paste
   into Claude Design. On-voice, grounded in the real SKUs; `[AUTHOR: …]` marks the few things only you
   can supply (origin story, price/PWYW call, testimonials).
2. **[`CLAUDE_DESIGN_PROMPT.md`](CLAUDE_DESIGN_PROMPT.md)** — the paste-into-Claude-Design brief (design
   system + section-by-section layout of the letter + the two interactive hooks + the offer grid).
3. **This spec** — the flow/wiring: routes, components to reuse, offer integration, and the one open
   dependency (the myth *quiz*).

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **What's sold** | The **book** (`book-digital` $15 / `book-physical` $25 preorder) + the **Oracle Deck** (`deck-digital` $10). Secondary upsells: RPG Handbook, The Game (monthly), Founding Ally Bundle. All from `src/lib/launch/offers.ts`. |
| **Commerce** | **Gumroad** (Phase 1), via the `NEXT_PUBLIC_GUMROAD_*_URL` envs already wired in `offers.ts`. No in-app checkout. |
| **Route** | New canonical sales page at **`/mastering-allyship`** (root is free today — only `/hub` and `/spoke` exist under it). The letter lives here; social posts point here. |
| **The two hooks** | **Superpower quiz** (`SuperpowerQuiz`, reused) and the **Allyship Myth quiz** (see Open Dependency). Both are *lead magnets*: they personalize the pitch, then hand to the offer. |
| **Hook payoff = sell, not create** | Re-point the quiz/myth outcome: on the book funnel the result reveals **why you need the book + deck** and drops the offer, instead of "create your character." (This also sidesteps the character-creation flow, which is out of scope / flagged for rework.) |
| **Superpower → deck tie** | The reveal ("You're a Connector") sells the deck: *the 120-move Oracle has your moves*, and there's a per-superpower expansion pack (`superpower-<sp>-pack`) already in `offers.ts`. Direct product tie. |
| **Myth → book tie** | The myth quiz surfaces the misconception running the reader, reframes it, and names the book as where the *real* practice lives. |
| **Email fallback** | Not-ready-to-buy readers capture email (reuse the `/awaken` → `/api/awaken/signup` → `FunnelSignup` pattern, `intent: 'book'`). |
| **AI-allergy** | The letter is human, earned, specific — mythic not hypey. No fake scarcity, no manipulative countdowns. The quizzes are opt-in inside the page, never a wall. |

---

## Open dependency — the Myth *quiz* (needs your Claude Design artifact)

You flagged that **the myth *reframe* I built (`ALLYSHIP_MYTHS`: myth → truth → reframe cards) is NOT the
myth *quiz* handed off from Claude Design.** That quiz is not in the repo. To wire it exactly I need it —
paste the copy or share the Claude Design URL. Until then this spec treats the myth quiz as a **slot**
with a defined contract:

- **Input**: reader answers a few forced-choice items.
- **Output**: the one allyship **myth** they most believe → a reframe → a book/deck CTA.
- **Data**: capture `mythResult` on the lead/`FunnelSignup` for segmentation.
- The existing `ALLYSHIP_MYTHS` content can seed the *reframe copy* but the **quiz instrument** is yours.

---

## Conceptual model — the funnel

```
 social post ─▶ /mastering-allyship  (the SALES LETTER)
                     │
     ┌───────────────┼────────────────┐
     ▼               ▼                 ▼
 Superpower quiz   Myth quiz       (scroll the letter)
  "You're a X"    "You believe Y"        │
     │  the deck      │  the book        │
     └──────┬─────────┴──────────────────┘
            ▼
        OFFER GRID  (book · deck · bundle · handbook · game · founding ally)
            │  Gumroad
            ▼
        purchase  ── or ──  email capture (FunnelSignup, intent:'book')
```

The superpower quiz sells **the deck** (your moves, your pack). The myth quiz sells **the book** (the real
practice). The letter carries anyone who doesn't take a quiz straight to the offer.

---

## Functional Requirements (wiring, after Claude Design returns the visual)

- **FR1**: Route `/mastering-allyship/page.tsx` — the sales letter (server component; public; `@entity CAMPAIGN`).
- **FR2**: Reuse `SuperpowerQuiz` (already accepts `campaignRef` + `onComplete`) as the superpower hook; on complete, render a **deck-selling reveal** (superpower → deck + `superpower-<sp>-pack`), not character creation.
- **FR3**: Myth-quiz component (from your Claude Design artifact) as the myth hook; on complete, render a **book-selling reframe**.
- **FR4**: Offer grid driven by `getOffer()` / the `offers.ts` registry; each card links to its Gumroad URL (or "setup pending" when the env is absent — honest by default, already the pattern).
- **FR5**: Email capture (`intent:'book'`) via the `/api/awaken/signup` pattern → `FunnelSignup`.
- **FR6**: Make `/campaign/[ref]/begin`'s ending **ref-aware** — for `allyship-book` the payoff is the offer/CTA, not `/character/create`. (Keeps `/begin` reusable; the book funnel gets the sell ending.)
- **FR7** (analytics, light): tag quiz completions + offer clicks so we can see superpower-mix and myth-mix of buyers.

## Non-Functional

- Deterministic on the reader path; no AI, no auth wall. Mobile-first (social traffic).
- UI_COVENANT tokens; element = color (book→Water, deck→Fire, handbook→Metal, game→Wood, physical→Earth — the semantic mapping already in `offers.ts`).
- Honest commerce: no dead links, no fake urgency.

## Out of scope (flagged, separate)
- The **character-creation flow rework** ("pretty wack") — tracked separately; the book funnel avoids it by ending in a purchase.
- The Crossing's post-intro superpower+myth link — separate (that's an *invite* campaign, gated after the campaign intro).

## Dependencies / references
- SKUs + Gumroad: `src/lib/launch/offers.ts`; deck copy: `src/lib/launch/deck-sales-copy.ts`; deck sales page precedent: `src/app/deck/sales/page.tsx`.
- Superpower quiz: `src/components/superpowers/SuperpowerQuiz.tsx`, `src/lib/superpowers/*` (defs, arc, packs).
- Myths (reframe copy): `src/lib/allyship-myths/myths.ts`. **Myth quiz instrument: your Claude Design artifact (needed).**
- Email capture pattern: `src/app/awaken/AwakenFlow.tsx` → `/api/awaken/signup` → `FunnelSignup`.
