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

## Action-economy context (two pressures)

The inferred blocker is **one half of an action economy** that keeps the garden honest for two
opposite player archetypes. Both pressures teach the same lesson — *act on your seeds, don't
just accumulate*:

- **Pressure 1 — Overcrowding → composting** (the over-planter / ADHD register): a farm has
  finite fertile capacity; planting faster than you act crowds it and drops fertility, which
  pressures the player to get good at **composting**. *This is a farm-level fertility mechanic
  and is OUT OF SCOPE here — it belongs in a sibling spec (Action Economy / Farm Fertility).*
- **Pressure 2 — Stagnation → inferred blocker** (the under-actor / perfectionist register):
  even a tidy garden is overrun within a week by the Daily Charge + Tap the Vein inflow if
  nothing is actioned; at **3 days** un-actioned, the garden gently infers a blocker (there may
  be inner work here). **This spec covers Pressure 2 only.**

## Design Decisions

| Topic | Decision |
|-------|----------|
| Blocker is OPTIONAL | A blocker is **not** a mandatory gate. A player may take action on a seed **without** one. A blocker exists only when it is **self-reported** (the player names that there is inner work to do) or **inferred** (the system assumes one when a *planted* seed goes un-actioned past a stagnation window). |
| Stagnation window | **3 days** of no action on a planted seed → an **inferred** blocker (rationale: the daily inflow from Daily Charge + Tap the Vein overruns a passive garden within a week, so 3 days is the humane nudge point). **Player-overridable** — a player may set their own reminder cadence, which replaces the 3-day default. |
| Blocker shape | A **set of channel-threads** (1..N), not a single `from→to` vector. |
| Thread shape | `{ channel, presentAltitude, target: SatisfactionSpirit }`. The target spirit is **aspirational** (fear→wonder, anger→triumph, sadness→poignance, joy→bliss, neutrality→peace) — or a translate target on another channel. |
| Target altitude | **Neutral resolves the thread.** dissatisfied→neutral (metabolize) is real progress and yields **insight**; the player need not reach the spirit. The **spirit is optional stretch depth** (neutral→satisfied = transcend) that additionally yields the channel's **satisfaction fruit**. |
| Thread count | **Player-self-reported**, at most one thread per channel → **≤ 5 threads**. Max threat spread = all 5 channels dissatisfied → satisfied. No artificial cap below 5 — sometimes there genuinely are that many. |
| Capacity key | Per thread, **altitude-preserving**: `metabolize:<channel>` (dissatisfied→neutral), `transcend:<channel>-><spirit>` (neutral→satisfied), `translate:<from>-><to>` (cross-channel). No lossy collapse. |
| Blocker resolution | A blocker is a **route-hand** = its threads' moves. Each reported thread **resolves at neutral** (metabolize done); the blocker **fully clears when all reported threads reach ≥ neutral**. Per-thread progress yields insight regardless of full clearance; reaching a spirit is optional depth. Owning one thread's capacity must **not** resolve a blocker whose other threads are unmet. |
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
avoidance) → *optional* `transcend:fear->wonder`; `metabolize:anger` (identify the blocker)
→ *optional* `transcend:anger->triumph`. The blocker clears when **both threads reach ≥
neutral** (both metabolize steps done — insight gained); reaching wonder/triumph is optional
depth that yields the satisfaction fruit.

**Optionality:** the player could also just *act* on this seed with no blocker at all. The
blocker above exists only because they self-reported "there's inner work here," or because
the planted seed sat un-actioned and the system inferred one.

## API Contracts (API-First)

Types (extend `gate-confrontation.ts`; reuse alchemy enums):

```ts
type EmotionChannel = 'anger' | 'sadness' | 'fear' | 'joy' | 'neutrality'
type SatisfactionSpirit = 'triumph' | 'poignance' | 'wonder' | 'bliss' | 'peace'
type Altitude = 'dissatisfied' | 'neutral' | 'satisfied'
type MoveRole = 'metabolize' | 'translate' | 'transcend'

type BlockerOrigin = 'self_reported' | 'inferred'

interface ChannelThread {
  channel: EmotionChannel
  presentAltitude: Altitude
  target: SatisfactionSpirit          // ASPIRATIONAL spirit; neutral suffices to resolve
}
type BlockerSignature = ChannelThread[]   // 1..5 threads (≤ one per channel)

interface Blocker {
  origin: BlockerOrigin
  threads: BlockerSignature
}

/** A thread's moves, split into what's REQUIRED to resolve (reach neutral) vs OPTIONAL depth. */
function threadRouteHand(thread: ChannelThread): { required: CapacityKey[]; optional: CapacityKey[] }

/** Every thread's REQUIRED (to-neutral) moves — the hand that clears the blocker. */
function requiredRouteHand(threads: BlockerSignature): CapacityKey[]

/**
 * Per-thread resolution. A thread resolves when its REQUIRED (metabolize-to-neutral) capacity
 * is owned; the blocker resolves only when EVERY thread does. Reaching a spirit is optional.
 */
function resolveBlocker(
  threads: BlockerSignature,
  owned: ReadonlySet<CapacityKey>,
  library: ReadonlySet<CapacityKey>,
): {
  resolved: boolean
  threads: Array<{
    thread: ChannelThread
    reachedNeutral: boolean          // required step owned
    reachedSpirit: boolean           // optional depth owned
    path: 'task' | 'school' | 'craft' | 'quest'
  }>
}

/** AI-drafted, player-ratified decomposition from the blocker's own language (≤ 5 threads). */
function decomposeBlockerFromText(text: string): { draft: BlockerSignature; rationale: string }

/**
 * Inferred blocker on a planted seed gone un-actioned. Null if within the window.
 * `windowDays` defaults to 3; a player's own reminder cadence overrides it.
 */
function inferBlockerForStagnantSeed(
  seed: { plantedChannel: EmotionChannel; daysSinceAction: number },
  windowDays?: number,   // default 3; player cadence overrides
): Blocker | null
```

