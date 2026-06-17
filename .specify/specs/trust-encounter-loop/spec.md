# Spec: Trust/Attune Encounter Loop

## Purpose

A **provably completable** NPC encounter loop for the MTGOA card game (`mtgoa-game/`),
built on a **trust** substrate: read an NPC's hidden live need, meet it to earn
trust, spend trust to dissolve their defenses, convert them to an ally, engage all
four allyship domains, and resolve their milestone. Priya (NPC 008, the hardest
test case) is the reference encounter, tuned across a difficulty ladder (L1 → L2 →
Boss).

**Problem**: The pre-existing channel-metabolize loop had **no reachable win**. A
diagnostic simulation (`engine/__tests__/completability.sim.test.ts`) proved
**0 / 6 superpowers** can beat Priya, for two independent structural reasons:

1. **Conversion gate (counter coverage)** — converting needs ≥3 of the NPC's six
   named counters, but a starting deck only holds the counters on its two affinity
   channels; four of six superpowers can never reach three metabolized shadows.
2. **Victory gate (Show Up ceiling)** — winning needs 10 Show Up BARs, but the only
   source of Show Up is one NPC light card, so the reachable maximum is ~1. Even a
   successful conversion **softlocks** at 1/10 forever.

The existing `engine.test.ts` never caught this because it *injects* `showUp: target`
and `npcStress: 7` — it proves the machine fires, never that a path exists.

**Practice**: Deftness Development — spec kit first, contract (pure reducer) before
UI, **deterministic over AI** (the loop runs with no language model).

## Design Decisions

| Topic | Decision |
|-------|----------|
| Substrate | **Trust**, not channel energy. Aligned reads bank trust; trust is spent to dissolve shadows. Replaces the unwinnable channel-metabolize win path. |
| Reading the need | The live need is **hidden until you ATTUNE**, and **attuning spends the beat**. Alternating needs are authored in **pairs** (read-beat → respond-beat), so a novice reads then responds while an expert who has learned the rhythm responds without attuning — a real tempo gradient. |
| Victory | **Capstone = convert + all four domains engaged.** Reachable by construction. Drops the unreachable "10 Show Up" gate. |
| Conversion teeth | Some domains are **her-only** (e.g. Direct Action) and refuse to engage until the NPC is an ally. |
| Difficulty | **L-up principle**: the boss is the basic loop at harder settings (more shadows, a moving multi-channel need, higher stress, more her-only domains) — not a new system. The starter deck is *matched* to L1 so it wins by construction. |
| No dead end | The basic move **"Show Up Honestly"** is always available and never negative; a player with no good cards still completes (slower). |
| Loss | The only loss is **rupture** (NPC stress hits the cap), reachable only via repeated **misreads** — losing is a choice, not a draw. |
| Isolation | **Additive.** The trust engine lives in `engine/trust/` and is self-contained; the channel engine, its tests, and its screens are untouched. |
| Tuning | All numbers in `trustRules.ts`; per-level overrides (`convertThreshold`) on the encounter config, so balancing never edits engine logic. |

## Conceptual Model

Mapping the loop to the canonical ontology (WHO / WHAT / WHERE / Energy / moves):

| Dimension | In this loop |
|-----------|--------------|
| **WHO** | The player (a Superpower archetype) vs an NPC (a developmental Face). Reference: Priya — Diplomat. |
| **WHAT** | Resolve the NPC's milestone quest (Priya: "Find what's still possible inside the constraint" — the DEI-rollback scenario). |
| **WHERE** | The four allyship domains — Gather Resources, Raise Awareness, Direct Action, Skillful Organizing — each engaged once to win. |
| **Energy** | **Trust**, the encounter-local resource: earned by aligned reads, spent to dissolve shadows. |
| **Moves (throughput)** | **Wake Up** = ATTUNE (see her live need). **Clean Up** = align/dissolve (metabolize defendedness into trust). **Grow Up** = conversion (cross the threshold to ally). **Show Up** = engage domains + CAPSTONE (do the work, resolve it). |

```
        ┌─────────── one beat ───────────┐
ATTUNE (Wake Up, spends the beat) ─► read her live need
   │                                      │
   ▼                                      ▼
ALIGN matching channel (Clean Up) ─► +trust ──► DISSOLVE shadow (−trust, NPC stress −1)
                                                      │
                                          dissolved ≥ threshold
                                                      ▼
                                            CONVERT (Grow Up) ─► her-only domains unlock
                                                      │
                            engage all four domains (Show Up)
                                                      ▼
                                            CAPSTONE ─► win
  (misread → −trust, +NPC stress → rupture at the cap = the only loss)
```

## API Contracts (engine-first)

Pure reducer — no React, no I/O, no network. **Route vs Action: N/A** — this is an
in-app `useReducer` state machine inside the standalone Vite game, not a Next.js
server surface, so there is no Route Handler or Server Action.

