# Plan: Allyship Deck Literacy

Five independently-shippable phases. Deterministic-first; AI additive. Each phase
ends with its build gate; P2/P3 require regenerating **and committing**
`public/allyship-deck/allyship-deck.json`.

## Phase 1 — Glossary + inline deep links  ✅ (this slice)
- **New** `src/lib/allyship-deck/glossary.ts` (pure): `GlossaryTerm`, `GLOSSARY`, `*TermId` helpers, `glossaryHref`, `CATEGORY_ORDER/LABELS`, `getGlossaryTerm`. Copy derived from `MOVES/OPERATIONS/DOMAINS/CAPABILITIES`; authored set = output BARs, transcend/translate/neutralize, altitude, stage, charge, BAR, capability.
- **New** `src/app/deck/glossary/page.tsx` (ungated reference; mirrors `preview/page.tsx`).
- **New** `src/components/deck/GlossaryReader.tsx` (`'use client'`, deck aesthetic; hash-scroll + highlight + category nav; related cross-links).
- **Modify** `src/components/deck/AllyshipCard.tsx` (`variant="full"` only): link move pip column, face badge column, domain label, output-BAR foot via `glossaryHref`.
- Gate: `npm run build` + `npm run check` (no `deck:assemble`).

## Phase 2 — "Your move" surfacing
- **Modify** `src/lib/allyship-deck/types.ts`: `action?: string` on `MoveCard`.
- **Modify** `src/lib/allyship-deck/assemble.ts`: `action: sub.action` in `buildMoveCards()` generated object (AUTHORED overrides via spread).
- **Modify** `src/components/deck/AllyshipCard.tsx`: distinct "Your move · Do this" inset near the practice well.
- **Modify** `src/lib/allyship-deck/seed.ts`: fold `card.action` into BAR description (guarded), both branches.
- Gate: `npm run deck:assemble` (commit JSON) → build → check; update seed tests.

## Phase 3 — Applications (authored baseline)
- **Modify** `types.ts`: `applications?: { context: string; example: string }[]`.
- **Modify** `move-library.ts`: add `applications` to selected `AUTHORED` entries (start with `OPEN-GR-*`, `WAKE-GR-*`).
- **New** `src/components/deck/CardApplications.tsx`: collapsible "How this shows up in real life" + deterministic fallback.
- **Modify** `AllyshipCard.tsx`: render `<CardApplications card subject />` in full view.
- Gate: `npm run deck:assemble` (commit JSON) → build → check.

## Phase 4 — Applications (optional AI)
- **New** `src/actions/deck-applications.ts`: `applyCardToSituation` (contract in spec). Reuse `getMoveCardById`, `generateObjectWithCache`, `getOpenAI`; flags `OPENAI_API_KEY` / `DECK_AI_APPLICATIONS_ENABLED` / `DECK_AI_APPLICATIONS_MODEL`.
- **Modify** `CardApplications.tsx`: opt-in situation input; AI items above authored baseline, badged; degrade on error/off.
- **Modify** `docs/ENV_AND_VERCEL.md`: document the three env vars.
- Gate: build → check.

## Phase 5 — Orientation
- **New** `src/components/deck/DeckOrientation.tsx`: modal (reuse detail-overlay pattern) teaching single/spread/find-your-path/browse, each routing via `switchView`.
- **Modify** `src/components/deck/AllyshipDeckReader.tsx`: open once via `deck-orientation-seen` (reuse `deck-reminder-enabled` pattern); top-bar "How to use" re-open button.
- Gate: build → check.

## Cross-cutting
- Verification quest `cert-allyship-deck-literacy-v1` grows one step per phase (see spec).
- `.specify/backlog/BACKLOG.md` row added (ID `ADL`); run `npm run backlog:seed` once DB is reachable.

## Risks
- Forgetting to regen+commit the deck JSON (P2/P3) → changes invisible. Explicit task each phase.
- Anchor/id drift → links 404 in-page. Mitigated by shared `*TermId` helpers; cert step 1 guards it.
- AI must stay opt-in + degrade to authored (Portland AI-allergy); AI content always badged.
- Only link terms in `variant="full"` (`<article>`); never the grid `<button>`.
