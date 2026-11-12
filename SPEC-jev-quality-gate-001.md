# SPEC: jev-quality-gate-001 — Jev Score-Type Gate, Pre-Translation

**Owner:** Council of Game Faces | **Created:** 2026-11-07 | **Status:** READY (pre-build)
**Cast:** Hexagram #15 Modesty (rtcm yes-strong, confirm) — one gate, start low
**Companion:** `TEST-GUIDE-jev-quality-gate-001.md`

---

## Context

The bar-asset pipeline spends its most expensive call (`dispatchAI` → Claude Sonnet in
`translator.ts`) on whatever input arrives, including input too thin to produce a good
asset. Jev — TypeSafe's decision model, already wired in `src/lib/jev/client.ts` —
answers typed questions with probabilities at ~$0.042/M input tokens (~70x cheaper than
the Sonnet call it fronts).

This spec adds **one** score-type gate: pre-translation input-quality scoring in the
translator path. Per the 6-face consult (2026-11-07): one gate only, calibrate before
enforcing, everything behind the existing `jev-fallback` convention.

Existing conventions this spec inherits (defined in `src/lib/jev/client.ts` header):

| Convention | Meaning |
|---|---|
| `jev-fallback` | `decide()` returning `{ ok: false }` → proceed as if Jev absent |
| `jev-select-only` | Jev never writes text; it picks/scores/checks |
| `jev-no-player-text` | Never send player text in state |

---

## What We Build

### Phase 1 — Shadow mode (never blocks)

- `src/lib/bar-asset/quality-gate.ts`:
  - `QualityGateResult = { ok: boolean; score: number | null; threshold: number | null; mode: 'off' | 'shadow' | 'enforce'; bypassed?: string }`
  - `runQualityGate(seed: AuthoredContent): Promise<QualityGateResult>`
  - Wraps `decide()` from `src/lib/jev/client.ts` with a single score-type question:
    `{ type: 'score', instructions: 'Score this blessed object description for translation readiness.', criteria: QUALITY_CRITERIA }`
  - `QUALITY_CRITERIA` (grounded in the blessed-object NL contract, `prompts/blessed-object.ts`):
    1. `specificity` — the description supports an evocative, specific room name (not "Room 1")
    2. `atmosphere` — enough sensory material for a two-line atmospheric description
    3. `props-history` — the description implies the object's history/purpose, which props can reflect
    4. `mood-resonance` — a coherent mood is inferable from the mood-tag set (dark, mysterious, sacred, haunted, ancient, eerie, somber, grand, forgotten)
- Mode resolution: env `JEV_QUALITY_GATE_MODE` = `off` (default) | `shadow` | `enforce`.
  Off returns `{ ok: true, score: null, mode: 'off' }` with zero Jev calls.
- `translator.ts`: call `runQualityGate(seed)` after the maturity gate, before `dispatchAI`.
  Shadow mode logs the score and proceeds regardless.
- State sent to Jev: `title + description` only (author prose, not player text — `jev-no-player-text`).
  Well under `JEV_MAX_STATE_CHARS`; truncate defensively at the cap.

### Phase 2 — Calibration (Wendell gate)

- `scripts/calibrate-jev-gate.ts`: runs the gate over ~50 already-judged BARs
  (Wendell-labeled accept/reject), prints agreement at candidate thresholds
  (0.5 → 0.9 in 0.05 steps).
- Wendell picks the enforce threshold from the table. No auto-picked cutoff.
- Pin the model: `JEV_MODEL_ID` env (default `typesafe-ai/jev-1.14.0`), passed through to
  the gateway call. `jev-latest` is not used in the enforce path.

### Phase 3 — Enforce

- With `mode=enforce` and score < threshold: throw `QualityGateError` (score, threshold)
  — same pattern as `SeedMaturityError`. `POST /api/bar-asset/translate` maps it to
  HTTP 422 with `{ error: 'quality-gate', score, threshold }`.
- `ok: false` from Jev (outage, auth, timeout) **always proceeds** — the gate degrades
  to absent, never to rejecting.

---

## What We Do Not Build

- Best-of-N candidate selection (deferred until gate one's cutoff has proven itself).
- Art-prompt scoring (Challenger: symptom, not cause).
- Any boolean-type gate (Architect: score only where a gradient routes a decision).
- Changes to `dispatchAI`, providers, or the blessed-object prompt.

---

## Verification

- `tsc --noEmit` clean.
- `bun test` unit-only: inject `fetchImpl` into `decide()` (the client already accepts
  it) — no live Jev calls in CI. Cover: score read-back, mode=off zero-call, shadow
  proceed-on-low-score, enforce throw, fallback proceed-on-`ok:false`.
- Calibration run output archived with the threshold decision.

## Risks

- Uncalibrated threshold silently approves bad assets → Phase 2 is a hard Wendell gate.
- BYOK-style silent fallback does not apply here: `ok:false` proceeds with the
  translation, so worst case is a wasted Sonnet call, never a skipped asset.
