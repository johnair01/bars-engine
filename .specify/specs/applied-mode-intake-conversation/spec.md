# Spec: Applied Mode Intake Conversation

## Purpose

Applied Mode lets a player author their *own* encounter by talking through the
**Six Unpacking Questions** instead of picking a pre-built NPC. This spec builds
the missing piece (Migration Brief priority #8): a **scripted-first, dual-track**
`IntakeConversation` that walks the six questions, produces an `IntakeConfig`, and
synthesizes a **provably-completable trust/attune encounter** from it — playable
through the `TrustEncounterScreen` we already parameterized.

**Problem**: `mtgoa-game/src/api/intake.ts` defines the contract (`INTAKE_SYSTEM`,
`IntakeConfig`, `intakeStep()`) but there is no UI, no wiring, and no AI backend
(`intakeStep` POSTs to an empty `VITE_AI_ENDPOINT`). Applied Mode is therefore
unreachable, and the only place an intake could currently route — the legacy
channel-combat NPC pipeline — is proven unwinnable (`0/6`, see
`engine/__tests__/completability.sim.test.ts`).

**Practice**: Deftness Development — spec kit first, contract before UI,
**deterministic over AI**. The intake works with no language model; the LLM is an
optional enhancer, never a dependency.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Mechanism** | **Scripted-first / dual-track.** A pure `intakeReducer` state machine drives the six questions deterministically and emits an `IntakeConfig`. No LLM required to complete Applied Mode. |
| **LLM role** | **Optional enhancer only.** When `aiEnabled()`, the existing `intakeStep()` may rephrase prompts / reflect answers back conversationally; on absence or failure it falls back to the scripted copy. Output contract (`IntakeConfig`) is identical either way. |
| **Target engine** | **The trust/attune engine** (`engine/trust`), NOT the legacy channel engine. Intake synthesizes an `EncounterConfig`, so generated encounters are completable by construction. *(Decision to ratify — see Open Questions.)* |
| **Reuse the screen** | Route the synthesized `EncounterConfig` straight into the existing `TrustEncounterScreen` (already accepts an `encounter` prop after the Boss Priya work). No new play UI. |
| **Synthesis is pure + proven** | `buildEncounterFromIntake(config): EncounterConfig` is a pure function with a **completability sim test** proving *any* intake output yields a winnable encounter (smart + safe-floor policies), reusing the trust sim harness. |
| **Dual-track gating** | Because intake no longer needs AI, **un-gate Applied Mode** in `ModeSelect` (today it's disabled unless `aiEnabled()`). Relabel the AI state as "enhanced" vs "scripted," not enabled vs disabled. |
| **Phase placement** | Applied Mode: `mode-select → intake → (trust) encounter`. Superpower select is skipped in Applied Mode (the player authors the encounter, not a roster pick). *(Confirm — see Open Questions.)* |
| **Compound emotions** | Q4 maps to `stuckChannels[]`, surfacing `COMPOUND_EMOTIONS` (Betrayal = Water+Fire, Shame = Water+Metal) so a single felt word can yield two stuck channels → two shadow channels. |

## Conceptual Model

**WHO**: the player (authoring) + the synthesized NPC (the encounter they author).
**WHAT**: six answers → an `IntakeConfig` → a completable trust `EncounterConfig`.
**WHERE**: Applied Mode, between mode select and the encounter screen.
**Energy**: the player's own felt material is the fuel (composting, per the ethos).

```
ModeSelect ── Applied ──▶ IntakeConversation ──▶ TrustEncounterScreen
                          (scripted reducer;       (existing screen,
                           LLM optional enhancer)   EncounterConfig prop)
                                  │
                                  ▼
                          IntakeConfig ──buildEncounterFromIntake──▶ EncounterConfig
```

### The Six Unpacking Questions → parameters (canonical: `intake.ts` INTAKE_SYSTEM)

| # | Question | Maps to |
|---|----------|---------|
| 1 | What experience do you want to create? | `milestoneTitle` / `milestoneBody` → capstone |
| 2 | What satisfied emotional state will that get you? | `targetChannel` (one Element) |
| 3 | Compared to that, what is life like right now? | stakes / forest pressure → `startingStress` |
| 4 | How does it feel to live here? | `stuckChannels[]` (compound emotions surfaced) → shadow channels + need rhythm |
| 5 | What would have to be true for someone to feel this way? | `epiphany` → conversion reveal / capstone insight |
| 6 | What reservations do you have about your creation? | `forestSeeds[]` → shadow names/text |

## API Contracts (API-First)

> This is the standalone Vite app (`mtgoa-game/`); "API" here = the engine module
> contracts (pure functions/reducers), not Next.js routes. No Prisma, no schema.

### Scripted intake state machine (pure)

**Input**: current state + the player's answer to the current question.
**Output**: next state, exposing either the next question or the final `IntakeConfig`.

```ts
// engine/intake/intakeMachine.ts (new)
export interface IntakeState {
  step: number;                 // 0..6 (6 = complete)
  answers: string[];            // raw player answers, index = question - 1
  config: IntakeConfig | null;  // present once step === 6
}
export type IntakeAction = { type: "ANSWER"; text: string } | { type: "RESET" };

export const INTAKE_QUESTIONS: readonly string[];        // the six prompts (scripted copy)
export function initIntake(): IntakeState;
export function intakeReducer(s: IntakeState, a: IntakeAction): IntakeState;
```

### Intake → encounter synthesis (pure)

**Input**: a completed `IntakeConfig`.
**Output**: a trust `EncounterConfig` (same type the Priya encounters use).

```ts
// engine/intake/buildEncounter.ts (new)
import type { EncounterConfig } from "@/engine/trust/trustTypes";
import type { IntakeConfig } from "@/api/intake";
export function buildEncounterFromIntake(config: IntakeConfig): EncounterConfig;
```

Synthesis rules (completable by construction):
- `needSequence`: the `stuckChannels` (deduped). Length 1 → constant (L1-style);
  length ≥ 2 → **paired** (`[a,a,b,b,…]`) for the read-then-respond rhythm the
  trust engine requires (a naive alternation softlocks — see Boss Priya).
- `shadows`: one per stuck channel (named from `forestSeeds` when available,
  else a default), each `channel` = that stuck channel.
- `deck`: an `align` card per stuck channel (inner track) + the four standard
  domain cards (outer track), `Direct Action` `herOnly`.
- `capstone`: `{ title: milestoneTitle, body: milestoneBody }`; `epiphany` woven
  into the conversion log / capstone body.
- `startingStress`: derived from Q3 pressure (default `2`, clamped below
  `ruptureAt`).
- `targetChannel`: thematic tone (display only; not mechanically enforced).

### Optional LLM enhancer (unchanged contract)

`intakeStep(history)` (existing) stays as-is — used *only* when `aiEnabled()` to
produce conversational phrasing; the scripted reducer remains the source of truth
for advancing steps and producing the final config.

## User Stories

### P1: Author an encounter from my own material (no AI)

**As a player without an AI backend**, I want to answer the six questions and play
the encounter they generate, so Applied Mode is fully usable offline.

**Acceptance**: From ModeSelect → Applied → answer six prompts → land in a trust
encounter whose capstone is my Q1 experience and whose shadows reflect my Q4/Q6;
the encounter is winnable.

### P2: A richer conversation when AI is on

**As a player with `VITE_AI_ENDPOINT` set**, I want the prompts to reflect my
answers back conversationally, so intake feels like a dialogue — without changing
what gets built or risking a dead end if the model misbehaves.

**Acceptance**: With AI enabled, prompt copy is model-generated; with AI off or on
error, scripted copy shows; the resulting `EncounterConfig` is identical in shape
and still completable.

## Functional Requirements

### Phase 1: Scripted intake state machine
- **FR1**: `engine/intake/intakeMachine.ts` — `INTAKE_QUESTIONS`, `initIntake`, `intakeReducer`, `IntakeState`, `IntakeAction`. Pure, no I/O.
- **FR2**: After the sixth answer, `intakeReducer` populates `config: IntakeConfig`, mapping answers per the table above (incl. compound-emotion expansion for Q4 via `COMPOUND_EMOTIONS`).
- **FR3**: Unit tests: six answers produce a fully-populated `IntakeConfig`; Q4 compound word (e.g. "betrayal") yields two stuck channels; `RESET` returns to step 0.

### Phase 2: Intake → encounter synthesis
- **FR4**: `engine/intake/buildEncounter.ts` — `buildEncounterFromIntake` per synthesis rules; multi-channel needs are paired for rhythm.
- **FR5**: `engine/intake/__tests__/intakeCompletability.sim.test.ts` — for a representative spread of intake outputs (1 stuck channel; 2 via compound; 3 distinct), the generated `EncounterConfig` is won by both the smart and safe-floor policies (reuse the trust sim harness), and both her-only/locked invariants hold.

### Phase 3: IntakeConversation UI + wiring (dual-track)
- **FR6**: `screens/IntakeConversation.tsx` — renders the current question, a free-text input, a running transcript, and a back/restart affordance; drives `intakeReducer`; on completion calls `buildEncounterFromIntake` and hands the `EncounterConfig` up.
- **FR7**: `App.tsx` routes Applied Mode through `IntakeConversation` → `TrustEncounterScreen` with the generated config; add a `#intake` prototype hash for direct access (mirrors `#l1-priya` / `#boss-priya`).
- **FR8**: `ModeSelect.tsx` — Applied Mode is **always enabled**; the AI state is shown as "enhanced conversation" (AI on) vs "scripted" (AI off), not enabled/disabled.

### Phase 4: Optional LLM enhancement
- **FR9**: When `aiEnabled()`, `IntakeConversation` may call `intakeStep()` for prompt phrasing/reflection; any error falls back to scripted copy. The scripted reducer always owns step advancement and the final config. No new dead ends.

## Non-Functional Requirements

- Pure engine modules; UI degrades gracefully with AI off (first-class path).
- No schema changes, no Prisma, no Next routes (standalone Vite app).
- New env: none required for the scripted path; `VITE_AI_ENDPOINT` stays optional and documented in `mtgoa-game/.env.example`.

## Scaling Checklist (AI)

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | Gated behind `aiEnabled()`; deterministic scripted fallback; LLM never blocks completion |
| Model override | Endpoint via `VITE_AI_ENDPOINT`; model already centralized in `api/client.ts` |

## Verification Quest (in-app, adapted)

> The repo's cert-quest pattern (Twine + CustomBar seed via Prisma) targets the
> Next.js app and does **not** apply to the standalone Vite game. Verification here
> is an in-app manual walkthrough, in the spirit of the trust prototype toggles.

- **ID**: `cert-applied-mode-intake-v1` (documented; in-app walkthrough, no DB seed)
- **Steps**:
  1. `npm run dev` in `mtgoa-game/` with `VITE_AI_ENDPOINT` **unset**.
  2. ModeSelect → **Applied Mode** is enabled (labelled "scripted").
  3. Answer all six questions; include a compound feeling word (e.g. "betrayal") at Q4.
  4. Confirm you land in a trust encounter whose **capstone title = your Q1 answer** and whose **shadows reflect Q4/Q6**, with two stuck channels from the compound word.
  5. Play it to a win (the generated encounter is completable).
  6. (Optional) Set `VITE_AI_ENDPOINT`, repeat, confirm prompts are conversational and the result is still completable.
- **Automated proof**: `npm test` — `intakeCompletability.sim.test.ts` green (generated encounters winnable).

## Dependencies

- `mtgoa-game/src/api/intake.ts` (contract: `IntakeConfig`, `INTAKE_SYSTEM`, `intakeStep`)
- `mtgoa-game/src/engine/trust/*` (`EncounterConfig`, reducer, sim harness — the target engine)
- `mtgoa-game/src/screens/TrustEncounterScreen.tsx` (already takes an `encounter` prop)
- `mtgoa-game/src/data/channels.ts` (`Element`, `COMPOUND_EMOTIONS`), `domains.ts` (`DomainName`)

## Open Questions (ratify at review)

1. **Target engine** — confirm intake feeds the **trust/attune** engine (completable) and we do *not* wire it into the legacy channel NPC pipeline. (Strongly recommended; the channel engine is proven unwinnable.)
2. **Superpower select in Applied Mode** — skip it (player authors the encounter) or keep it as a flavor pick before intake? Spec assumes **skip**.
3. **Q4 → need rhythm** — for 2–3 stuck channels, pair them for rhythm (recommended). Single stuck channel → constant L1-style need. Confirm the cap (e.g. max 3 distinct needs).

## References

- `mtgoa-game/src/engine/trust/level1Priya.ts`, `bossPriya.ts` (encounter-config exemplars)
- `mtgoa-game/src/engine/trust/__tests__/*.sim.test.ts` (completability proof harness to reuse)
- `mtgoa-game/src/screens/ModeSelect.tsx`, `App.tsx` (routing)
- Migration Brief — "Six Unpacking Questions" (Core Architecture)
