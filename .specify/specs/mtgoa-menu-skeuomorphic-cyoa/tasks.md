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
- [ ] **T2.4** Apply treatment to `/mastering-allyship/spoke/[index]` (in scope; not yet started).
- [ ] **T2.5** Extract the reusable **card-table menu primitive** (scope D11) once the spoke page confirms the shared shape.

## Phase 3 — Accessibility + covenant check
- [ ] **T3.1** Run covenant §Step 5 checklist: contrast ≥4.5:1, 44px targets, no `text-zinc-600` at `text-xs`, no arbitrary Tailwind aesthetic values, aria-labels, reduced-motion guards.

## Phase 4 — Verification quest (required)
- [ ] **T4.1** Author Twine passages for `cert-mtgoa-menu-redesign-v1` (4 steps; final no link).
- [ ] **T4.2** `scripts/seed-cert-mtgoa-menu-redesign.ts` + npm script (idempotent; `isSystem`, `visibility: 'public'`).
- [ ] **T4.3** Walk the quest; capture before/after screenshots.

## Phase 5 — Fail-fix
- [ ] **T5.1** `npm run build`.
- [ ] **T5.2** `npm run check`.
- [ ] **T5.3** Update checkmarks; note deferrals.
