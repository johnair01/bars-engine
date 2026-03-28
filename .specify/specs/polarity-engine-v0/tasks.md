# Tasks — Polarity Engine v0

- [ ] **T1** Add `src/lib/polarity-engine/types.ts` + `emotion-questions.ts` + tests for element → question map.
- [ ] **T2** Implement deterministic `extractPoles` (or stub poles with clear TODO) + `SpinState` helpers.
- [ ] **T3** Define JSON persistence shape for charge/polarity on `CustomBar` (document in spec § Design Decisions); implement read/write helpers.
- [ ] **T4** If schema change: `npx prisma migrate dev --name polarity_engine_bar_payload` + commit migration; `npm run db:sync`.
- [ ] **T5** Server actions: `chargeBar`, `polarizeBar`, `resolveDirection` with BAR ownership checks.
- [ ] **T6** `generateQuestFromPolarity` adapter → quest-grammar / compile path; one golden test fixture.
- [ ] **T7** Minimal UI: charge + question + poles + confirm on one BAR-facing surface (or storybook stub + integration later).
- [ ] **T8** Verification quest `cert-polarity-engine-v1` + seed script reference ([cyoa-certification-quests](../cyoa-certification-quests/spec.md)).
- [ ] **T9** `npm run check`; `npm run build` on touched paths.
