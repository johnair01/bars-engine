# Inner Garden × BARS — Design Synthesis & Decision Memo

> **Status:** thinking doc (pre-spec). Written to reconcile the *Inner Garden × BARS
> Engine — Build Handoff* against what already exists in `bars-engine`, resolve the
> handoff's seven open design issues against canonical machinery, and isolate the
> few decisions that are genuinely yours to make before the next Claude Design pass.
>
> **Read the handoff first.** This memo assumes the handoff's spine (charge→seed,
> Task vs Quest, the 5 moves, deck = Show-Up cards, School = the mountain of
> altitudes, declare-your-read bonus). It does **not** re-argue that spine — the
> spine is good. It maps the spine onto code.

---

## 0. The one realization

**You are not building a rules engine. You are building a *register* over one that
mostly already exists.**

The handoff's build backlog ("Data model," "Rules engine," "Deck systems," "School,"
"Integration") reads as greenfield. It isn't. Three existing subsystems already
implement most of the spine as pure, typed, testable functions:

| Subsystem | Path | What it already is |
|---|---|---|
| **Charge metabolism** | `src/lib/charge-metabolism/` | present→desired charge vector → recommended Show-Up moves → a `MoveAttempt` lifecycle. This is your **rules engine for "metabolize a charge into aligned action."** |
| **Allyship deck** | `src/lib/allyship-deck/` | the canonical **card set**: 5 moves × 6 faces × 4 domains = 120 `MoveCard`s. This is your **deck.** |
| **Alchemy graph** | `src/lib/alchemy/` + `src/lib/emotional-alchemy/` | the emotion channels, altitudes, the metabolize→translate→transcend route grammar, the 10 Show-Up primitives, the 5 satisfaction spirits. This is your **outcome/altitude engine.** |

