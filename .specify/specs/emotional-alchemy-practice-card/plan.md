# Plan: Emotional Alchemy Practice Card

## Strategy
Presentational render over the already-tested composer. Add the interim submove seam (player picks the WAVE move, canonical stance question), render a `CultivationCard`, and close the loop with a client-only re-rate. DB-free.

## File impacts
| File | Action | Content |
|---|---|---|
| `src/lib/emotional-alchemy/interim-card.ts` | create | `SUBMOVE_META`, `interimComposerCard` |
| `src/lib/emotional-alchemy/index.ts` | edit | `export * from './interim-card'` |
| `src/lib/emotional-alchemy/__tests__/interim-card.test.ts` | create | pure test |
| `vitest.config.ts` | edit | add test |
| `src/components/practice/PracticeCard.tsx` | create | CultivationCard render of a PracticeRecommendation |
| `src/app/practice/diagnose/DiagnoseClient.tsx` | edit | `forming` + `practice` states; compose + route |
| `scripts/seed-cert-emotional-alchemy-practice-card.ts` | create | verification quest seed |
| `package.json` | edit | `seed:cert:emotional-alchemy-practice-card` |

## Key notes
- Element = `EMOTION_TO_ELEMENT[channel]`; altitude = `vector.altitude`; stage `growing`. Tool name/genericName via `getToolById(rec.primaryToolId)`; prepend name via `getToolById('T07')`.
- Covenant: element color from `ELEMENT_TOKENS[element].{bg,textAccent,gem,border}` (Pattern A) + CultivationCard's injected frame/glow. No hex in the component. Spirit step (last protocol entry) gets the element gem bullet — the one element flourish inside the content.
- Re-rate: `delta = intensityBefore − after`; ≥2 moved, −1..1 flat, ≤−2 worse (ground + different tool). Client state only; copy states nothing is saved.
- Crisis/capture recommendation kinds routed by DiagnoseClient to the existing end states (defensive — the diagnostic already handles them upstream).

## Verification
Pure test + tsc + lint + `next build` + dev-server 200/marker smoke (browser drag-through not runnable in-sandbox). Cert seed authored; needs a DB to run.

## Out of scope
Allyship-Deck draw (G13), Show Up persistence + session log + re-rate persistence (target 5), AI tailoring.
