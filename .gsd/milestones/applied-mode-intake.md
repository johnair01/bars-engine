# GSD Milestone — Applied Mode Intake → Trust Encounter

> **Pilot run** for `.specify/specs/opengsd-workflow-migration` **FR2.2**: deliver
> one existing `.specify/` kit end-to-end through the GSD loop
> (plan → implement → verify → ship).
>
> **Runtime note:** the external `@opengsd/gsd-pi` CLI could not drive itself in
> the web/remote sandbox (no third-party LLM provider key; interactive
> `@clack/prompts` installer needs a TTY; GSD Browser needs a Chromium that isn't
> provisioned — matching the spec's Environment Spike). So this milestone was
> **driven through the GSD loop by hand** (the session agent as Pi). The trace
> below is the legible artifact ("the game creates the game").

Source kit: `.specify/specs/applied-mode-intake-conversation/`

## Slices

### Slice 1 — Hidden-card engine capability (additive, lowest risk)
- [x] `TrustCard.hidden?: boolean` (`engine/trust/trustTypes.ts`)
- [x] `visibleHand(state)` + PLAY guard so hidden cards stay out of hand until
      `converted` (`engine/trust/trustEngine.ts`) — win condition unchanged
- [x] Existing Level-1 / Boss Priya sim suites stay green (hidden is opt-in)

### Slice 2 — Shared sim harness (compost duplication)
- [x] Extract `run` + `smartPolicy` + `safeFloorPolicy` → `engine/trust/simPolicies.ts`
- [x] Re-point both Priya sim tests at the shared module (no behaviour change)

### Slice 3 — Intake synthesis (pure, proven)
- [x] `engine/intake/buildEncounter.ts` — `buildEncounterFromIntake(config)`:
      paired needs (cap 3), ≥2 shadows, align-per-need + four domains
      (Direct Action her-only), one hidden epiphany card, milestone capstone
- [x] `engine/intake/intakeMachine.ts` — scripted Six-Question machine (no AI),
      compound-emotion expansion (Betrayal/Shame), `finalizeIntake → IntakeConfig`
- [x] `__tests__/buildEncounter.test.ts` — structural guarantees (14 cases)
- [x] `__tests__/intakeCompletability.sim.test.ts` — 1 / 2-compound / 3-channel
      fixtures: smart win, safe-floor win, no forced rupture, her-only locked,
      epiphany hidden→revealed and **not required to win** (18 cases)

### Slice 4 — Wire-up + UI
- [x] `screens/IntakeConversation.tsx` — scripted intake conversation
- [x] `App.tsx` — Applied Mode routes intake → synthesized trust encounter
      (superpower select skipped)
- [x] `screens/ModeSelect.tsx` — Applied Mode un-gated (AI = "enhanced", not gate)
- [x] `screens/TrustEncounterScreen.tsx` — `visibleHand` + epiphany reveal at conversion

## Verification evidence (deterministic, this run)
- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors (warnings pre-existing)
- `npm run build` → ✓ built (69 modules)
- `npm test` → **52 passed** (6 files), incl. all three intake fixtures winnable
  under smart **and** safe-floor policy; Priya suites unchanged.

## Not done (out of this slice, per spec NFRs)
- GSD Browser visual verification (FR1.x) — blocked on Chromium provisioning.
- Optional LLM intake enhancer (`api/intake.ts` contract untouched).
