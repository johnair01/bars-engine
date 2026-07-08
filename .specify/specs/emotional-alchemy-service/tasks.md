# Tasks: Emotional Alchemy as a Service

> Phase 0 BUILT (pure seed contract, DB-free). Phases 1–4 pending.

## Phase 0 — contract (no UI, DB-free)
- [x] `src/lib/emotional-alchemy/service.ts`: `AlchemySeed`, `seedToAnswers`, `seedFromVibeTag`, `alchemyHref`, `seedFromParams`
- [x] `__tests__/service.test.ts`: seed→answers skips seeded steps; vibe-tag map; href round-trips seedFromParams; intensity 1–5→0–10 normalize
- [x] export from index; add test to `vitest.config.ts`

## Phase 1 — capture trigger + BARs logging  ⚠ STAGED (code committed; migration NOT applied)

> **Pickup (Codex, needs a DB)**: run `npx prisma migrate dev --name add_alchemy_session`
> against a real DATABASE_URL to generate + apply the migration for the `AlchemySession`
> model + `CustomBar.sourceAlchemySessionId` (both already in `schema.prisma`), then
> `npm run db:record-schema-hash`, `npm run seed:cert:emotional-alchemy-service`, and drive
> the cert. **CI is red until the migration exists** (schema ↔ migrations drift). The app
> code compiles (`prisma generate` from the committed schema) and 94 unit tests pass.

- [x] `DiagnoseClient` + `/practice/diagnose/page.tsx`: accept `seed` (via `seedFromParams`) + `returnTo`; prefill DiagnosticFlow (skips seeded steps)
- [x] Prisma **schema**: `AlchemySession` model + `CustomBar.sourceAlchemySessionId` + `Player.alchemySessions` — **migration still to be generated/applied on a DB**
- [x] `src/actions/alchemy-session.ts`: `logAlchemySession` + `getAlchemySessionsForBar` (`'use server'`, structured-only, §1.6)
- [x] Wire logging: PracticeCard "Log this rep →" (after Show Up + re-rate) → `logAlchemySession`; sets `CustomBar.sourceAlchemySessionId` when `barId` present
- [x] `/capture`: "Metabolize it now →" per captured charge → `alchemyHref(seedFromCapture(...))` (no raw text on the URL)
- [ ] Vault: show a charge's alchemy-session history (`getAlchemySessionsForBar` ready; UI wiring remaining)
- [x] Verification quest `cert-emotional-alchemy-service-v1` + seed script + npm script
- [ ] **Codex**: `prisma migrate dev`; `npm run check` green; cert seed run; drive the flow on a DB

## Phase 2 — Emotional First Aid
- [ ] Route `/emotional-first-aid` Vibes tags via `seedFromVibeTag` into the service
- [ ] EFA recommendation becomes composer-driven; keep vibeulon-mint behavior
- [ ] Begin retiring `recommendFirstAidToolKey`

## Phase 3 — quest / roadblock
- [ ] "Metabolize this blocker" affordance on stuck quests/spokes; seed blocker + `returnTo`

## Phase 4 — consolidation (G4)
- [ ] One tool registry backs capture/EFA/deck; retire ad-hoc recommenders; reconcile technique-library + EFA per the registry spec
