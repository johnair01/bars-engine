# Tasks: Applied Mode Intake Conversation

> Status legend: `[ ]` todo · `[x]` done. All paths under `mtgoa-game/`.
>
> **Implemented 2026-06-12** via the GSD-by-hand pilot — trace at
> `.gsd/milestones/applied-mode-intake.md`. **Divergence (intentional):** Q2/Q4
> use **structured selection** (pick a target-state channel; pick felt-words that
> map to channels, compound emotions included) instead of a free-text
> `matchElement` keyword lexicon. Structured selection is deterministic and
> avoids brittle keyword matching while staying no-AI — so `matchElement.ts` was
> **not** built; the mapping lives in `intakeMachine.ts` (`feelingsToChannels`).

## Phase 1: Scripted intake state machine (pure)

- [~] ~~`src/engine/intake/matchElement.ts`~~ — **superseded** by structured
      selection (`FEELINGS`/`TARGET_CHANNELS` + `feelingsToChannels` in
      `intakeMachine.ts`); no free-text lexicon needed.
- [x] Create `src/engine/intake/intakeMachine.ts` — `INTAKE_STEPS`, `IntakeAnswers`, `emptyAnswers`, `feelingsToChannels`, `canFinalize`, `finalizeIntake` (the structured-selection equivalent of the planned reducer + `mapAnswersToConfig`).
- [x] Create `src/engine/intake/__tests__/buildEncounter.test.ts` — covers the machine mapping: compound Q4 (betrayal→Water+Fire, shame→Water+Metal), `canFinalize`, and `finalizeIntake` → `IntakeConfig` (plus all `buildEncounter` structure cases).

## Phase 2: Intake → encounter synthesis (pure, proven)

- [x] Add `hidden?: boolean` to `TrustCard` in `src/engine/trust/trustTypes.ts`; in `trustEngine.ts` hide such cards from the playable hand until `converted` (`visibleHand` + PLAY guard), reveal after. Existing `level1`/`boss` sim suites stay green.
- [x] Surface the revealed hidden card (epiphany text) at conversion in `src/screens/TrustEncounterScreen.tsx`.
- [x] Extract smart/safe-floor policies + `run` helper into `src/engine/trust/simPolicies.ts`; both `trust/__tests__/*.sim.test.ts` import them (no behavior change).
- [x] Create `src/engine/intake/buildEncounter.ts` — `buildEncounterFromIntake(config)` per synthesis rules (paired needs cap 3, ≥2 shadows, align+domain deck, hidden `ac-epiphany` card, capstone, clamped stress).
- [x] Create `src/engine/intake/__tests__/intakeCompletability.sim.test.ts` — 1 / 2-compound / 3 stuck-channel fixtures; smart win, safe-floor win, her-only locked pre-conversion, no forced stress, hidden epiphany card absent pre-conversion / present post-conversion / not required to win.

## Phase 3: IntakeConversation UI + wiring (dual-track)

- [x] Create `src/screens/IntakeConversation.tsx` — six-step walk (progress rail + per-step input: text / channel-pick / feeling-multiselect), optional "who is this about?", `Build my encounter`; props `onComplete(IntakeConfig, npcName)`, `onExit()`.
- [x] Modify `src/App.tsx` — Applied Mode → `IntakeConversation` → `TrustEncounterScreen` with the synthesized config (superpower select skipped). *(Routed off `state.mode === "applied"`; the existing `#l1-priya`/`#boss-priya` prototype hashes remain.)*
- [x] Modify `src/screens/ModeSelect.tsx` — Applied Mode always enabled; note "AI backend connected — enhanced" vs "Runs fully scripted — no AI required".

## Phase 4: Optional LLM enhancer (deferred)

- [ ] Extend `src/screens/IntakeConversation.tsx` — when `aiEnabled()`, fetch conversational phrasing via `intakeStep()` with try/catch → scripted fallback; the machine still owns advancement + final config. *(Deferred: scripted path is first-class; `api/intake.ts` contract left untouched.)*
- [ ] Modify `.env.example` — document `VITE_AI_ENDPOINT` as the optional intake enhancer. *(Deferred with Phase 4.)*

## Verification

- [x] `npm run typecheck` clean (in `mtgoa-game/`).
- [x] `npm test` green incl. both new intake suites (52 passed / 6 files).
- [x] `npm run build` succeeds.
- [ ] Manual UI walkthrough — pending live play (no Chromium in the web sandbox for an automated screenshot; logic proven by the completability sims).
- [ ] In-app Verification Quest `cert-applied-mode-intake-v1` steps pass (documented; no DB seed for the Vite app).

## Out of scope (follow-ups)

- [ ] LLM-authored config (model produces `IntakeConfig` directly) — deferred; keeps the dead-end guarantee for now.
- [ ] EA Translator (2.05 EAT) upgrade of `matchElement` to a real felt-sense classifier.
- [ ] Persisting authored encounters / sharing them.
