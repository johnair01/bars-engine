# Tasks: Superpower Quiz Design

> Per [spec.md](./spec.md) + [plan.md](./plan.md), grounded in
> [RESEARCH_quiz-construction.md](./RESEARCH_quiz-construction.md). API-first:
> data + `scoreQuiz` (tested) before UI. Gate each phase with
> `npm run build` && `npm run check`.

## Phase 1 — Item bank + scoring (pure, no I/O) — DONE
- [x] **T1.0** `src/lib/superpowers/types.ts` — base `Superpower` (7),
      `SuperpowerOrientation`, `orientationToMoveAspect`, `SUPERPOWERS`,
      `SUPERPOWER_DEFS` (element/domains/shadows). *(campaign Phase 1 T1.1)*
- [x] **T1.1** `src/lib/superpowers/quiz/types.ts` — `QuizItem`, `QuizOption`,
      `QuizAnswer`, `QuizResult`, `OrientationItem`. (FR1-3)
- [x] **T1.2** `src/lib/superpowers/quiz/items.ts` — ported the reviewed
      [item-bank.md](./item-bank.md) (11 forced-choice items, multi-weighted
      quasi-ipsative; ≥3 signals/superpower verified by test). (FR1)
- [x] **T1.3** `ORIENTATION_ITEM` (internal/external) — lives in `items.ts`
      (not a separate file). (FR3)
- [x] **T1.4** `src/lib/superpowers/quiz/score.ts` — `scoreQuiz`: additive →
      percent-of-max → rank 7 → margin → `confident` → primary/secondary;
      exported `CONFIDENCE_THRESHOLD` (0.1) + fixed `TIE_ORDER`; dedupes answers
      per item so pct ≤ 1. (FR2)
- [x] **T1.5** `__tests__/score.test.ts` — 10 tests (tsx + node:assert):
      structure, ≥3 signals/type, determinism, every superpower reachable,
      empty→TIE_ORDER, near-tie<θ⇒not confident, clear winner confident,
      normalization across unequal item counts, dedupe, orientation passthrough.
      **Passes 10/10 via `npx tsx`.** (FR4)
- [ ] **T1.6** Gate: `npm run build` && `npm run check` in full env (sandbox has
      no `node_modules`; subset `tsc` showed no errors in the new files — only
      missing `@/` alias + `@types/node` resolved by the project config).

## Phase 2 — Result descriptions + ethics — DONE
- [x] **T2.1** `src/lib/superpowers/quiz/descriptions.ts` — per-superpower
      **falsifiable, behavioral** copy **including the overuse/avoidance shadow**;
      no two-sided hedges; favorability NOT equalized. (FR5)
- [x] **T2.2** Result-framing copy: lens-not-verdict, **mechanism disclosure**,
      "you are the authority / try the adjacent one." No authority/AI cosplay. (FR6)
- [x] **T2.3** `BARNUM_CHECK.md` — verify a *foreign* superpower's description is
      distinguishable from one's own (the Barnum A/B antidote); recorded in BARNUM_CHECK.md. (FR6) DONE
- [x] **T2.4** Lint pass: no double-headed hedges; behavioral not adjectival — verified in BARNUM_CHECK.md. (FR5) DONE

## Phase 3 — Handoff + verification (UI owned by campaign spec)
- [x] **T3.1** Map `QuizResult` → `SuperpowerRoutingResult` — DONE:
      `src/lib/superpowers/routing.ts` (`quizResultToRouting`, `resolveSuperpowerIntake`);
      carries secondary + margin + ranked for the reveal. Tested routing.test.ts. (FR7)
- [ ] **T3.2** Confirm the campaign reveal renders primary + secondary + margin
      band + shadow + mechanism disclosure, **no email gate**, WCAG-accessible.
      (FR7 — implemented in parent spec)
- [x] **T3.3** `cert-superpower-quiz-v1` Twine+CustomBar cert seeded via
      `scripts/seed-cert-mobility-superpower.ts` (`npm run seed:cert:superpower`),
      isSystem+public, idempotent, fundraiser-framed. tsc+eslint clean. (FB)
- [ ] **T3.4** Gate: `npm run build` && `npm run check`; run the cert end-to-end.

## Backlog sync
- [ ] **T4.1** Add to `.specify/backlog/BACKLOG.md`; run `npm run backlog:seed`.

## Cross-cutting acceptance (research-grounded)
- [ ] Result = primary + secondary + visible margin band (never a lone hard label).
- [ ] Every superpower description carries its shadow; favorability not equalized.
- [ ] No two-sided hedges; descriptions behavioral & falsifiable (Barnum check passed).
- [ ] No email gate before results; no confirmshaming; symmetric opt-out.
- [ ] Mechanism disclosed; taker framed as final authority ("try the adjacent one").
- [ ] `scoreQuiz` deterministic; exact ties via fixed chain, never random.
- [ ] WCAG: labels, keyboard, focus-on-error, DOM=visual order; mobile-first.
- [ ] Bounded: 12 items / 7 superpowers / 1 orientation axis; no AI required.