- A seed with **no** blocker is directly actionable — action needs no blocker.
- All except `decomposeBlockerFromText` are **pure** (no I/O). The AI decomposition is the one
  non-pure seam and is ratified by the player before use; `inferBlockerForStagnantSeed` is pure
  given the stagnation window.

## Functional Requirements

- **FR1 — Multi-channel signature.** `BlockerSignature` is `ChannelThread[]` (1..N). A
  single-channel blocker is the N=1 case (backward-compatible in spirit).
- **FR2 — Altitude-preserving keys.** Capacity keys encode channel **and** the altitude
  edge / target spirit. There is **no** key that collapses distinct altitude climbs.
- **FR3 — Route-hand resolution at neutral.** A thread resolves when its **required
  (metabolize-to-neutral)** capacity is owned; the blocker resolves iff **every** thread
  does. Owning one thread's capacity must **not** resolve a blocker with unmet threads.
- **FR4 — Reuse alchemy.** Channels, spirits, and the metabolize/translate/transcend roles
  reference `emotional-alchemy` / `VECTOR_MOVE_FAMILIES`; no parallel typology.
- **FR5 — Ratified decomposition.** `decomposeBlockerFromText` returns a draft + rationale;
  the player confirms/edits (thread count is theirs) before it becomes a `BlockerSignature`.
- **FR6 — Downstream migration.** Update `demonstration.ts` (demonstrate per thread; a
  blocker completes when all threads reach ≥ neutral) and `move-crafting.ts` (skeleton per
  thread) and their tests to the multi-channel shape.
- **FR7 — Blockers are optional.** A seed may be actioned with no blocker. The gate/quest
  path engages **only** when a blocker is present (self-reported or inferred).
- **FR8 — Neutral suffices; spirit is optional.** Reaching neutral resolves a thread and
  yields insight. The transcend-to-spirit step is optional depth that additionally yields the
  channel's satisfaction fruit; it is never required to clear a blocker.
- **FR9 — Player-reported thread count.** ≤ 5 threads (one per channel). The player is the
  authority on how many channels are live; no system cap below 5.
- **FR10 — Inferred blocker.** A planted seed left un-actioned past the stagnation window
  (**default 3 days; player cadence overrides**) may be assigned an **inferred** blocker
  (surfaced gently — "looks like there may be inner work here?"), which the player can
  confirm/edit or dismiss by simply acting.

## Non-Goals

- No renderer / UI (Claude Design, in parallel).
- No roll-up / progress counter (governed by the Calm↔Progress polarity map, separate).
- No new persistence yet — this stays a pure lib until a surface needs it.
- **No farm fertility / overcrowding mechanic** (Pressure 1) — that is the sibling *Action
  Economy / Farm Fertility* spec. This spec covers only the stagnation → inferred-blocker half.

## Verification

- **Regression (the bug):** construct a two-thread blocker; own **one** thread's required
  capacity; assert the blocker is **not** resolved (`resolved: false`). Direct inverse of the
  current `gate-confrontation.test.ts:83-85`.
- **Altitude preserved:** `fear:dissatisfied→wonder` and `fear:neutral→wonder` yield
  **different** capacity keys / route steps (no collapse).
- **Neutral suffices:** owning only a thread's **metabolize** (to-neutral) capacity resolves
  that thread (`reachedNeutral: true`, `reachedSpirit: false`) and the blocker clears if it's
  the only thread — reaching the spirit is not required.
- **Optionality:** a seed with **no** blocker is directly actionable (no gate); the gate path
  engages only when a blocker is present.
- **Inferred blocker + window:** `inferBlockerForStagnantSeed` returns `null` at
  `daysSinceAction: 2` and an `origin:'inferred'` blocker at `3` (default window); a custom
  `windowDays` shifts the boundary.
- **Canonical example:** `decomposeBlockerFromText("I keep avoiding the hard email")` →
  a fear thread (→wonder) + an anger thread (→triumph); the blocker clears when both reach
  neutral (both metabolize steps owned).
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
