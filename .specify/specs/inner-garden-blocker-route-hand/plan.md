# Plan: Inner Garden — Multi-Channel Blocker & Route-Hand Capacity

Corrective refactor of the existing pure ontology lib. No renderer, no persistence, no
counter. Keep everything tsx-testable; reuse `emotional-alchemy` enums.

## Phase 1 — Types & derivation (`gate-confrontation.ts`)
- Introduce `ChannelThread` and `BlockerSignature = ChannelThread[]`.
- `SatisfactionSpirit` / `EmotionChannel` imported from `emotional-alchemy` (no new enums).
- `threadRouteHand(thread)` → altitude-preserving capacity keys
  (`metabolize:<ch>`, `transcend:<ch>-><spirit>`, `translate:<from>-><to>`).
- `requiredRouteHand(sig)` = union of threads' keys.
- Rewrite `resolveBlocker` to per-thread paths; blocker `resolved` iff all threads owned.
- **Delete** the lossy `requiredRole`/single-vector `deriveRequiredCapacity` (or reduce them
  to the N=1 thread case) — remove the altitude collapse.

## Phase 2 — Demonstration (`demonstration.ts`)
- Demonstrate **per thread** (evidence kind still derived from the thread's role).
- A blocker completes when every thread passes its Integration Check; grant each thread's
  capacity independently.

## Phase 3 — Crafting (`move-crafting.ts`)
- `buildCraftSkeleton` operates on a **thread**, not a whole blocker.
- Grammar validation unchanged in spirit; keys are now per-thread/altitude-preserving.

## Phase 4 — Decomposition seam
- `decomposeBlockerFromText(text)` → `{ draft: BlockerSignature, rationale }`. Deterministic
  keyword scaffold for the stub (avoidance→fear, hard→anger, …); the real read is AI-drafted,
  player-ratified. Keep the LLM call out of the pure lib (typed seam).

## Phase 5 — Tests
- Rewrite the four ontology suites for multi-channel; add the **over-grant regression** and
  the **canonical hard-email** case (see spec § Verification). All via `npm run test:inner-garden-ontology`.

## Verify
- `npm run test:inner-garden-ontology` green; the over-grant regression asserts a
  partially-owned multi-thread blocker is NOT resolved.
- n=1 dogfood: the practitioner runs a real blocker through the parallel Claude Design build.
</content>
