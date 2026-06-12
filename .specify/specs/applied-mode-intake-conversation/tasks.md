# Tasks: Applied Mode Intake Conversation

> Status legend: `[ ]` todo · `[x]` done. All paths under `mtgoa-game/`.

## Phase 1: Scripted intake state machine (pure)

- [ ] Create `src/engine/intake/matchElement.ts` — `matchElement(text)` + `matchStuckChannels(text)` keyword/emotion lexicon (five Wuxing emotions + `COMPOUND_EMOTIONS`).
- [ ] Create `src/engine/intake/intakeMachine.ts` — `INTAKE_QUESTIONS`, `IntakeState`, `IntakeAction`, `initIntake`, `intakeReducer`, private `mapAnswersToConfig`.
- [ ] Create `src/engine/intake/__tests__/intakeMachine.test.ts` — full config from six answers; compound Q4 (betrayal→Water+Fire, shame→Water+Metal); unknown→default; `RESET`.

## Phase 2: Intake → encounter synthesis (pure, proven)

- [ ] Add `hidden?: boolean` to `TrustCard` in `src/engine/trust/trustTypes.ts`; in `trustEngine.ts` hide such cards from the playable hand until `converted`, reveal after. Confirm existing `level1`/`boss` sim suites stay green.
- [ ] Surface the revealed hidden card (epiphany text) at conversion in `src/screens/TrustEncounterScreen.tsx`.
- [ ] Extract smart/safe-floor policies + `run` helper into `src/engine/trust/simPolicies.ts`; update `trust/__tests__/*.sim.test.ts` to import them (no behavior change).
- [ ] Create `src/engine/intake/buildEncounter.ts` — `buildEncounterFromIntake(config)` per synthesis rules (paired needs cap 3, ≥2 shadows, align+domain deck, hidden `align-epiphany` card, capstone, clamped stress).
- [ ] Create `src/engine/intake/__tests__/intakeCompletability.sim.test.ts` — 1 / 2-compound / 3 stuck-channel fixtures; smart win, safe-floor win, her-only locked pre-conversion, no forced stress, hidden epiphany card absent pre-conversion / present post-conversion / not required to win.

## Phase 3: IntakeConversation UI + wiring (dual-track)

- [ ] Create `src/screens/IntakeConversation.tsx` — transcript + current question + textarea/submit + restart; ready-state summary + Begin; props `onComplete(EncounterConfig)`, `onExit()`.
- [ ] Modify `src/App.tsx` — Applied Mode → `IntakeConversation` → `TrustEncounterScreen` with generated config; add `#intake` hash route.
- [ ] Modify `src/screens/ModeSelect.tsx` — Applied Mode always enabled; subtitle "Enhanced conversation" (AI on) vs "Scripted intake" (AI off).

## Phase 4: Optional LLM enhancer

- [ ] Extend `src/screens/IntakeConversation.tsx` — when `aiEnabled()`, fetch conversational phrasing via `intakeStep()` with try/catch → scripted fallback; reducer still owns advancement + final config. Comment the boundary.
- [ ] Modify `.env.example` — document `VITE_AI_ENDPOINT` as the optional intake enhancer.

## Verification

- [ ] `npx tsc --noEmit` clean (in `mtgoa-game/`).
- [ ] `npx vitest run` green incl. both new intake suites.
- [ ] `npx vite build` succeeds.
- [ ] Manual `#intake` walkthrough: AI off (scripted) then AI on (enhanced) — both reach a winnable encounter; capstone = Q1, shadows reflect Q4/Q6.
- [ ] In-app Verification Quest `cert-applied-mode-intake-v1` steps pass (documented; no DB seed for the Vite app).

## Out of scope (follow-ups)

- [ ] LLM-authored config (model produces `IntakeConfig` directly) — deferred; keeps the dead-end guarantee for now.
- [ ] EA Translator (2.05 EAT) upgrade of `matchElement` to a real felt-sense classifier.
- [ ] Persisting authored encounters / sharing them.