The garden (the walkable pixel farm) is a **thin rendering + interaction register**
over these. The handoff already says this ("the same objects as the dashboard/Vault,
in a walkable pixel-farm register") — this memo makes it literal by naming the types.

**Consequence for the next prototype:** don't spec a new data model or rules engine.
Spec the *mapping* (garden verb → existing function call) and the *gaps* (§5). That
is a dramatically smaller, safer build than the handoff implies.

---

## 1. The strategic fork you must resolve first

The handoff is written as if the Inner Garden is a fresh exploration. **It is not the
only one.** There are already two in-flight efforts, and they are not the same game:

**Effort A — the existing Shaman canvas bridge (in `main`, partly shipped).**
- A working canvas-2D pixel-farm game lives at `public/inner-garden-game/`
  ("Taoist cultivation, Rune-Factory-style"). Grid/input movement, **no A\***.
- A production bridge already wires it to the OS layer:
  `src/lib/inner-garden/bridge.ts`, `src/actions/inner-garden.ts`,
  `src/app/inner-garden/*` (including an iframe `postMessage` bridge in
  `InnerGardenPlayClient.tsx`).
- Design authority: `.specify/specs/six-guide-calrunia-orientation/`
  (esp. `INNER_GARDEN_IMPLEMENTATION_RESEARCH.md`, `PIXI_TO_INNER_GARDEN_BRIDGE_DECISION.md`).
- Scope today: **Shaman face only.** Charge BAR → seed → cultivate → harvest insight →
  write back to `CustomBar.seedMetabolization`. Tasks T23–T29 marked done.

**Effort B — your new handoff.** Mobile-first, A\* pathfinding, personal + community
farms joined by a gate, WAVE micro-ritual for Open Up, the full 5-move loop, the
School as the mountain, declare-your-read. Broader and more resolved than Effort A,
but at the throwaway-HTML-prototype stage.

**These overlap ~70% in domain and ~20% in surface.** Same objects (charge→seed→fruit→card,
6 faces = altitudes, plant/water/harvest), different renderer and much wider scope in B.

**→ DECISION 1 (yours): does B extend A, or replace A?** Three honest options:

- **Extend A** — keep the canvas game, grow it from Shaman-only to all 5 moves + School.
  Cheapest to ship, but the canvas prototype has no A\*, no community farm, no mobile
  posture; you'd be retrofitting B's feel onto A's engine.
- **Replace A's renderer, keep A's bridge** *(recommended)* — treat `src/lib/inner-garden/bridge.ts`
  + `CustomBar` write-seams as the contract-of-record, throw away the canvas renderer,
  and let Claude Design build B's mobile pixel-farm against the **same bridge payloads**.
  You inherit the hard-won integration and lose nothing but throwaway rendering.
- **Clean-sheet** — new bridge, new everything. Only if A's bridge contract is wrong,
  which §7 argues it isn't.

The rest of this memo assumes **"replace renderer, keep bridge + OS vocabularies."**

---

## 2. The spine, mapped to canonical types

This table is the point of the memo. Every handoff noun already has a home. Build the
garden against these; do not mint parallel vocabularies.

| Handoff concept | Existing canonical type | Where |
|---|---|---|
| **Charge / Seed (= BAR w/ provenance)** | `CustomBar` (type `charge_capture`/`bar`; fields `intensity`, `dissatisfaction`, `satisfaction`, `nation`/element, `gameMasterFace`, `hexagramId`, `seedMetabolization`, `gardenId`, `sourceBarId`, `source321SessionId`) | `prisma/schema.prisma:298` |
| **The charge's "reading" (present→desired)** | `AlchemyState = { channel, altitude }`, a vector is `from→to` | `src/lib/alchemy/alchemy-graph.ts:17` |
| **Element** | `EmotionChannel = anger\|sadness\|fear\|joy\|neutrality` ↔ wuxing `fire\|water\|metal\|earth\|wood` | `emotional-alchemy/types.ts:25`; `ELEMENT_TO_EMOTION` in `inner-garden/bridge.ts:85` |
| **Altitude (the glow: dissatisfied→neutral→satisfied)** | `AlchemyAltitude = dissatisfied\|neutral\|satisfied` | `alchemy/types.ts:4` |
| **The 5 moves (Wake/Open/Clean/Grow/Show)** | `BasicMove` / `PersonalMoveType` / `VectorMovePracticeLens` (all 5, incl. Open Up) | `allyship-deck/types.ts:10`; `quest-grammar/types.ts:129`; `alchemy/vector-move-families.ts:40` |
| **The deck = Show-Up moves as cards** | `MoveCard` (5 moves × 6 faces × 4 domains = 120) | `allyship-deck/types.ts:40` |
| **A single Show-Up move (the "true water")** | `ShowUpPrimitive` (10 of them) → rendered as `TranslatedShowUpMove` | `alchemy/show-up-primitives.ts:35` |
| **The route hand (metabolize→translate→transcend)** | `VECTOR_MOVE_FAMILIES` grid; `MoveRole = metabolize\|translate\|transcend` | `alchemy/vector-move-families.ts:85` |
| **Quest requirement (mode + amount) / "required mode"** | the `mechanicOperation` / face a `VectorMoveFamily` prefers, surfaced by the recommender | `charge-metabolism/recommendation-service.ts:101` |
| **Playing the card / completing the quest** | `MoveAttempt` lifecycle: `recommended→chosen→practiced→reflected→completed` | `charge-metabolism/types.ts:73` |
| **Fruit (type + quality)** | `OutputBar = awareness\|experience\|insight\|wisdom\|artifact` (type) × `AlchemyAltitude` (quality) | `allyship-deck/types.ts:32` |
| **The 5 metabolized feelings** | `SatisfactionSpirit = peace\|triumph\|poignance\|bliss\|wonder` (one per channel) | `emotional-alchemy/types.ts:27` |
| **The School = the mountain; 6 GM faces = 6 altitudes** | `GameMasterFace = shaman\|challenger\|regent\|architect\|diplomat\|sage`; the deck's `Operation` axis | `quest-grammar/types.ts:264`; `allyship-deck/types.ts:12` |
| **Weed / Blocker; Clean Up** | `blockerText` on a `MoveAttempt`; the 3·2·1 / Shadow flow; the 10 "Myths Read" shadow cards | `charge-metabolism/types.ts`; `.specify/specs/myths-read-diagnostic/`, `clean-up-technique-system/` |
| **Lens / Field** | `Lens` (+ `LensGoal`) | `prisma/schema.prisma:707` |
| **Campaign / Community farm** | `Campaign`/`campaignRef`, `Instance` membership, `SpokeMoveBed`, `CollaborationBoard`, `plantBarOnSpoke` | `src/lib/spatial-world/*`, `src/actions/plant-bar-on-spoke.ts` |
| **Daily hand-limit (card economy C)** | `HandSlot` (the carried-BAR "Hand") + the once/day watering rhythm | `prisma/schema.prisma:484` |
| **Identity = cultivator (Nation × Archetype)** | `Archetype` (8 canonical) × `Nation`; avatar system | `canonical-archetypes.ts:7`, `schema.prisma:1737` |
| **Vault (owns truth)** | a *view* over `CustomBar` (not a table); rooms filter by type/status | `src/lib/vault-queries.ts`, `vault-ui.ts` |

---

## 3. The seven open questions — resolved against machinery

For each: **the answer the code already implies**, then **the residual decision that's
genuinely still open.**

### Q1 — Task ↔ Quest detection, and how "required mode" is derived
**Code answer.** `recommendChargeMetabolismMove()` already takes present + desired
(+ optional blocker) and returns either a **single-card** move you can play now, or a
**route hand** (metabolize → translate → transcend) whose cards demand a specific
`mechanicOperation`/face. That *is* the Task↔Quest split, and it *does* surface at
action-time exactly as the handoff wants:

- **Task** = the recommender returns a `role: 'single'` move whose primitive is already
  in your repertoire (you own a card that covers the edge). Clear done-state, no arc.
- **Quest** = the recommender returns a multi-card route, or a card whose required
  face/altitude you don't yet hold → "you can't fake it" → go learn/craft it.
- **"Required mode" is derived from the vector**, not declared: it's the
  `VectorMoveFamily.mechanicOperation` for the edge from present→desired channel/altitude.
  The blocker doesn't change the vector (present→desired stays the charge's own arc);
  the blocker only *modifies which card* and *points at where the work is* (see the
  charge-metabolism spec, "Product Correction: Guided Dissatisfaction Intake").

