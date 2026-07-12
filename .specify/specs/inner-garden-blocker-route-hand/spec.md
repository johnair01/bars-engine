# Spec: Inner Garden — Multi-Channel Blocker & Route-Hand Capacity

## Purpose

Replace the single-vector `BlockerSignature` in the Inner Garden ontology with a
**multi-channel** signature: a blocker decomposes into 1..N **channel-threads**, each a
climb from a present emotional state toward that channel's **satisfaction spirit**. The
required capacity becomes a **route-hand** (one move per thread), not a single card.

**Problem.** The current model (`src/lib/inner-garden/ontology/gate-confrontation.ts`)
reduces every blocker to one `from→to` vector and, for any cross-channel edge, **drops
altitude** (`requiredRole` returns `translate` and `deriveRequiredCapacity` emits
`translate:<from>-><to>` with no altitude). Consequences, both real:
- **Correctness bug:** `resolveBlocker` keys only on that lossy capacity, so owning one
  `translate:fire->water` capacity silently marks *every* fire→water blocker a Task —
  regardless of the altitude climb never demonstrated (the demonstration bar checks
  altitude; the granted capacity throws it away). See `gate-confrontation.test.ts:83-85`,
  which currently *celebrates* this collapse.
- **Modeling error:** real blockers are multi-channel. "I keep avoiding the hard email" =
  **fear** (avoidance) **+ anger** (hard) — two threads, not one vector. The single-vector
  reduction is what made the typology look arbitrary; it is not — the channels are readable
  from the blocker's own language, and the targets are the fixed satisfaction spirits.

**Practice:** Deftness Development — spec kit first, API-first, deterministic over AI. This
is a **corrective refactor of existing tested pure code**, not new product surface.

**Validation posture:** the practitioner-player (GM-is-also-a-player) is dogfooding this via
a parallel Claude Design build — n=1, but a *real* user. Verification is that person's own
use, plus the regression test below.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Blocker shape | A **set of channel-threads** (1..N), not a single `from→to` vector. |
| Thread shape | `{ channel, presentAltitude, target: SatisfactionSpirit }`. The target is the channel's satisfied spirit (fear→wonder, anger→triumph, sadness→poignance, joy→bliss, neutrality→peace) — or a translate target on another channel. |
| Capacity key | Per thread, **altitude-preserving**: `metabolize:<channel>` (dissatisfied→neutral), `transcend:<channel>-><spirit>` (neutral→satisfied), `translate:<from>-><to>` (cross-channel). No lossy collapse. |
| Blocker resolution | A blocker is a **route-hand** = the union of its threads' required moves. It clears only when **every** thread's capacity is owned. |
| Reuse, don't reinvent | Channels/spirits/roles come from `emotional-alchemy` (`EmotionChannel`, `SatisfactionSpirit`, `MoveRole`, `VECTOR_MOVE_FAMILIES`). Do not mint parallel enums. |
| Decomposition | `decomposeBlockerFromText` is **AI-drafted, player-ratified** (consistent with the crafting decision, 2026-07-12). The keyword→channel read (avoidance→fear, hard→anger) is a suggestion the player confirms/edits — never auto-committed. |
| Scope discipline | No renderer. No roll-up counter here (that is governed by the Calm↔Progress polarity map, separate). Keep the lib pure and tsx-testable. |

## Conceptual Model

| Dimension | This spec |
|-----------|-----------|
| **WHO** | The practitioner-player |
| **WHAT** | A blocker (weed) as a multi-channel signature; its capacity **route-hand** |
| **WHERE** | Clean Up (blockers are cleared by Clean Up); the emotional-alchemy channels & spirits |
| **Energy** | The charge held in each channel-thread |
| **Personal throughput** | Grow Up mints the route-hand quest; each thread's move is metabolize / translate / transcend |

**Worked example (the canonical test):** `"I keep avoiding the hard email"` →
`[ { channel:'fear', present:'dissatisfied', target:'wonder' }, { channel:'anger',
present:'dissatisfied', target:'triumph' } ]`. Route-hand ≈ `metabolize:fear` (name the
avoidance) → `transcend:fear->wonder`; `metabolize:anger` (identify the blocker) →
`transcend:anger->triumph`. The blocker clears only when both threads are demonstrated.

## API Contracts (API-First)

Types (extend `gate-confrontation.ts`; reuse alchemy enums):

