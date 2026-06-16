# Plan: Trust/Attune Encounter Loop

## Strategy

Build a second, parallel encounter engine on a **trust** substrate rather than patch
the unwinnable channel-metabolize loop. Keep it **pure and isolated** so it is
provable by simulation and cannot regress the existing game. Prove completability
*before* building UI (the diagnosis sim came first, then the rebuild, then the
screen) — deterministic-over-AI, contract-before-UI.

## Architecture

```
mtgoa-game/src/
├── engine/
│   ├── gameState.ts ........... existing channel engine (UNTOUCHED)
│   ├── __tests__/
│   │   ├── engine.test.ts ..... existing (UNTOUCHED, green)
│   │   └── completability.sim.test.ts .. NEW diagnosis: channel loop is 0/6 winnable
│   └── trust/ ................. NEW, self-contained trust engine
│       ├── trustTypes.ts ...... EncounterConfig, TrustCard, TrustShadow
│       ├── trustRules.ts ...... all tunables (trust/stress/shadow)
│       ├── trustEngine.ts ..... pure reducer + selectors
│       ├── level1Priya.ts ..... fixed need, matched starter deck
│       ├── level2Priya.ts ..... paired Water/Fire rhythm
│       ├── bossPriya.ts ....... three-channel moving need (full difficulty)
│       └── __tests__/
│           ├── trustCompletability.sim.test.ts .. L1 + L2 proof
│           └── bossPriyaCompletability.sim.test.ts .. boss proof
└── screens/
    └── TrustEncounterScreen.tsx  NEW; rung switcher (L1/L2/Boss), config-agnostic
App.tsx ......................... prototype toggle (additive button + #hash)
```

## Key Design Resolution: the attune model

Two converging efforts produced different semantics; the spec-of-record standardizes
on the stronger one:

- **Adopted**: ATTUNE **spends the beat**; alternating needs authored in **pairs**
  (read-beat → respond-beat). This makes attuning carry a genuine tempo cost, so
  reading the rhythm to skip it is measurably faster (L2 expert 9 turns vs novice 12).
- **Rejected**: a "free attune + deep-read bonus" variant. It avoided punishing the
  novice but produced no tempo gradient (novice == expert), so the rhythm skill was
  cosmetic. Reverted in favor of the paired-need model the Boss was built on.

## Data flow

`config: EncounterConfig` → `initTrustEncounter` → `TrustState` → `trustReducer`
(per action) → selectors (`currentNeed`, `allDomainsTouched`, `convertThreshold`)
drive both the simulations and the React screen. The screen holds the reducer via
`useReducer`; the sims drive it headless under scripted policies.

## Test strategy (the verification quest)

Simulate **real play under policies**, not forced states:
- **novice** — attune each beat, then respond.
- **expert** — never attune; respond from the learned rhythm.
- **floor** — only attune + "show up honestly" (proves no dead end).
- **reckless** — forced misreads (proves the loss exists and is choice-driven).

Assert each rung reaches `win`, the need actually moves (distinct trail channels),
her-only domains stay locked pre-conversion, and stress never rises under careful
play.

## Deferred (Phase 3)

- BAR-crafting / explore-play loot (promote BARs → player cards).
- Trust decks for the other authored NPCs (Bev, Jerome, Dara, …).
- Applied Mode intake → generated `EncounterConfig`.
- In-game → real-world action bridge (dual-track, non-AI path).

## Fail-fix

`cd mtgoa-game && npm test && npm run typecheck && npm run build` — all green before
merge. No Prisma/schema changes, so no migration step.
