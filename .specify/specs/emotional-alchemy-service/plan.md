# Plan: Emotional Alchemy as a Service (design — build later)

## Architecture at a glance

```
        ┌── /capture (channel, altitude, intensity, barId) ─┐
        ├── /emotional-first-aid (vibeTag) ─────────────────┤
 caller ┼── quest / roadblock (blocker) ────────────────────┼──▶ AlchemySeed
        ├── deck (drawnCardId) ─────────────────────────────┤        │
        └── daemon (threadLabel) ───────────────────────────┘        │
                                                                     ▼
                              seedToAnswers(seed) ──▶ DiagnosticFlow (skips seeded steps)
                                                                     │
                                                                     ▼
                                     draw card ──▶ recommendPractice ──▶ PracticeCard
                                                                     │
                                             (barId present) ────────▼
                                             logAlchemySession() ──▶ AlchemySession ──▶ CustomBar.sourceAlchemySessionId
                                                              (extends BARs logging, like Shadow321Session)
```

The engine (`src/lib/emotional-alchemy/`) is unchanged. Two new seams: **service.ts** (pure invocation/seed) and **alchemy-session.ts** (server action + Prisma). Existing components gain a `seed`/`returnTo` prop.

## Phases (each independently shippable; API-first order)

**Phase 0 — contract (no UI).** `service.ts` (`AlchemySeed`, `seedToAnswers`, `seedFromVibeTag`, `alchemyHref`, `seedFromParams`) + pure tests. Nothing wired yet. *This is the deft "define the seam first" step.*

**Phase 1 — capture trigger + BARs logging (the chosen first build).**
- `DiagnoseClient` accepts `seed` + `returnTo`; route reads `seedFromParams`.
- `/capture` post-capture ceremony gains **"Metabolize it now →"** → `alchemyHref({source:'capture', barId, channel, altitude, intensity})`.
- `alchemy-session.ts` + `AlchemySession` model + migration + `CustomBar.sourceAlchemySessionId`.
- On Show Up choice / re-rate, `logAlchemySession({chargeSourceBarId: barId, ...})`. Vault shows the charge's practice history.
- Verification quest `cert-emotional-alchemy-service-v1`.

**Phase 2 — Emotional First Aid.** `/emotional-first-aid` routes Vibes tags via `seedFromVibeTag` → the service; its recommendation becomes composer-driven. Begin retiring `recommendFirstAidToolKey`.

**Phase 3 — quest / roadblock.** A "metabolize this blocker" affordance on stuck quests/spokes, seeded with the blocker + `returnTo` the quest.

**Phase 4 — consolidation (G4).** One tool registry backs capture, EFA, and the deck; retire the ad-hoc recommenders. Ties to `.specify/specs/emotional-alchemy-tool-registry/` (the EA registry) + the technique-library/EFA reconciliation.

## Key decisions

- **Intensity scale**: capture is 1–5, the vector is 0–10. Normalize on seed ingest (`~ (n-1)/4*10`, rounded); longer-term move capture to 0–10 for parity. Documented, not silently lossy.
- **Privacy (§1.6) is preserved through the service**: the seed carries `barId` (a reference), not raw text; `AlchemySession` has no text columns; the raw blocker/story stay in client state. The BAR itself already stores the player's summary — the *session* logs only structured fields + the link.
- **Provenance mirrors 321**: `AlchemySession.chargeSourceBarId` + `CustomBar.sourceAlchemySessionId`, so the vault/lineage tooling that already understands 321 sessions understands alchemy sessions for free.
- **Inline vs route**: Phase 1 uses the route (`alchemyHref`, cheapest, 321-precedented). An inline sheet (`<EmotionalAlchemyEntry seed>`) is a later nicety, same seed contract.

## Risks / notes
- Migration needs a real DB (not runnable in this sandbox) — Phase 1 carries the `prisma migrate dev` + commit-SQL task per the migration-discipline skill.
- EFA overlap: Phase 2 must keep the existing EFA vibeulon-mint behavior (`FIRST_AID_MINT_*`) while swapping the recommender underneath.

## Out of scope (this design pass)
All code. This pass produces spec + plan + tasks only.
