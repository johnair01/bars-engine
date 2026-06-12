# Plan: Applied Mode Intake Conversation

## Summary

Contract-first, engine-before-UI. Build the pure scripted intake state machine,
then the pure intake→encounter synthesis (with a completability proof), then the
conversation UI and routing, then the optional LLM enhancer. Nothing depends on a
language model to function. All work is under `mtgoa-game/`.

## Phase 1: Scripted intake state machine (pure)

### 1.1 Intake machine
**File**: `mtgoa-game/src/engine/intake/intakeMachine.ts` (new)
- `INTAKE_QUESTIONS: readonly string[]` — the six scripted prompts (distilled from `INTAKE_SYSTEM`).
- `IntakeState { step; answers; config }`, `IntakeAction = ANSWER | RESET`.
- `initIntake()`, `intakeReducer(state, action)`:
  - `ANSWER` appends to `answers`, increments `step`; on the sixth answer builds `IntakeConfig` via a private `mapAnswersToConfig(answers)`.
  - `RESET` → `initIntake()`.
- `mapAnswersToConfig`:
  - Q1 → `milestoneTitle` (first line/sentence) + `milestoneBody`.
  - Q2 → `targetChannel` via a keyword→Element matcher (`matchElement`), default `Wood`.
  - Q3 → retained for `startingStress` derivation (kept in config-adjacent helper; see 2.1).
  - Q4 → `stuckChannels`: scan for `COMPOUND_EMOTIONS` keys first (expand to pair), then single-element keywords; dedupe; default `["Water"]`.
  - Q5 → `epiphany` (raw answer).
  - Q6 → `forestSeeds`: split on sentence/line boundaries into a small array.

