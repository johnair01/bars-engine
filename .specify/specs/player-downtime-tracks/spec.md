# Spec: Player downtime tracks (life-bandwidth between sessions)

## Purpose

Let players **allocate attention across life domains** between sessions (inspired by table-RPG “downtime” pacing): **multiple tracks** possible, **escalating difficulty** when juggling, **clear outcomes** without simulating every die roll in v0.

**Problem:** Long campaigns need **stakes and pacing** between major beats; character “life outside the quest” is easy to lose.

**Practice:** Deftness Development — spec kit first; **start with tags + escalation**, not a full DC engine unless product asks for dice.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Source inspiration | **Fantasy High Junior Year**-style downtime interpretation (community notes: *Downtime Observations* by Jack1Spade; GM: Brennan Lee Mulligan). **Not** a claim of official rules — **pattern port**. |
| v0 scope | **Named tracks** + **how many active this cycle** + **outcome band** (bare / OK / great / standout) — optional numeric DC later. |
| Relation to BARs | Each **track activation** can emit or attach to a **BAR** or **quest step** — reuse existing quest/BAR completion. |
| Time unit | **One downtime cycle** = one **in-game day** or one **calendar week** — **instance-configurable** (default: weekly). |
| Quadrants (AQAL) | Tracks map loosely to **I / We / It / Its** for copy and reporting — not shown as academic labels to players. |

## Conceptual Model

**Tracks (v0 set — editable per instance):**

| Track | Intent (player-facing) | Quadrant lean |
|-------|------------------------|---------------|
| Academics / craft | Focused learning or skill practice | It |
| Extra-curriculars | Clubs, arts, sports, responsibility | We / Its |
| Money / resources | Jobs, gigs, stability | It |
| Mystery / investigation | Open threads, research | Its |
| Popularity / reputation | How you’re known | We |
| Relationships | Care for specific people | I / We |
| Relaxation | Rest, recovery, boundaries | I |

**Escalation:** Activating **n** tracks in one cycle increases **difficulty or cost** (FH pattern: +5 DC per track after the first). In BARs v0: **+1 “strain”** or **+1 vibeulon cost** per extra track — **exact mechanic in tasks**.

**Rewards:** Track-specific **narrative outcomes** + optional **ledger** (vibeulons, unlocks) — tie to **FR** in tasks.

## API Contracts (API-First)

### submitDowntimeCycle

**Input:**

```ts
type DowntimeCycleSubmit = {
  playerId: string
  instanceId?: string
  cycleId: string // e.g. ISO week id or instance period
  activeTrackIds: string[] // subset of catalog
  notes?: string // optional player reflection
}
```

**Output:** `{ outcomes: TrackOutcome[]; strainApplied: number } | { error: string }`

- **Server Action**: validates membership, applies escalation rules, persists state.

### getDowntimeBoard

**Input:** `{ playerId: string; instanceId?: string }`  
**Output:** `{ currentCycle: DowntimeCycleState; catalog: TrackDefinition[] }`

## User Stories

### P1: Choose tracks

**As a player**, I want to **pick which life areas I’m investing in this cycle**, so the game reflects my **bandwidth limits**.

**Acceptance:** Cannot select unlimited tracks without **escalation** feedback.

### P2: See outcomes

**As a player**, I want **readable outcomes** (not raw DC), so I know how the week went.

**Acceptance:** At least three outcome bands with **flavor text** per track category.

### P3: Steward visibility (optional v0.1)

**As a campaign steward**, I want to **see aggregate downtime choices** (privacy-safe), so I can tune difficulty.

**Acceptance:** Opt-in or aggregate only — no PII in v0.

## Functional Requirements

- **FR1**: Catalog of **tracks** (config JSON on `Instance` or `AppConfig` slice) with id, label, description, quadrant tag.
- **FR2**: **Cycle** record per player: which tracks active, escalation tier, outcome band.
- **FR3**: **Escalation** when `activeTrackIds.length > 1` per spec decision.
- **FR4**: Hook: completing a cycle can **mint a BAR** or **progress a quest** (integration point with polarity engine optional).

## Non-Functional Requirements

- **Privacy:** Default **player-private**; campaign reports **aggregated**.
- **Performance:** Board load &lt; 200ms from cached catalog.

## Persisted data & Prisma

Likely new model **`PlayerDowntimeCycle`** or JSON on **`Player`** — **tasks.md** must include migration if tables added.

## Verification Quest

- **ID**: `cert-player-downtime-tracks-v1`
- **Steps**: Open downtime board → select 2+ tracks → submit → see strain + outcomes → (optional) BAR created.

## Dependencies

- `Player`, `Instance`, optional **campaign hub** for surfacing the board
- Optional synergy: [polarity-engine-v0](./polarity-engine-v0/spec.md) (spin persists across cycles)

## References

- *Downtime Observations* (PDF notes — FH Junior Year style; ingested for pattern only)
- [.specify/memory/conceptual-model.md](../../memory/conceptual-model.md)