**Residual decision.** What's the numeric/UX threshold that flips "single" → "quest"
in the garden? (e.g. route length ≥ 2, or "required face ∉ owned faces," or altitude
gap ≥ 2). Recommend: **quest iff the route needs a card whose face you have not learned
at the School** — that's what makes the card-gate meaningful and ties Task↔Quest to
the School progression rather than to an arbitrary counter.

### Q2 — Move-crafting spec ("well-formatted move," and "skill makes it faster")
**Code answer.** A "well-formatted move" already has a schema: it's a `MoveCard`
(`move × operation × domain × outputBar` + `submovePrompt`/`action`/`failureModes`)
or, at the atomic level, a `ShowUpPrimitive`. Player-authored cards already have a
home in the canonical **move-library tiers** — the lowest tier is literally
"player-named or daemon-generated candidate moves" (charge-metabolism spec §Move Library).
So crafting = authoring a candidate `MoveCard` that names its face + domain + the
translated instruction, entering the library as an unpromoted tier.

**"Skill makes it faster" is measurable** with existing fields: a `ShowUpPrimitive`
carries `vectorTypes` (which edges it can cover). If you already own a primitive whose
`vectorTypes` cover the needed edge, crafting is a **re-skin** of an owned move (fast);
if not, you must **school** the new primitive first (slow). Speed = 1 − (owned
primitives covering this edge / primitives required).

**Residual decision.** Is a crafted card *permanent repertoire* (like a schooled card,
economy C) or *single-use* (spent to resolve this one quest)? Recommend permanent, so
"crafting from lived experience" and "schooling" are two doors to the same shelf — the
handoff's "if you already have the skill, crafting beats schooling" only pays off if
both yield permanent cards.

### Q3 — School lessons (what a lesson *is*, prerequisites, what "learned" grants)
**Code answer.** A lesson is a **CYOA teaching scene** — the repo has deep CYOA/Twine
machinery (`quest-grammar/*`, `growth-scene-generator`, `face-moves/`,
`gm-face-stage-moves.ts`) and the six faces already have authored move-teaching content.
"Learned" = a `ShowUpPrimitive`/face-operation is added to your repertoire (unlocks the
`MoveCard`s at that face). **Prerequisites already exist**: the developmental face order
(Shaman→Challenger→Regent→Architect→Diplomat→Sage) and `SAGE_RESOLVABLE_FACES`
(`npc-face-resolver.ts:66`) — Sage is the summit meta-face that resolves to whichever
of the five you most need.

**Residual decision.** Strict ladder vs soft gate — must you clear Shaman before
Challenger, or can you climb out of order with a penalty? The handoff says
"developmental order = prerequisites" (strict). Recommend strict for the first build;
it makes the mountain legible.

### Q4 — Altitude ↔ outcome (which fruits a harvest can yield)
**Code answer.** This is fully determined already. **Fruit type = `OutputBar`**
(awareness/experience/insight/wisdom/artifact) — each `MoveCard` declares the `outputBar`
it produces. **Fruit quality = `AlchemyAltitude`** (dissatisfied→neutral→satisfied) —
the same three-step glow the handoff names. A harvest that lands at **satisfied**
altitude yields the channel's **`SatisfactionSpirit`** (peace/triumph/poignance/bliss/
wonder) as its ripe fruit; neutral yields the channel's neutral resource; dissatisfied
yields compost/roadblock material. **Altitude constrains fruit because the card you're
allowed to play is gated by the face/altitude you've learned** — you can't harvest a
satisfied Spirit with a move you haven't climbed to.

