# Tasks: Emotional Alchemy as a Service

> Phase 0 BUILT (pure seed contract, DB-free). Phases 1–4 pending.

## Phase 0 — contract (no UI, DB-free)
- [x] `src/lib/emotional-alchemy/service.ts`: `AlchemySeed`, `seedToAnswers`, `seedFromVibeTag`, `alchemyHref`, `seedFromParams`
- [x] `__tests__/service.test.ts`: seed→answers skips seeded steps; vibe-tag map; href round-trips seedFromParams; intensity 1–5→0–10 normalize
- [x] export from index; add test to `vitest.config.ts`

## Phase 1 — capture trigger + BARs logging
- [ ] `DiagnoseClient` + `/practice/diagnose/page.tsx`: accept `seed` (via `seedFromParams`) + `returnTo`; prefill DiagnosticFlow
- [ ] Prisma: `AlchemySession` model + `CustomBar.sourceAlchemySessionId`; `npx prisma migrate dev --name add_alchemy_session`; commit migration SQL; `npm run db:sync`; `npm run db:record-schema-hash`
- [ ] `src/actions/alchemy-session.ts`: `logAlchemySession` (`'use server'`, structured-only, §1.6)
- [ ] Wire logging on Show Up choice / re-rate when `barId` present; set `CustomBar.sourceAlchemySessionId`
- [ ] `/capture` post-capture ceremony: "Metabolize it now →" → `alchemyHref(...)`
- [ ] Vault: show a charge's alchemy-session history (reuse 321-session vault pattern)
- [ ] Verification quest `cert-emotional-alchemy-service-v1` + seed script + npm script
- [ ] `npm run check` + vitest green; migration applied on a real DB; cert seed run

## Phase 2 — Emotional First Aid
- [ ] Route `/emotional-first-aid` Vibes tags via `seedFromVibeTag` into the service
- [ ] EFA recommendation becomes composer-driven; keep vibeulon-mint behavior
- [ ] Begin retiring `recommendFirstAidToolKey`

## Phase 3 — quest / roadblock
- [ ] "Metabolize this blocker" affordance on stuck quests/spokes; seed blocker + `returnTo`

## Phase 4 — consolidation (G4)
- [ ] One tool registry backs capture/EFA/deck; retire ad-hoc recommenders; reconcile technique-library + EFA per the registry spec
