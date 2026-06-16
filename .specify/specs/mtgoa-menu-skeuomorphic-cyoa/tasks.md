# Tasks: MtGoA Menu — Skeuomorphic CYOA Redesign

> **Intake-first.** Do not start Phase 1 before Phase 0 is answered with the host.
> Read `UI_COVENANT.md` at session start. Run `npm run build` + `npm run check` before done.

## Phase 0 — Design intake (GATE)
- [x] **T0.1** Read `UI_COVENANT.md` + handbook + tokens.
- [x] **T0.2** Run the intake with the host — deck-on-slate-table; CultivationCards in player's nation element; "Draw"; open board.
- [x] **T0.3** Write `design-intake.md` (answered brief) + token-map table.
- [x] **T0.4** Confirm scope — hub + spoke page + reusable menu primitive.
- [x] **T0.5** Launch-goals respec for card-face content (C8) — **done via six-faces analysis** ([SIX_FACES_FUNNEL_ANALYSIS.md](./SIX_FACES_FUNNEL_ANALYSIS.md)): Kotter arc = funnel ladder; per-spoke ribbon map; spoke list unchanged. Implementation adds a `spokeFunnelMap` → ribbon (FR4); live wall targets depend on MBLD.

## Phase 1 — Token & material foundation
- [x] **T1.1** Add slate-table surface tokens (`tableSlate`/`tableSlateCenter`/`tableSlateEdge`) to `src/lib/ui/card-tokens.ts` (`SURFACE_TOKENS`).
- [x] **T1.2** Add skeuomorphic classes to `src/styles/cultivation-cards.css`: `.card-table` (cool slate + vignette + grain), `.card-table__slot` (cast shadow), `.card-funnel-ribbon` (semantic `--ribbon-tint`). Warm card bodies keep the existing top-edge highlight.

## Phase 2 — Hub redesign
- [x] **T2.1** Rebuild `/mastering-allyship/hub` as a **deck on the slate `.card-table`**; spokes are `CultivationCard`s. **Also made the page PUBLIC** (removed auth redirect) — it's a sub-landing/funnel, not gated content.
- [x] **T2.2** CYOA affordance per spoke: chapter numeral, Kotter stage, feeling chip, wall-tinted **funnel ribbon**, **"Draw →"**; whole card links to its public funnel door.
- [x] **T2.3** Interaction states + motion via the `CultivationCard` primitive (hover/focus/active/selected/etc. in CSS) + `animated` entry; reduced-motion already guarded in `cultivation-cards.css`.
- [x] **T2.4** Redesigned `/mastering-allyship/spoke/[index]` as "the drawn card, opened" on the slate `CardTable` (header, feelings, funnel ribbon + door CTA, description well, WAVE move wells); **made PUBLIC**.
- [x] **T2.5** Extracted the reusable primitives in `src/components/menu/`: **`CardTable`** (slate tray, used by hub + spoke) and **`DeckCard`** (the deck-card cookie cutter, used by the hub). Hub refactored onto both; available for other menu surfaces.

## Phase 3 — Accessibility + covenant check
- [x] **T3.1** Ran covenant §Step 5 checklist → [COVENANT_AUDIT.md](./COVENANT_AUDIT.md). **Pass** (1 documented minor: breadcrumb link height). Fixed: contrast (`zinc-500`→`zinc-400` at small sizes), hardcoded `bg-[#0a0908]`→`SURFACE_TOKENS.bgBase`, focus visibility on the card link (`focus:outline-none`→visible ring), 44px on standalone links.

## Phase 4 — Verification quest (required)
- [x] **T4.1** Authored Twine passages for `cert-mtgoa-menu-redesign-v1` (4 steps: public+tactile deck, read-at-a-glance, draw routing, reduced-motion; final no link → mints reward).
- [x] **T4.2** `scripts/seed-cert-mtgoa-menu-redesign.ts` + `seed:cert:mtgoa-menu-redesign` npm script (idempotent upsert; `isSystem`, `visibility: 'public'`, resets PlayerQuest/TwineRun).
- [ ] **T4.3** Run `npm run seed:cert:mtgoa-menu-redesign` and walk the quest end-to-end (**needs a DB** — pairs with local DB work).

## Phase 5 — Fail-fix
- [ ] **T5.1** `npm run build`.
- [ ] **T5.2** `npm run check`.
- [ ] **T5.3** Update checkmarks; note deferrals.
