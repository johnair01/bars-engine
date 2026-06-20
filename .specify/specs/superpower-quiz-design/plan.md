# Plan: Superpower Quiz Design

> Implement per [spec.md](./spec.md), grounded in
> [RESEARCH_quiz-construction.md](./RESEARCH_quiz-construction.md). **API-first**:
> item bank + `scoreQuiz` (pure, tested) before any UI. **Deterministic over AI**.
> This spec produces the *instrument*; the parent
> [`mobility-quest-superpower-campaign`](../mobility-quest-superpower-campaign/spec.md)
> owns persistence, the ECI wiring, and the reveal UI.

## Strategy

Three thin layers; the quiz is mostly **authored data + one pure function**.

```
Layer 1  data + logic   quiz/items.ts (bank) + quiz/score.ts (scoreQuiz) + tests
Layer 2  copy           result descriptions (with shadows) + framing + Barnum check
Layer 3  handoff        map QuizResult -> SuperpowerRoutingResult (campaign spec wires UI)
```

### Why data-first
The whole instrument is content + a deterministic scorer. Getting the **item bank**
and **scoring/tie-break** right (and unit-tested) de-risks everything before any
pixels. Copy (Layer 2) is where the anti-Barnum discipline lives and can be
reviewed independently.

## Critical files

| Concern | File | Change |
|--------|------|--------|
| Item bank | `src/lib/superpowers/quiz/items.ts` | **new** — ~12 forced-choice items + candidate pool; multi-weighted options |
| Orientation items | `src/lib/superpowers/quiz/orientation.ts` | **new** — internal/external prompt(s) |
| Scoring | `src/lib/superpowers/quiz/score.ts` | **new** — `scoreQuiz` (normalize, rank, margin, tie-break) |
| Types | `src/lib/superpowers/quiz/types.ts` | **new** — `QuizItem/Option/Answer/Result` |
| Descriptions | `src/lib/superpowers/quiz/descriptions.ts` | **new** — falsifiable, shadow-bearing copy |
| Barnum check | `.specify/specs/superpower-quiz-design/BARNUM_CHECK.md` | **new** — foreign-type distinguishability review |
| Tests | `src/lib/superpowers/quiz/__tests__/score.test.ts` | **new** — determinism, ties, normalization |
| Handoff | (campaign) `src/lib/cyoa-intake/resolveRouting.ts` | **extend** in parent spec — accept `QuizResult` |
| Cert | `scripts/seed-cert-superpower-quiz.ts` | **new** — Twine + CustomBar seed |

## Scoring algorithm (locked)

```
1. raw[type]   = Σ option.weights[type] over chosen options
2. max[type]   = Σ (max possible weight[type] per item it appears in)
3. pct[type]   = max[type] > 0 ? raw[type] / max[type] : 0     // percent-of-max
4. ranked      = types sorted by pct desc, tie-break = TIE_ORDER (fixed)
5. primary, secondary = ranked[0], ranked[1]
6. margin      = pct[primary] − pct[secondary]
7. confident   = margin >= CONFIDENCE_THRESHOLD   // ~0.10, tune via pilot
8. orientation = from orientation item(s)
```

- **TIE_ORDER**: a fixed array of all 7 superpowers (e.g. rarer→commoner, or
  authored priority) — never `Math.random`.
- **CONFIDENCE_THRESHOLD**: single exported constant; Open Q #1.

## Anti-pattern guardrails (from research)
- No equalized favorability → every description carries its shadow.
- No two-sided hedges → lint copy for "but also / can be X yet Y".
- No email gate before results (enforced in the campaign reveal).
- No authority/AI-divination framing in copy.
- Barnum self-check before Phase 3: a foreign type's description must be
  distinguishable from one's own.

## UI strategy (handed to the campaign spec)
- Reuse `ComposerStepRenderer` for the 12 items; `CultivationCard` for the reveal.
- Reveal shows ranked top-2 + margin band + shadow + mechanism disclosure +
  "try the adjacent one." Tailwind layout only; tokens for color.

## Verification
- Unit: determinism, exact-tie chain, near-tie margin, normalization, reachability.
- `cert-superpower-quiz-v1` Twine cert.
- Gate: `npm run build` && `npm run check`.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Item-count tension (psychometrics vs UX) | Multi-weighted options → ~12 Q still gives ≥3–4 signals/type |
| Quiz feels Barnum / extractive | Shadows + falsifiable copy + mechanism disclosure + Barnum self-check |
| Type instability erodes trust | Report primary+secondary+margin, frame as a lens, "try adjacent" |
| Coach thinner than peers | Flag provisional; author Coach Strategy Guide (parent task T1.2a) |
| Scope creep into a "personality engine" | Spec caps at 12 items / 7 types / 1 orientation; expansion is explicit |

## Dependencies
- Parent campaign spec (consumer + UI owner); Strategy Guides + addendum (content);
  research report (evidence).
