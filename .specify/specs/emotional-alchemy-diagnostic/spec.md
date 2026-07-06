# Spec: Emotional Alchemy Charge Diagnostic

## Purpose

The `EmotionalVector` type plus the v3 diagnostic instrument that produces it: the ≤4-tap + visible-editable-defaults + conditional-fork flow that turns a live charge into a structured, composer-ready `DiagnosticResult` — without any raw blocker/story text leaving the client.

**Problem**: Practice Atlas §10 target 2. The composer (target 3) is a pure function of `(card, vector, ctx)`, but nothing produces `vector` or `ctx`. `tech-charge-diagnostic` exists only as prose. The Atlas's safety mechanics (numbness fork, layer check, crisis affordance, safety/harm forks) exist only on paper.

**Practice**: Deftness Development — spec kit first, deterministic over AI. This target is a pure-logic core + a client instrument. No AI. No persistence in Phase 1 (deck precedent: DB-free, client-first).

**Canon sources**: [`docs/MTGOA_PRACTICE_ATLAS.md`](../../../docs/MTGOA_PRACTICE_ATLAS.md) v3 — §1.2 (vector), §1.3 (pipeline), §1.6 (privacy), §3.1 (picker + flat fork), §8 (ask-don't-infer inventory). Depends on target 1: [`src/lib/emotional-alchemy/`](../../../src/lib/emotional-alchemy).

## Design Decisions

| Topic | Decision |
|-------|----------|
| Module home | `src/lib/emotional-alchemy/vector.ts` — cohesive with the registry (target 1); re-exported from the module index |
| Privacy (§1.6) | The `DiagnosticResult` type **cannot carry raw text** — it holds only enums/numbers/thread-label. Raw blocker/story live in client component state and are never serialized or sent. A test asserts the result's field set is structured-only |
| Route vs Action | **No server action in Phase 1.** The instrument is client-only to honor §1.6; the structured result is returned in-process to the caller (the future composer). Persistence (a structured-only `recordDiagnostic`) arrives with the session log (target 5) |
| Blocker shape (G8) | Client-side keyword classifier `classifyBlockerShape(blocker, story) → {shape, confidence}`; **computed-and-confirmed** — always rendered as an editable chip, never silent (§8.1). Heuristics are transparent and deliberately conservative (default `confidence:'low'`) |
| Threads (§1.3 step 3) | The instrument is **thread-source-agnostic**: it accepts `threads: ThreadRef[]` as input and emits a `ThreadRef` (new+label or existing). Thread *persistence* is deferred to target 4/5 — Phase 1 stays DB-free |
| Aesthetic | Pre-card raw flow → `SceneCard`/`SceneInput`/`SceneShortInput`/`SceneNav` (the 321/charge-capture surface), **not** `CultivationCard` (UI_COVENANT law 10: pre-card must read distinct from element-coded post-card). Tailwind layout only; chip vocabulary matches `ChargeCaptureForm` |
| Defaults are asked (§8.1, I2) | Altitude, target, and shape render as pre-selected, visible, one-tap-editable fields. Zero taps to accept, one to change. No emotional field is silently computed except shape, which carries the confirm chip |
| Reuse target-1 types | `EmotionChannel`, `SatisfactionSpirit`, `BlockerShape` imported from the registry — not redefined (mirrors the vocabulary-no-drift discipline) |
| No schema change | Pure TS + client React; Prisma section N/A in Phase 1 |

## Conceptual Model

- **WHAT**: the diagnostic — the instrument that reads a charge and routes it. It is upstream of every tool and card.
- **Energy**: it converts a felt charge into a structured vector `{channel, intensity, altitude, target}` (§1.2) plus routing context `{time, temporal, fuel, shape, thread, harmRelation, flags}`.
- **Personal throughput**: the diagnostic precedes the WAVE submove — the card fixes the submove, the diagnostic fixes the vector.

## API Contracts

Pure module exports (no route, no action in Phase 1):

```ts
// src/lib/emotional-alchemy/vector.ts
export type Altitude = 'dissatisfied' | 'neutral' | 'satisfied'
export interface EmotionalVector {
  channel: EmotionChannel; intensity: number; altitude: Altitude; target: SatisfactionSpirit
}
export type TimeBudget = 2 | 10 | 30
export type Temporal = 'now' | 'replay' | 'upcoming'
export type Fuel = 'depleted' | 'steady' | 'charged'
export type ChannelPick = EmotionChannel | 'flat' | 'cant_tell'
export type FlatAnswer = 'rested_calm' | 'walled_off' | 'buried' | 'grey'
export type HarmRelation = 'witnessed' | 'received' | 'own_conduct'
export type LayerAnswer = 'descended' | 'stayed' | 'declined'
export type ThreadRef = { kind: 'new'; label: string } | { kind: 'existing'; id: string; label: string }
export type DiagnosticFlag =
  | 'crisis' | 'hot_charge' | 'safety_power_over' | 'verified_rest'
  | 'frozen_suspected' | 'numbness_verified' | 'capture_only' | 'layer_descended'
export type DiagnosticStep =
  | 'blocker' | 'thread' | 'channel' | 'flat_fork' | 'cant_tell' | 'intensity'
  | 'time' | 'temporal' | 'fuel' | 'story' | 'layer_check' | 'harm_relation'
  | 'safety' | 'defaults' | 'summary'

export interface DiagnosticResult {
  vector: EmotionalVector
  time: TimeBudget; temporal: Temporal; fuel: Fuel
  shape: BlockerShape | null; shapeConfidence: 'high' | 'low'
  thread: ThreadRef; harmRelation: HarmRelation | null
  layerChecked: boolean; flags: DiagnosticFlag[]
  // NB: no raw blocker/story text — §1.6
}

export function defaultTargetForChannel(c: EmotionChannel): SatisfactionSpirit
export function defaultAltitude(intensity: number): Altitude
export function isHotCharge(intensity: number): boolean
export function shouldOfferLayerCheck(intensity: number): boolean
export function classifyBlockerShape(blocker: string, story?: string): { shape: BlockerShape | null; confidence: 'high' | 'low' }
export function resolveFlat(a: FlatAnswer): { channel: EmotionChannel | null; targetDefault: SatisfactionSpirit; shapeHint: BlockerShape | null; flags: DiagnosticFlag[] }
export function detectSafetyTrigger(text: string): boolean
export function detectIdentityHarm(text: string): boolean
export function planSteps(a: Partial<DiagnosticAnswers>): DiagnosticStep[]
export function finalizeResult(a: DiagnosticAnswers): DiagnosticResult   // throws if required fields missing
```

## User Stories

### P1: Diagnose a charge in a few taps
**As a** player with a live charge, I want to name it and answer a few quick questions, **so** I get a clear read (`Anger 6 → Triumph`, shape, time) I can act on.
**Acceptance**: channel + intensity + time + temporal are ≤4 taps; altitude/target/shape appear pre-filled and editable; a summary screen shows the structured read.

### P2: The instrument never infers what it must ask (§8)
**As a** player, I want the app to ask, not guess, my channel, my numbness read, and my safety context.
**Acceptance**: flat → the four-answer fork fires before neutrality can carry Peace; intensity ≥ 5 offers one layer check; a safety-trigger word in the blocker fires the power-over fork; identity-harm wording fires the ally/target fork.

### P3: My words stay on my device (§1.6)
**As a** player, I want my raw blocker/story text to never leave the client.
**Acceptance**: `DiagnosticResult` has no raw-text field; the classifier runs client-side and emits only an enum; nothing is POSTed.

### P4: A crisis exit is always one tap away (§8.4)
**As a** player in more than a practice can hold, I want a visible "I need more than a practice" affordance at every step.
**Acceptance**: the affordance renders on every step; intensity 10 additionally prompts it; choosing it ends with a resources card, no tool, and sets the `crisis` flag.

### P5: Verification quest
**As a** tester, I want a guided walkthrough of the live flow, framed toward the Bruised Banana Fundraiser.
**Acceptance**: `cert-emotional-alchemy-diagnostic-v1` walks channel→flat-fork→intensity→forks→summary and the crisis exit.

## Functional Requirements

### Phase 1: Vector + diagnostic core + client instrument (this target)

- **FR1**: `vector.ts` defines the contract types above, importing `EmotionChannel`/`SatisfactionSpirit`/`BlockerShape` from the registry.
- **FR2**: `defaultTargetForChannel` matches `CAPABILITIES` (`move-library.ts`) satisfaction — asserted no-drift.
- **FR3**: `defaultAltitude(i)` = `dissatisfied` when i ≥ 4 else `neutral`; `isHotCharge(i)` = i ≥ 7; `shouldOfferLayerCheck(i)` = i ≥ 5.
- **FR4**: `resolveFlat` implements the §3.1 flat-fork table (rested_calm→real-peace/verified_rest; walled_off→frozen_suspected+T02; buried→neutrality+many_items; grey→joy+win/starved).
- **FR5**: `classifyBlockerShape` is a transparent keyword heuristic returning `{shape, confidence}`; documented, conservative, deterministic.
- **FR6**: `detectSafetyTrigger` / `detectIdentityHarm` are keyword predicates driving the safety and harm-relation forks.
- **FR7**: `planSteps(partial)` returns the ordered visible steps given answers-so-far, inserting flat_fork/cant_tell/layer_check/harm_relation/safety conditionally.
- **FR8**: `finalizeResult` assembles the structured `DiagnosticResult` (flags incl. hot_charge, numbness_verified, crisis, safety_power_over, verified_rest, frozen_suspected, layer_descended, capture_only); throws on missing required fields; carries no raw text.
- **FR9**: `DiagnosticFlow` client component drives the flow via `planSteps`, holds raw text in local state only, renders SceneCard steps + the always-visible crisis affordance + capture-only option, and calls `onComplete(result)` / `onCrisis()` / `onCaptureOnly()`.
- **FR10**: `/practice/diagnose` route renders the instrument (DB-free; no auth gate in Phase 1, matching `/deck`) and shows the read summary on completion.
- **FR11**: unit tests cover FR2–FR8 (no-drift, thresholds, flat table, classifier samples, safety/harm predicates, step planning incl. every fork, finalize flags + structured-only guarantee).
- **FR12**: test file added to `vitest.config.ts`.

### Deferred (named, not built here)

- Server-side `recordDiagnostic` (structured-only) and thread persistence → target 5.
- Resonance check + card banking (§1.3 step 2b) → belongs with card draw (target 4 wiring).
- Region-configurable crisis resources content (G10) → placeholder card in Phase 1.

## Non-Functional Requirements

- Backward compatible; additive only. No change to the registry's public API (only new exports from the index).
- Deterministic; no AI; no network in the diagnostic path.
- `prefers-reduced-motion` respected; touch targets ≥ 44px; WCAG AA contrast (UI_COVENANT §11).
- `npm run check` + vitest green.

## Persisted data & Prisma

N/A in Phase 1 — DB-free, client-first. No schema change. (Thread + session persistence is target 5, which will carry its own § Persisted data & Prisma.)

## Verification Quest (required — UX feature)

- **ID**: `cert-emotional-alchemy-diagnostic-v1` (`scripts/seed-cert-emotional-alchemy-diagnostic.ts`, modeled on `scripts/seed-cert-go-deeper.ts`; TwineStory + `CustomBar` `isSystem:true`, `visibility:'public'`, deterministic id, idempotent; `npm run seed:cert:emotional-alchemy-diagnostic`). Framed toward the Bruised Banana Fundraiser (a verified diagnostic is party-prep for the practice engine).
- **Steps**:
  1. Open `/practice/diagnose`; name a blocker; confirm the somatic-pause copy and that the crisis affordance is visible.
  2. Tap **flat or numb** → confirm the four-answer fork fires; pick *buried* → confirm it routes to Neutrality/overload.
  3. Restart; pick **mad**, intensity 7 → confirm the layer check is offered and the summary shows the `hot_charge` read.
  4. Enter a blocker naming a boss → confirm the safety power-over fork fires; confirm no raw text is sent (network tab clean).
  5. Reach the summary → confirm the structured read (channel→target, shape chip editable) and the "capture only" and crisis exits.

## Dependencies

- `src/lib/emotional-alchemy/` (target 1 — types + registry)
- `src/lib/allyship-deck/move-library.ts` (`CAPABILITIES` — target no-drift)
- `src/components/scene-card/SceneCard.tsx` (flow primitive)
- `UI_COVENANT.md`, `src/lib/ui/card-tokens.ts`

## References

- `src/app/shadow/321/Shadow321Runner.tsx` (SceneCard flow precedent)
- `src/components/charge-capture/ChargeCaptureForm.tsx` (emotion chip vocabulary)
- `scripts/seed-cert-go-deeper.ts` (cert seed pattern)
- `docs/MTGOA_PRACTICE_ATLAS_GAP_ANALYSIS.md` (I2, D1, D5, D6, G8)