### 1.2 Element matcher
**File**: `mtgoa-game/src/engine/intake/matchElement.ts` (new)
- `matchElement(text): Element | null` and `matchStuckChannels(text): Element[]` — keyword/emotion lexicon over the five Wuxing emotions + `COMPOUND_EMOTIONS`. Pure, no AI. (This is the deterministic stand-in for the LLM's channel classification; the EA Translator backlog item can later supersede it.)

### 1.3 Tests
**File**: `mtgoa-game/src/engine/intake/__tests__/intakeMachine.test.ts` (new)
- Six answers → fully-populated `IntakeConfig`.
- Q4 "betrayal" → `["Water","Fire"]`; "shame" → `["Water","Metal"]`.
- Unknown Q4 → default `["Water"]`.
- `RESET` returns to step 0.

## Phase 2: Intake → encounter synthesis (pure, proven)

### 2.1 Builder
**File**: `mtgoa-game/src/engine/intake/buildEncounter.ts` (new)
- `buildEncounterFromIntake(config): EncounterConfig`.
- `needSequence`: dedupe `stuckChannels`; if length ≥ 2, expand to **paired** rhythm `[a,a,b,b,...]`; cap distinct needs at 3.
- `shadows`: one per stuck channel; `name`/`text` from `forestSeeds[i]` when present, else default copy; `channel` = stuck channel. Ensure ≥ 2 shadows so conversion threshold (2) is reachable — if only one stuck channel, emit 2 shadows on that channel.
- `deck`: `align` card per distinct stuck channel + the four standard domain cards (`Direct Action` `herOnly`). Reuse domain copy from the Priya exemplars.
- `capstone`: `{ title: milestoneTitle, body: milestoneBody }`.
- `startingStress`: map Q3 pressure → `2` default, clamp `< RULES.stress.ruptureAt`.
- `npcId: "applied-<slug>"`, `npcName`: derived or "Your Encounter"; `level: 1`.

### 2.2 Completability proof
**File**: `mtgoa-game/src/engine/intake/__tests__/intakeCompletability.sim.test.ts` (new)
- Import the smart + safe-floor policies (lift the shared policy/`run` helper out of `trust/__tests__` into a tiny test util, or re-declare locally to avoid touching shipped trust tests).
- Fixtures: intake configs with 1, 2 (compound), and 3 distinct stuck channels.
- Assert each generated `EncounterConfig`: smart policy → `win`; safe-floor → `win`; her-only domain locked pre-conversion; careful reader never exceeds starting stress.

## Phase 3: IntakeConversation UI + wiring (dual-track)

### 3.1 Screen
**File**: `mtgoa-game/src/screens/IntakeConversation.tsx` (new)
- `useReducer(intakeReducer, undefined, initIntake)`.
- Render: transcript of prior Q/A, current question (`INTAKE_QUESTIONS[state.step]` or AI-enhanced copy from 4.1), a textarea + Submit, and Restart.
- On `state.step === 6` (config ready): show a brief "Your encounter is ready" summary (capstone title, stuck channels, shadows) and a "Begin" button that calls `onComplete(buildEncounterFromIntake(state.config))`.
- Props: `{ onComplete(encounter: EncounterConfig): void; onExit(): void }`.

### 3.2 App routing
**File**: `mtgoa-game/src/App.tsx`
- Add Applied-Mode flow: when mode is Applied, render `IntakeConversation`; on complete, store the `EncounterConfig` in local state and render `TrustEncounterScreen encounter={generated}`.
- Add `#intake` hash for direct prototype access (alongside `#l1-priya`, `#boss-priya`).

### 3.3 ModeSelect un-gating
**File**: `mtgoa-game/src/screens/ModeSelect.tsx`
- Applied Mode always enabled. Replace the "Requires AI backend" disabled state with a subtitle: `aiEnabled()` ? "Enhanced conversation" : "Scripted intake". Keep Character Select unchanged.

## Phase 4: Optional LLM enhancer

### 4.1 Enhanced phrasing
**File**: `mtgoa-game/src/screens/IntakeConversation.tsx` (extend)
- If `aiEnabled()`, after each answer optionally call `intakeStep(history)` to fetch conversational phrasing for the *next* prompt and a reflection of the last answer; wrap in try/catch → on error use scripted copy. The scripted reducer still owns advancement and the final `IntakeConfig` (the LLM does not produce the config in this pass — keeps the dead-end guarantee). Document this boundary in a comment.

## File Summary

| Action | Path |
|--------|------|
| Create | `mtgoa-game/src/engine/intake/intakeMachine.ts` |
| Create | `mtgoa-game/src/engine/intake/matchElement.ts` |
| Create | `mtgoa-game/src/engine/intake/buildEncounter.ts` |
| Create | `mtgoa-game/src/engine/intake/__tests__/intakeMachine.test.ts` |
| Create | `mtgoa-game/src/engine/intake/__tests__/intakeCompletability.sim.test.ts` |
| Create | `mtgoa-game/src/screens/IntakeConversation.tsx` |
| Modify | `mtgoa-game/src/App.tsx` |
| Modify | `mtgoa-game/src/screens/ModeSelect.tsx` |
| Modify | `mtgoa-game/.env.example` (document VITE_AI_ENDPOINT as optional enhancer) |

## Verification

- `npx tsc --noEmit` clean (run in `mtgoa-game/`).
- `npx vitest run` — all green, including the two new intake test files.
- `npx vite build` succeeds.
- Manual: `#intake` walkthrough with AI off, then on (the in-app Verification Quest).
- Root repo unaffected (`mtgoa-game` is excluded from the Next.js tsconfig).

## Notes / risks

- **Shared sim harness**: the smart/safe-floor policies live in `trust/__tests__`. To reuse without importing across test files, extract them to `engine/trust/simPolicies.ts` (non-test module) OR copy the ~30 lines into the new test. Prefer extraction (one small refactor, both suites import it) — flag in tasks.
- **Element matcher quality** is intentionally simple (keyword lexicon). The EA Translator backlog item (2.05 EAT) is the future upgrade path; this spec does not block on it.