```ts
type EmotionChannel = 'anger' | 'sadness' | 'fear' | 'joy' | 'neutrality'
type SatisfactionSpirit = 'triumph' | 'poignance' | 'wonder' | 'bliss' | 'peace'
type Altitude = 'dissatisfied' | 'neutral' | 'satisfied'
type MoveRole = 'metabolize' | 'translate' | 'transcend'

interface ChannelThread {
  channel: EmotionChannel
  presentAltitude: Altitude
  target: SatisfactionSpirit          // channel's satisfied form, or a translate target
}
type BlockerSignature = ChannelThread[]   // 1..N threads (was: a single vector)

/** The ordered moves one thread needs (metabolize → [translate] → transcend). Altitude-preserving. */
function threadRouteHand(thread: ChannelThread): CapacityKey[]

/** The full route-hand for a blocker = union of every thread's moves. */
function requiredRouteHand(sig: BlockerSignature): CapacityKey[]

/** Per-thread resolution; blocker resolves only when ALL threads resolve. */
function resolveBlocker(
  sig: BlockerSignature,
  owned: ReadonlySet<CapacityKey>,
  library: ReadonlySet<CapacityKey>,
): { resolved: boolean; threads: Array<{ thread: ChannelThread; path: 'task' | 'school' | 'craft' | 'quest' }> }

/** AI-drafted, player-ratified decomposition from the blocker's own language. */
function decomposeBlockerFromText(text: string): { draft: BlockerSignature; rationale: string }
```

- All except `decomposeBlockerFromText` are **pure** (no I/O). The AI decomposition is the
  one non-pure seam and is ratified by the player before use.

## Functional Requirements

- **FR1 — Multi-channel signature.** `BlockerSignature` is `ChannelThread[]` (1..N). A
  single-channel blocker is the N=1 case (backward-compatible in spirit).
- **FR2 — Altitude-preserving keys.** Capacity keys encode channel **and** the altitude
  edge / target spirit. There is **no** key that collapses distinct altitude climbs.
- **FR3 — Route-hand resolution.** A blocker resolves iff every thread's required capacity
  is owned. Owning one thread's capacity must **not** resolve a blocker with unmet threads.
- **FR4 — Reuse alchemy.** Channels, spirits, and the metabolize/translate/transcend roles
  reference `emotional-alchemy` / `VECTOR_MOVE_FAMILIES`; no parallel typology.
- **FR5 — Ratified decomposition.** `decomposeBlockerFromText` returns a draft + rationale;
  the player confirms/edits before it becomes a `BlockerSignature`.
- **FR6 — Downstream migration.** Update `demonstration.ts` (demonstrate per thread; a
  blocker completes when all threads pass) and `move-crafting.ts` (build a skeleton per
  thread) and their tests to the multi-channel shape.

## Non-Goals

- No renderer / UI (Claude Design, in parallel).
- No roll-up / progress counter (governed by the Calm↔Progress polarity map, separate).
- No new persistence yet — this stays a pure lib until a surface needs it.

## Verification

- **Regression (the bug):** construct a two-thread blocker; own **one** thread's capacity;
  assert the blocker is **not** resolved (`resolved: false`). This is the direct inverse of
  the current `gate-confrontation.test.ts:83-85`.
- **Altitude preserved:** `fear:dissatisfied→wonder` and `fear:neutral→wonder` yield
  **different** capacity keys / route steps (no collapse).
- **Canonical example:** `decomposeBlockerFromText("I keep avoiding the hard email")` →
  a fear thread (→wonder) + an anger thread (→triumph); the blocker resolves only when both
  threads' capacities are owned.
- **Determinism** of the pure functions (mirror existing ontology tests).
- **Real-user (n=1):** the practitioner-player runs a real blocker through the parallel
  Claude Design build and confirms the decomposition reads true and the route-hand is
  legible. This is the primary validation — the tests only guard the mechanics.

## Related

- Code under refactor: `src/lib/inner-garden/ontology/{gate-confrontation,demonstration,move-crafting}.ts`.
- Alchemy source: `src/lib/emotional-alchemy/*` (`SatisfactionSpirit`, `EmotionChannel`),
  `src/lib/alchemy/vector-move-families.ts` (`VECTOR_MOVE_FAMILIES`).
- Governing principle for any counter/progress choice: `docs/VALUES_AND_POLARITIES.md`
  § Worked polarity (Calm ↔ Progress).
- Master ontology: `docs/handoffs/2026-07-12-inner-garden-ontology-master.md`.
</content>
