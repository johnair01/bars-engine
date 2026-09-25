# Plan: Emotional Alchemy Charge Diagnostic

## Strategy

Pure-logic core first (types + deterministic functions + step planner), unit-tested with the same drift/threshold rigor as the registry, then a thin `SceneCard`-based client instrument that only orchestrates the pure core and holds raw text locally. DB-free, client-first (deck precedent). One route. One cert seed.

## File impacts

| File | Action | Content |
|---|---|---|
| `src/lib/emotional-alchemy/vector.ts` | create | Vector + context types, defaults, flat fork, classifier, fork predicates, `planSteps`, `finalizeResult` |
| `src/lib/emotional-alchemy/index.ts` | edit | `export * from './vector'` |
| `src/lib/emotional-alchemy/__tests__/vector.test.ts` | create | FR11 coverage |
| `vitest.config.ts` | edit | add test file |
| `src/components/practice/DiagnosticFlow.tsx` | create | `'use client'` stepper over `planSteps`; SceneCard steps; crisis + capture-only affordances; `onComplete/onCrisis/onCaptureOnly` |
| `src/components/practice/DiagnosticSummary.tsx` | create | the structured read card (channel→target, shape chip, time/temporal/fuel, flags) |
| `src/app/practice/diagnose/page.tsx` | create | RSC page rendering a client `DiagnoseClient` wrapper |
| `src/app/practice/diagnose/DiagnoseClient.tsx` | create | client wrapper: runs `DiagnosticFlow`, shows summary/crisis/capture end states |
| `scripts/seed-cert-emotional-alchemy-diagnostic.ts` | create | cert seed (go-deeper pattern) |
| `package.json` | edit | `seed:cert:emotional-alchemy-diagnostic` script |

## Key implementation notes

- **Privacy is structural**: `DiagnosticResult` simply has no string blocker/story field. `DiagnosticAnswers` (working state, client-only) does. `finalizeResult` copies only structured fields across — the type system prevents raw-text leakage. A test enumerates result keys and asserts none is a free-text field.
- **`planSteps` is monotonic-ish**: given answers-so-far it returns the currently-known ordered steps; the component re-plans after each answer and advances to the next unanswered step. Conditional inserts: `flat_fork` iff `channelPick==='flat'`; `cant_tell` iff `channelPick==='cant_tell'`; `layer_check` iff `shouldOfferLayerCheck(intensity)`; `harm_relation` iff `detectIdentityHarm(blocker+story)`; `safety` iff `detectSafetyTrigger(blocker+story)`.
- **Classifier** (G8): ordered keyword scan, small documented lists, default `{shape:null, confidence:'low'}`; UI always shows an editable shape chip so a null/low result is harmless.
- **Crisis** is not a step — it's a persistent affordance rendered by `DiagnosticFlow`; intensity===10 also surfaces an inline prompt. Choosing it short-circuits to `onCrisis()`.
- **Aesthetic**: reuse SceneCard/SceneInput/SceneShortInput/SceneNav; chips styled like `ChargeCaptureForm` (border + bg per channel), Tailwind layout only, no hardcoded element hex (use existing chip class pattern / zinc + channel accents already present in that file's vocabulary).

## Verification here vs deferred

- Runs in this env: unit tests, `npm run check`, `next build` (page compiles).
- Cannot run here (no DATABASE_URL): the cert seed. It is authored to the established pattern and the npm script added; running it requires a DB (`npm run seed:cert:emotional-alchemy-diagnostic` after migrate deploy).

## Risks

- Classifier over-claiming → mitigated by conservative defaults + mandatory confirm chip; tests pin sample behavior, not general correctness.
- Step-planner edge cases → covered by explicit fork-combination tests.

## Out of scope

Composer/selection (target 3), persistence + threads + `recordDiagnostic` (target 5), resonance/card-banking (target 4 wiring), real crisis-resource content (G10).
