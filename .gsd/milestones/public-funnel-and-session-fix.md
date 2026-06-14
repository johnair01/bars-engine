# GSD Milestone — Public Funnel + Session Persistence Fix

> Redesign step toward: (1) people understand the offering BEFORE login, (2) the
> book / deck / game / sales page are reachable directly, (3) logged-in users get
> quick access to creating BARs. Scope chosen with the user (2026-06-12):
> **session fix + un-gate landing & nav + a public sales hub**. The deeper
> per-product cross-sell and a full marketing redesign are follow-ups.

## Decisions (from intake Q&A)
- **Sales page is the front door / funnel hub** — a public `/pricing` that points
  to the products and cross-sells between paths (user's framing: everything sits
  "behind" a sales page; cross-sell from whatever path the visitor takes).
- Keep the existing dark app aesthetic (bg-black / zinc / green-emerald), respect
  UI_COVENANT base tokens (contrast ≥ AA, 44px targets, thumb-first CTAs).

## Slices
### Slice 1 — Session persistence (the "can't stay logged in" tech debt)
- [x] Root cause: `src/actions/conclave-auth.ts:79` set `bars_player_id` with no
      `maxAge`/`path` → session-scoped cookie, dropped on browser close. Signup
      path already set `path:'/'` + 30-day maxAge. Login now mirrors it.

### Slice 2 — Public funnel
- [x] `src/lib/marketing/products.ts` — single source of truth for Book / Deck /
      Game (href, cta, public-access flag, cross-sell helper).
- [x] `src/app/pricing/page.tsx` — public sales hub: three product cards with
      CTAs + per-card "Also explore" cross-sell + account/support CTAs. Renders
      even with the DB unreachable (front door never blocks on Postgres).
- [x] `src/components/NavBar.tsx` — logged-out nav now shows START (/pricing),
      BOOK (/handbook), PLAY (/play/) instead of only "Log in".
- [x] `src/app/page.tsx` — logged-out landing leads with "Explore the book, deck
      & game" → /pricing; "Play the game" → /play/; Support + Log In secondary.

## Product/route mapping (uses existing routes; no invented URLs)
- Book → `/handbook` (already public). Deck → `/creator-scene-deck` (auth-gated →
  funnels to login). Game → `/play/` (public Vite embed from option 2; deep link
  `/play/#applied`).

## Verification (this run)
- `npm run validate:routes` → exit 0 (warnings pre-existing repo-wide).
- `npx tsc --noEmit` → 0 errors.
- `eslint` changed files → 0 errors (warnings pre-existing in page.tsx).
- Full `next build` not run locally (heavy; needs build env). Vercel preview will
  build it; changes are additive + DB-resilient.

## Open decisions / follow-ups (need product input)
- "The Deck" as a sellable product: no public product/checkout page exists; the
  card currently links to the auth-gated creator lab. Real purchase/destination
  URLs (book, deck) should be wired into `products.ts` when available.
- Deeper cross-sell (banners inside /handbook, /play, /event paths).
- Logged-in "quick BAR creation" entry point (goal #1) — not in this slice.
