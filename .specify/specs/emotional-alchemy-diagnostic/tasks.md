# Tasks: Emotional Alchemy Charge Diagnostic

- [x] T1 — Create `src/lib/emotional-alchemy/vector.ts` (types, defaults, flat fork, classifier, fork predicates, `planSteps`, `finalizeResult`) per spec § API Contracts
- [x] T2 — `export * from './vector'` in `src/lib/emotional-alchemy/index.ts`
- [x] T3 — Create `src/lib/emotional-alchemy/__tests__/vector.test.ts` (FR11)
- [x] T4 — Add test file to `vitest.config.ts`
- [x] T5 — `npx vitest run src/lib/emotional-alchemy/__tests__/vector.test.ts` — green
- [x] T6 — Create `DiagnosticSummary.tsx` + `DiagnosticFlow.tsx` (SceneCard-based; crisis + capture-only affordances)
- [x] T7 — Create `/practice/diagnose` page + `DiagnoseClient.tsx`
- [x] T8 — Create `scripts/seed-cert-emotional-alchemy-diagnostic.ts` + `package.json` npm script (authored; DB needed to run)
- [x] T9 — `npm run check` — green (fail-fix)
- [x] T10 — `npx next build` (or lint+tsc) confirms the route compiles
- [x] T11 — Commit spec kit + implementation; push to feature branch