**Residual decision.** None material — this is the strongest-specced of the seven.
Only choose the visual mapping (which pixel fruit art = which OutputBar × altitude).

### Q5 — Open Up payoff
**Code answer.** Already specced (`.specify/specs/fifth-move-open-up/`): Open Up is the
**receptive phase after Wake, before Clean**, mapped to the `Gather Resource` domain,
kept **independent of elements**. Its practice role is `processing` (a preparation),
not `action`. In garden terms this is exactly the handoff's "open the bed" WAVE
micro-ritual.

**Residual decision (the one the handoff flags as unresolved).** Payoff shape:
(a) a multiplier on the *next* Show Up water, (b) a gate that unlocks *community*
watering, or (c) both. Recommend **(a) for solo now, (b) deferred to the community
milestone** — keep Open Up light until BARS resolves the move, as the handoff says.

### Q6 — Community / social model
**Code answer.** The community layer already exists as OS objects: `Campaign`/
`campaignRef` (a personal Lens "graduates" by acquiring a `campaignRef`), `Instance`
membership + roles, `SpokeMoveBed` (a planted bed), `plantBarOnSpoke` / `plantKernelFromBar`
(co-watering = adding a kernel to a neighbor's bed), `CollaborationBoard` (the community
farm view). Roles map to the existing access model: **visitor = Public Supporter,
contributor = Logged-in Player, steward = Steward.** Identity = cultivator name =
Nation × Archetype avatar (shared between OS identity card and game).

