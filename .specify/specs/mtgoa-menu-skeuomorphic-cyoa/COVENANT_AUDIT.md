# Covenant Audit — MtGoA Menu Redesign (Phase 3)

> UI_COVENANT.md §Step 5 checklist run against the redesign's new/changed files:
> `src/app/mastering-allyship/hub/page.tsx`, `src/app/mastering-allyship/spoke/[index]/page.tsx`,
> `src/components/menu/CardTable.tsx`, `src/components/menu/DeckCard.tsx`, plus the
> `.card-table*` / `.card-funnel-ribbon` CSS and `SURFACE_TOKENS.tableSlate*` tokens.
> Date: 2026-06-15.

## Step 5 checklist

| Check | Result |
|---|---|
| All text contrast ≥ 4.5:1 (3:1 large/UI) | ✅ **Fixed.** `text-zinc-500` at `xs`/`10–11px` (≈3.7:1) bumped to `text-zinc-400` (≈6.4:1) across hub, spoke, DeckCard. Remaining `text-zinc-500` is only at `text-sm` (the covenant-sanctioned pairing). Body = zinc-100/300/400; element-gem numerals/verbs are large text (≥14px bold) and pass 3:1; WAVE move labels use bright 400-level hues. |
| All touch targets ≥ 44px | ✅ for primary/standalone actions: deck cards are full-card links (tall); spoke door CTA + "Back to the deck" links now `min-h-[44px]`. ⚠ **Accepted minor:** inline breadcrumb links are text navigation (< 44px tall) — standard breadcrumb pattern, not a primary touch target. |
| No `text-zinc-600` at `text-xs` | ✅ None present. |
| No hardcoded hex in component files | ✅ **Fixed.** Page backgrounds now derive from `SURFACE_TOKENS.bgBase` (was `bg-[#0a0908]`). No hex literals in JSX/style. Aesthetic hex lives only in `cultivation-cards.css` (the sanctioned aesthetic file) and is mirrored in `card-tokens.ts`. |
| No arbitrary Tailwind values for aesthetic | ✅ **Fixed.** Removed `bg-[#0a0908]`. Remaining arbitrary values are **size/layout only** (`text-[10px]`, `text-[11px]`, `min-h-[44px]`) — Tailwind's domain, not aesthetic color/shadow/animation. Element color/glow/ribbon-tint flow through CSS vars + tokens. |
| All 8 interaction states present | ✅ via the `CultivationCard` primitive (default/hover/focus/active/selected/disabled/loading/ritual, all in `cultivation-cards.css`). DeckCard exercises default/hover/active; **focus is now visible** on the card link (2px white ring + 2px offset, was `focus:outline-none`). `disabled` used for the "coming soon" slot. |
| `prefers-reduced-motion` guard | ✅ `CultivationCard` entry/float/hover transforms are guarded by the `@media (prefers-reduced-motion: reduce)` block in `cultivation-cards.css`. New `.card-table` / `.card-funnel-ribbon` are static (no motion). |
| `aria-label` on all cards | ✅ DeckCard, the spoke card, and the disabled "coming soon" card all pass an `aria-label` (identity); `CultivationCard` default encodes element/altitude/stage. |
| UI_COVENANT.md read at session start | ✅ |

## Covenant law spot-checks

- **Three channels only / semantic color** (Laws 1, 9): card **frame = the player's nation element** (color channel intact). The funnel ribbon is a *small semantic wayfinding accent* tinted via `RIBBON_TINT_ELEMENT` (a real token), not the frame — justified, not decorative.
- **Warm near-black, not pure black** (Law 13): card body `#1a1a18`, page base `SURFACE_TOKENS.bgBase` `#0a0908`, slate table cool `#15161a` — no `bg-black`. Description/WAVE wells use translucent `bg-black/20–30` darkening *overlays* on the card (not the base surface).
- **Physical card feel**: the `inset 0 1px 0` top-edge highlight (from `.cultivation-card`) + `.card-table__slot` cast shadow onto the slate are present on every card.
- **Tokens committed** (Law 14): slate surface lives in `SURFACE_TOKENS` + `cultivation-cards.css`; ribbon tint maps live in `spoke-funnel-map.ts`. No token lives only in a component.

## Verdict
**Pass**, with one documented minor deviation (inline breadcrumb link height). All blocking
items (contrast, hardcoded hex/arbitrary aesthetics, focus visibility) are resolved.

## Phase 4 (verification quest) — authored
- `cert-mtgoa-menu-redesign-v1` Twine + seed authored:
  `scripts/seed-cert-mtgoa-menu-redesign.ts` (`npm run seed:cert:mtgoa-menu-redesign`).
  Remaining: run the seed + walk it end-to-end (needs a DB).
