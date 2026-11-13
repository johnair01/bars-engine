# Manual Test Guide — jev-quality-gate-001

**Companion:** `SPEC-jev-quality-gate-001.md`

---

## What We Built

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/bar-asset/quality-gate.ts` | `runQualityGate()` — Jev score-type gate wrapper | Planned |
| `src/lib/bar-asset/translator.ts` (edit) | Gate call between maturity gate and `dispatchAI` | Planned |
| `scripts/calibrate-jev-gate.ts` | Threshold calibration over ~50 judged BARs | Planned |
| `src/app/api/bar-asset/translate/route.ts` (edit) | Maps `QualityGateError` → 422 | Planned |

---

## How to Test

### Step 1 — Unit tests (no live API)

```bash
cd bars-engine && bun test src/lib/bar-asset/__tests__/quality-gate.test.ts
```

All Jev calls injected via `fetchImpl`. Cover:
- `mode=off` → zero fetch calls, `{ ok: true, score: null }`
- `mode=shadow` → low score logged, translation proceeds
- `mode=enforce` → score < threshold throws `QualityGateError(score, threshold)`
- `decide()` returns `{ ok: false }` → gate proceeds in every mode
- state length > 100k chars → truncated, no throw

### Step 2 — Type gate

```bash
cd bars-engine && bunx tsc --noEmit
```

### Step 3 — Shadow-mode live check (one real Jev call)

```bash
cd bars-engine && bun scripts/calibrate-jev-gate.ts --dry-sample
```

Sends one fixed sentence (never real content — same discipline as
`/api/council/jev-check`) and prints the raw score + which credential was used.
If it errors: check `AI_GATEWAY_API_KEY` / OIDC exactly as jev-check does.

### Step 4 — Calibration run (Wendell gate)

```bash
cd bars-engine && bun scripts/calibrate-jev-gate.ts --set <path-to-labeled-set>
```

Input: ~50 BARs Wendell has judged accept/reject. Output: agreement table at
thresholds 0.50–0.90 (0.05 steps). **No enforcement threshold exists until Wendell
picks one from this table.** Set `JEV_QUALITY_GATE_MODE=enforce` +
`JEV_QUALITY_THRESHOLD` only after that decision.

### Step 5 — Enforce-mode end-to-end

1. Set `JEV_QUALITY_GATE_MODE=shadow` in the deployment, POST a thin BAR to
   `/api/bar-asset/translate` → expect 200 (shadow logs, never blocks).
2. Flip to `enforce` with the calibrated threshold, POST the same thin BAR →
   expect 422 `{ error: 'quality-gate', score, threshold }`.
3. Stop the Jev path (unset `AI_GATEWAY_API_KEY`, no OIDC) → expect 200 with a
   log line noting the gate bypassed. Fallback must never reject.