**Residual decision.** Propagation rule: the handoff wants "seeds can propagate to a
neighbor's garden then move home." That's a new movement on top of `plantBarOnSpoke`
(which today plants *into a campaign*, not *into another player's personal garden*).
Decide whether personal-garden-to-personal-garden propagation is v1 or deferred to the
campaign layer. Recommend **defer**: ship community-via-campaign first (it's built),
add neighbor-garden propagation later.

### Q7 — Dashboard/Vault integration (who owns truth)
**Code answer.** **The OS layer owns truth. The garden is a projection + write-seams.**
This is already true and shipped: the Vault is a *view* over `CustomBar`; the garden
borrows a BAR, processes it, and writes back through named seams —
`writePlantTriadToBar()` (`src/lib/garden/plant.ts`) sets `gardenId`, the EA triad
(`experienceIntent`/`dissatisfaction`/`satisfaction`) and matures the seed;
`buildShamanResultSeedMetabolization()` (`inner-garden/bridge.ts:165`) writes the
harvest back to `seedMetabolization`. The garden never becomes a second source of truth.

**Residual decision.** Only whether garden play may **mint** new `CustomBar`s (e.g. a
crafted-card quest that produces a new BAR) or may only **mutate** borrowed ones. The
core-game-loop-audit spec's H1 already set the precedent — mint **only on a deliberate
gesture** (keep/plant/upgrade), never on every action, to avoid Vault flooding. Adopt
the same rule for the garden.

---

## 4. Where the existing design work stops (real gaps to design)

Everything in §3 leans on shipped or specced machinery. These are the parts that are
genuinely under-designed and are where the next Claude Design pass adds value:

1. **The declare-your-read *bonus* as a first-class mechanic.** The recommender has an
   "ask, don't infer" flow (`missingFields` → `nextQuestion`) and a `selectPracticeLens()`
   router, but there is **no reward for the player correctly pre-naming the move** before
   the system reveals it. The handoff's core allyship-training idea — *choosing the mode
   IS the skill* — is not yet a modeled bonus. **Design: a "declare → compare → reward"
   loop** (right read = deeper water / riper fruit; wrong = data, not failure).
2. **The garden as a spatial register.** Field=Lens, seed=BAR, weed=blocker, gate=campaign
   boundary — the *mapping* exists conceptually but there's no spatial layer that renders
   OS state as walkable tiles across all 5 moves (only the Shaman canvas does, partially).
3. **Task↔Quest *surfacing at action-time* as UX.** The recommender computes it; the
   garden must *stage* it — you swing to water, the game checks your repertoire, and the
   quest reveals itself in the swing. This "surface on act" choreography is new.
4. **The School as a climbable place** (vs. a menu). Face content exists; the mountain
   as a navigable, prerequisite-gated space does not.
5. **Move-crafting flow** (Q2) — the *schema* exists (a candidate `MoveCard`); the
   authoring *flow* and the "skill makes it faster" feedback do not.
6. **Myth→shadow-card→weed injection.** The 10 myths exist as a diagnostic; wiring them
   as weeds that clog the hand until Cleaned is unbuilt.

---

## 5. Architecture recommendation (reconciling the handoff's)

The handoff's architecture instinct is right and matches the codebase's own ethos
(Deftness: "deterministic over AI," pure rules engine, thin render):

- **Source of truth = the existing OS libs.** `charge-metabolism` (rules engine),
  `allyship-deck` (content), `alchemy`/`emotional-alchemy` (outcome grammar),
  `CustomBar`/`Lens`/`Campaign` (persistence). **Do not rebuild these.**
- **Contract layer = `src/lib/inner-garden/bridge.ts`.** Extend the existing payloads
  from Shaman-only to all 5 moves + School events. Keep the `bars-inner-garden.v1` /
  `inner-garden-bars.v1` schema-version discipline (bump to `.v2`).
- **Rendering layer = the new mobile pixel-farm** (Claude Design's job). It is a
  *client* of the bridge. It holds **no truth** — every plant/water/harvest/learn is a
  bridge call that lands in a `MoveAttempt` + a `CustomBar` mutation.
- **Kill the throwaway HTML prototypes and the canvas renderer** (Effort A) **once the
  bridge is proven against the new renderer** — but only then, and keep the bridge.

Net: the handoff's "typed data model + deterministic rules engine as source of truth,
thin render on top, sync/adapter layer" is **already 70% built.** The next prototype
should be scoped as *"a mobile pixel-farm client of the existing bridge, plus the six
gaps in §4"* — not as a from-scratch systems build.

---

## 6. Decisions that are yours (consolidated)

Nothing below can be answered from the code — these need you before the Design pass:

1. **D1 — Extend Effort A, replace its renderer (keep bridge), or clean-sheet?**
   (§1). *Memo recommends: replace renderer, keep bridge.*
2. **D2 — Task→Quest threshold:** route-length counter vs "required face not yet learned."
   *Recommends: unlearned-face gate.*
3. **D3 — Crafted cards permanent or single-use?** *Recommends: permanent.*
4. **D4 — School ladder strict or soft?** *Recommends: strict for v1.*
5. **D5 — Open Up payoff:** next-water multiplier, community gate, or both.
   *Recommends: multiplier now, community gate later.*
6. **D6 — Neighbor-garden seed propagation in v1, or campaign-only community first?**
   *Recommends: campaign-only first.*
7. **D7 — May the garden mint new BARs, or only mutate borrowed ones?**
   *Recommends: mint only on deliberate keep/plant/upgrade (per core-loop-audit H1).*

---

## 7. Suggested next artifact (for the Claude Design pass)

Hand Claude Design a **"bridge-client brief,"** not a systems spec:

1. §2's mapping table (garden noun → existing type) as the vocabulary contract.
2. The extended `inner-garden/bridge.ts` payloads (5 moves + School), with the
   `MoveAttempt` lifecycle as the resolution model.
3. The six gaps in §4 as the *only* net-new design surface, declare-your-read first.
4. Your answers to D1–D7.

That brief is small, safe, and honest about what's already built — which is the whole
point.

---

### Appendix — evidence trail
- Existing garden effort: `public/inner-garden-game/`, `src/lib/inner-garden/bridge.ts`,
  `src/actions/inner-garden.ts`, `src/app/inner-garden/*`,
  `.specify/specs/six-guide-calrunia-orientation/INNER_GARDEN_IMPLEMENTATION_RESEARCH.md`.
- Rules engine: `src/lib/charge-metabolism/recommendation-service.ts`,
  `.specify/specs/charge-metabolism-move-attempts/spec.md`.
- Deck: `src/lib/allyship-deck/types.ts` + `move-library.ts` + `assemble.ts`.
- Alchemy grammar: `src/lib/alchemy/{show-up-primitives,vector-move-families,alchemy-graph}.ts`,
  `src/lib/emotional-alchemy/{types,vector,registry}.ts`.
- Faces/altitude: `src/lib/quest-grammar/types.ts`, `src/lib/npc-face-resolver.ts`.
- OS layer: `prisma/schema.prisma` (`CustomBar`, `Lens`, `HandSlot`, `Archetype`),
  `src/lib/vault-queries.ts`, `src/lib/garden/plant.ts`.
- Related specs: `core-game-loop-audit`, `game-loop-charge-quest-campaign`,
  `fifth-move-open-up`, `myths-read-diagnostic`, `clean-up-technique-system`,
  `bar-seed-metabolization`.
</content>
</invoke>
