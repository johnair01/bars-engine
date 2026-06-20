# Tasks: Superpower Quiz Design

> Per [spec.md](./spec.md) + [plan.md](./plan.md), grounded in
> [RESEARCH_quiz-construction.md](./RESEARCH_quiz-construction.md). API-first:
> data + `scoreQuiz` (tested) before UI. Gate each phase with
> `npm run build` && `npm run check`.

## Phase 1 — Item bank + scoring (pure, no I/O)
- [ ] **T1.1** `src/lib/superpowers/quiz/types.ts` — `QuizItem`, `QuizOption`,
      `QuizAnswer`, `QuizResult`, `OrientationItem`. (FR1-3)
- [ ] **T1.2** `src/lib/superpowers/quiz/items.ts` — over-generate ~40+ candidate
      forced-choice situational items, trim to **~12**; each option **multi-weighted
      & quasi-ipsative**; ensure **≥3–4 signals per superpower** and balanced/
      normalizable item counts; copy in Wendell's voice; derived from Strategy
      Guides' "Signs Someone Needs an X" + shadows + element/emotion (Coach from
      addendum). (FR1)
- [ ] **T1.3** `src/lib/superpowers/quiz/orientation.ts` — internal/external
      orientation item(s) (the addendum polarity). (FR3)
- [ ] **T1.4** `src/lib/superpowers/quiz/score.ts` — `scoreQuiz`: additive →
      percent-of-max → rank all 7 → margin → `confident` → primary/secondary;
      exported `CONFIDENCE_THRESHOLD` + fixed `TIE_ORDER`. (FR2)
- [ ] **T1.5** `__tests__/score.test.ts` — determinism; exact-tie uses TIE_ORDER;
      near-tie (margin < threshold) ⇒ `confident:false`; item-count normalization;
      every superpower reachable. (FR4)
- [ ] **T1.6** Gate: `npm run check`.

## Phase 2 — Result descriptions + ethics
- [ ] **T2.1** `src/lib/superpowers/quiz/descriptions.ts` — per-superpower
      **falsifiable, behavioral** copy **including the overuse/avoidance shadow**;
      no two-sided hedges; favorability NOT equalized. (FR5)
- [ ] **T2.2** Result-framing copy: lens-not-verdict, **mechanism disclosure**,
      "you are the authority / try the adjacent one." No authority/AI cosplay. (FR6)
- [ ] **T2.3** `BARNUM_CHECK.md` — verify a *foreign* superpower's description is
      distinguishable from one's own (the Barnum A/B antidote); record the check. (FR6)
- [ ] **T2.4** Lint pass: no double-headed hedges; behavioral not adjectival. (FR5)

## Phase 3 — Handoff + verification (UI owned by campaign spec)
- [ ] **T3.1** Map `QuizResult` → `SuperpowerRoutingResult` (primary=superpower,
      orientation); carry secondary + margin for the reveal. (FR7)
- [ ] **T3.2** Confirm the campaign reveal renders primary + secondary + margin
      band + shadow + mechanism disclosure, **no email gate**, WCAG-accessible.
      (FR7 — implemented in parent spec)
- [ ] **T3.3** `scripts/seed-cert-superpower-quiz.ts` — `cert-superpower-quiz-v1`
      (Twine + `CustomBar`, `isSystem:true`, `visibility:'public'`, idempotent),
      fundraiser-framed; add `seed:cert:superpower-quiz` npm script. (FR8)
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
