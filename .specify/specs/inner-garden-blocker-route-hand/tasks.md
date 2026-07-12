# Tasks: Inner Garden — Multi-Channel Blocker & Route-Hand Capacity

**Status: implemented (2026-07-12).** `npm run test:inner-garden-ontology` green.

- [x] **T1** `gate-confrontation.ts`: `ChannelThread`, `BlockerSignature = ChannelThread[]`;
  local mirrors of `EmotionChannel`/`SatisfactionSpirit` + `CHANNEL_SPIRIT`/`SPIRIT_CHANNEL`.
- [x] **T2** `threadRouteHand(thread)` → `{ required, optional }`; `requiredRouteHand(threads)`. Altitude-preserving.
- [x] **T3** `resolveBlocker` per-thread; thread resolves at **neutral**; `resolved` iff all threads ≥ neutral;
  `reachedNeutral`/`reachedSpirit`/`path` per thread. Lossy single-vector collapse removed.
- [x] **T3b** `BlockerOrigin` + `Blocker{origin,threads}`; `inferBlockerForStagnantSeed` (window default 3,
  `windowDays` override). Blockers optional — no gate without one.
- [x] **T4** `demonstration.ts`: per-thread `ThreadDemonstration`; `runIntegrationCheck`/`completeThread`;
  earns the altitude-preserving key; metabolize→traced_practice, transcend→artifact/action.
- [x] **T5** `move-crafting.ts`: `buildCraftSkeleton(thread)`; `resolveGatePath(key,…)`; grammar per-thread.
- [x] **T6** `decomposeBlockerFromText` — deterministic keyword scaffold (typed AI seam); reads fear+anger
  from "avoiding the hard email".
- [x] **T7** All four `__tests__` suites rewritten for multi-channel.
- [x] **T8** Over-grant regression (partially-owned multi-thread blocker → NOT resolved).
- [x] **T9** Canonical hard-email case (fear→wonder + anger→triumph; clears when both reach neutral).
- [x] **T9b** Neutral-suffices, inferred-blocker window, and per-thread path tests.
- [x] **T10** Master doc pointed at the multi-channel model; retired-beats muddiness clarified
  (`progression-scales` is descriptive-only).

## Remaining (out of this pure-lib slice — need a surface)
- [ ] Wire `resolveBlocker`/`completeThread`/`decompose`/`inferBlocker` into the daily loop + Claude Design UI.
- [ ] `export` the new symbols already flow through `ontology/index.ts` (`export *`).
- [ ] Sibling: implement `inner-garden-action-economy-fertility` (Pressure 1).
</content>
