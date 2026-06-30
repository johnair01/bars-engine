# Tasks: Allyship Deck Literacy

## Phase 1 — Glossary + inline deep links
- [x] **T1.1** New `src/lib/allyship-deck/glossary.ts` (pure): `GLOSSARY`, `GlossaryTerm`, `*TermId` helpers, `glossaryHref`, `CATEGORY_ORDER/LABELS`, `getGlossaryTerm`.
- [x] **T1.2** New `src/app/deck/glossary/page.tsx` (ungated; renders `GlossaryReader`).
- [x] **T1.3** New `src/components/deck/GlossaryReader.tsx` (deck aesthetic; hash-scroll + highlight + category nav + related links).
- [x] **T1.4** Modify `src/components/deck/AllyshipCard.tsx` `variant="full"`: link move pip, face badge, domain, output-BAR to glossary.
- [x] **T1.5** Gate: `npm run build` + `npm run check` (lint + tsc verified for P1 files in offline env).

## Phase 2 — "Your move" surfacing
- [x] **T2.1** `types.ts`: add `action?: string` to `MoveCard`.
- [x] **T2.2** `assemble.ts`: set `action: sub.action` in `buildMoveCards()` generated object.
- [x] **T2.3** `AllyshipCard.tsx`: distinct "Your move" inset (full view).
- [x] **T2.4** `seed.ts`: lead BAR description with `card.action` (guarded), both branches; updated seed.test.ts (translate.test.ts fixture has no action — unaffected).
- [x] **T2.5** Gate: `npm run deck:assemble` → committed JSON → eslint clean + tsc baseline + node tests pass (full build/check runs in CI — Prisma engine blocked offline).

## Phase 3 — Applications (authored baseline)
- [ ] **T3.1** `types.ts`: add `applications?: { context: string; example: string }[]`.
- [ ] **T3.2** `move-library.ts`: add `applications` to selected `AUTHORED` entries (`OPEN-GR-*`, `WAKE-GR-*` first).
- [ ] **T3.3** New `src/components/deck/CardApplications.tsx`: collapsible + deterministic fallback.
- [ ] **T3.4** `AllyshipCard.tsx`: render `<CardApplications card subject />` in full view.
- [ ] **T3.5** Gate: `npm run deck:assemble` → **commit JSON** → build → check.

## Phase 4 — Applications (optional AI)
- [ ] **T4.1** New `src/actions/deck-applications.ts`: `applyCardToSituation` (cached, flagged, degrades).
- [ ] **T4.2** `CardApplications.tsx`: opt-in situation input; AI items badged above baseline.
- [ ] **T4.3** `docs/ENV_AND_VERCEL.md`: document `OPENAI_API_KEY`, `DECK_AI_APPLICATIONS_MODEL`, `DECK_AI_APPLICATIONS_ENABLED`.
- [ ] **T4.4** Gate: build → check.

## Phase 5 — Orientation
- [ ] **T5.1** New `src/components/deck/DeckOrientation.tsx`: four-use modal routing via `switchView`.
- [ ] **T5.2** `AllyshipDeckReader.tsx`: open once via `deck-orientation-seen`; top-bar "How to use" re-open button.
- [ ] **T5.3** Gate: build → check.

## Cross-cutting
- [ ] **TX.1** `scripts/seed-cert-allyship-deck-literacy.ts` + `npm run seed:cert:allyship-deck-literacy` (grow one step per phase).
- [x] **TX.2** `.specify/backlog/BACKLOG.md` row added (ID `ADL`).
- [ ] **TX.3** `npm run backlog:seed` once DB reachable (not run in offline env).
- [ ] **TX.4** Each phase: `npm run build` + `npm run check` green before merge.