```ts
// engine/trust/trustEngine.ts
function initTrustEncounter(config: EncounterConfig): TrustState
function trustReducer(state: TrustState, action: TrustAction): TrustState

type TrustAction =
  | { type: "ATTUNE" }                          // read the live need (spends the beat)
  | { type: "PLAY"; cardId: string }            // align (inner) or engage a domain (outer)
  | { type: "BASIC" }                           // "Show Up Honestly" — always-safe trust
  | { type: "DISSOLVE"; shadowId: string }      // spend trust to dissolve a shadow
  | { type: "CAPSTONE" }                        // win if converted + all four domains
  | { type: "RESET" }

// Selectors
function currentNeed(state): Element
function allDomainsTouched(state): boolean
function convertThreshold(config): number       // per-level override, defaults to rules
```

`EncounterConfig` (data, `trustTypes.ts`): `needSequence: Element[]` (length 1 =
fixed; paired = alternating), `startingStress`, `convertThreshold?`, `shadows[]`,
`deck[]` (align + domain cards, `herOnly?`), `capstone`.

## User Stories

### P1: A completable encounter
**As a player**, I want every encounter to have a reachable win, so the loop never
softlocks. **Acceptance**: each ladder rung resolves to `win` under real play (proven
by simulation, all styles).

### P2: Reading the rhythm is a skill
**As a player**, I want learning an NPC's oscillating need to pay off, so mastery
matters. **Acceptance**: on alternating rungs an expert who never attunes wins faster
than a novice who attunes each beat.

### P3: No dead end, losing is a choice
**As a player**, I want to always have a safe move and to only lose by my own
misreads. **Acceptance**: a floor policy (attune + "show up honestly" only) still
wins; a forced-misread deck ruptures.

## Functional Requirements

### Phase 1 — Trust engine + Level-1 Priya (DONE)
- **FR1**: Pure `trustReducer` implementing ATTUNE / PLAY / BASIC / DISSOLVE / CAPSTONE / RESET.
- **FR2**: Capstone victory = converted ∧ all four domains engaged; rupture = NPC stress ≥ cap.
- **FR3**: Level-1 Priya (fixed Water need, 3 shadows, convert-at-2, one her-only domain) matched to a starter deck that wins by construction.

### Phase 2 — Difficulty ladder (DONE)
- **FR4**: Level-2 Priya — paired Water/Fire rhythm, 4 shadows, convert-at-3, two her-only domains.
- **FR5**: Boss Priya — three-channel moving need (Water/Fire/Metal in pairs), 6 shadows, higher start stress, two her-only domains.
- **FR6**: Playable screen (`TrustEncounterScreen`) with an L1 / L2 / Boss rung switcher, mounted from `App` via a prototype toggle (additive).

### Phase 3 — Deferred (NOT STARTED)
- **FR7**: BAR-crafting — promote earned BARs into craftable player cards (explore-play loot).
- **FR8**: Apply the trust loop to the other authored NPCs (Bev, Jerome, Dara, …).
- **FR9**: Applied Mode intake (six-question conversation → generated encounter config).
- **FR10**: Bridge in-game moves to real-world actions (the dual-track / non-AI path).

## Non-Functional Requirements

- **Additive / no regressions** — channel engine and its 9 tests stay green; trust engine is isolated in `engine/trust/`.
- **Deterministic** — no language model in the loop; fully unit-testable.
- **Tunable without code** — balance lives in `trustRules.ts` + per-level config overrides.
- **No persistence** — encounter state is in-memory (`useReducer`); no Prisma/schema change, so **§ Persisted data & Prisma does not apply**.

## Verification Quest (required for UX features)

- **ID**: `cert-trust-encounter-loop-v1`
- **Form**: Because `mtgoa-game/` is a standalone Vite app (not the main Next.js/Twine
  certification surface), the verification quest is realized as **re-runnable
  completability simulations** — the proof *is* an in-repo artifact ("the game
  creates the game"; verification legible in the game world).
- **Steps** (`npm test` in `mtgoa-game/`):
  1. `completability.sim.test.ts` — establishes the diagnosis: the old channel loop is **0/6 winnable** (softlock).
  2. `trustCompletability.sim.test.ts` — L1 & L2 are **winnable under novice / expert / floor**; expert clears L2 with **0 attunes**; the need provably moves; reckless misreads rupture.
  3. `bossPriyaCompletability.sim.test.ts` — Boss is winnable (smart and floor), the need moves across >1 channel, both her-only domains stay locked until conversion.
- **Pass condition**: all three green (currently **21/21** across the suite); `npm run build` and `tsc --noEmit` clean.

## Dependencies

- `mtgoa-game/src/data/` — `channels.ts` (Wuxing Element), `domains.ts` (the four domains), `npcs.ts` (Priya's authored profile / milestone narrative).
- No dependency on the channel engine (`engine/gameState.ts`); deliberately parallel.

## References

- Engine: `mtgoa-game/src/engine/trust/{trustTypes,trustRules,trustEngine,level1Priya,level2Priya,bossPriya}.ts`
- Proofs: `mtgoa-game/src/engine/trust/__tests__/trustCompletability.sim.test.ts`, `bossPriyaCompletability.sim.test.ts`, `mtgoa-game/src/engine/__tests__/completability.sim.test.ts`
- UI: `mtgoa-game/src/screens/TrustEncounterScreen.tsx`, `mtgoa-game/src/App.tsx`
- Fail-fix: `.cursor/rules/fail-fix-workflow.mdc` (`npm run build`, `npm run check`)
