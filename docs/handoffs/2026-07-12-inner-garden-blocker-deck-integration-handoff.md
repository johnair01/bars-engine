# Handoff: Inner Garden — Blocker & Deck Integration (C2)

> **Why this exists.** Two parallel efforts built two different blocker/deck models:
> - **Our ontology track** — a capacity economy: multi-channel blockers → route-hands →
>   demonstration-earned capacities → crafting (`src/lib/inner-garden/ontology/*`, tested).
> - **Claude Design's playable layer** — a Dominion-style **draw deck** of moves + **myth
>   shadow-cards** cleared by a **Clean Up exercise**; meeting a charge is a **mirror, never a
>   grade** (`design_handoff_inner_garden/` — Play the Card, Inner Garden Deck).
>
> The reconciliation (C2) ruled: **integrate, don't pick.** This handoff is that integration —
> the merge design for both sides. It also resolves the two dependent items C1/C3/C4 pushed
> here: **where Scope lives**, **the draw-reliability meta-skill**, and **which completions
> have teeth**.

---

## 1. The core resolution: two tiers of one loop

The two models are not competitors — they are **two registers of friction**, and each model
is right for its tier. The bridge between them is the gate resolution we already built
(`own → Task · card-exists → School · none → Craft`).

### Tier 1 — Everyday deck play (Claude Design's model · Calm / mirror register)
- Your **deck = the moves you own** (your capacities). Each day you **draw a hand** (limited),
  discard, reshuffle — Dominion economy over an **owned** deck.
- **Myths** (the 10 from *Myths Read*) ride as **shadow cards** that clog the hand.
- You meet a *ready seed* by **playing a drawn move** → it opens an **exercise**
  (Show Up: rehearse → enact; Clean Up: meet → question → turn; Wake Up: capture). **Completing
  the exercise applies the move — no pass/fail, outcomes are mirrors.**
- This is the **95% daily experience.** It grows nothing new; it *uses* your deck.

### Tier 2 — Deep inner work (our capacity economy · Progress / teeth register)
- Engages **only** when a blocker is **self-reported** as real inner work, or **inferred**
  (a planted seed stagnant past the 3-day window), *and* it exceeds a single Clean Up —
  **multi-channel**, or **needs a capacity you don't own**.
- It becomes a **gate confrontation**: the blocker's **route-hand** (metabolize/translate/
  transcend, altitude-preserving) is the quest. You **earn a new capacity** by
  **demonstration (teeth)** — via the **School** (learn an existing card) or **Craft** (forge a
  new one, grammatical-by-construction). This is the **occasional, deliberate deepening.**

### The bridge (already built as `resolveBlocker` / `resolveGatePath`)
```
meet a charge / hit a blocker
  → own the needed move?  YES → Tier 1: play it (mirror exercise)
                          NO  → Tier 2: gate confrontation → earn the capacity (teeth)
                                        → the earned capacity ENTERS your deck
                                        → future encounters of that class are Tier 1
```
Tier 2's output *is* Tier 1's input. The elaborate machinery earns its place by living only at
Tier 2 — which is exactly the "deep end" framing, and answers the overbuild critique.

---

## 2. Myths vs. multi-channel blockers (who handles what)

| | **Myth** (Tier 1) | **Multi-channel blocker** (Tier 2) |
|---|---|---|
| What | one of 10 pre-authored self-sabotage beliefs (*Myths Read*) | a per-charge, self-reported/inferred emotional-vector knot |
| Form | a **shadow card** clogging the hand | a **`BlockerSignature`** (1–5 channel-threads) |
| Cleared by | playing **Clean Up** (a drawn move + exercise) — mirror | a **route-hand** of earned capacities — teeth |
| Grows your deck? | no (removes clutter) | yes (earns a capacity) |

A myth is the *generic, known* blocker; a multi-channel blocker is the *novel, personal* one.
Clean Up clears myths at Tier 1; gate confrontation handles deep blockers at Tier 2. They do
not compete — they cover different friction.

---

## 3. The card economy (resolves C4)

**Capacities are permanently owned** (original "economy C" holds). The Dominion draw is over
the *owned* deck — randomness is in the **draw**, not in ownership. The meta-skill we'd missed:

- **Draw-reliability = curating a deck that reliably pulls the card you need.** Deck-thinning,
  favored-draw, or a School upgrade that raises draw odds. *This is the deckbuilding skill.*
- **Myths make it matter (proposed):** myths in the hand don't just clog — they **dilute your
  draw**, lowering the odds of pulling the move you want, until Cleaned. This gives Tier-1
  myth-clearing real teeth (better draws) and ties the two loops together elegantly.
- The original "**daily hand-limit**" *is* the draw-N. Own everything; draw a limited hand;
  play from the hand; curation shifts the odds.

**Open (needs a short design pass):** the exact draw-reliability lever — deck-thinning
(compost/trash a card), favored-draw (mark a card "likely"), or a School "reliability" upgrade.

---

## 4. Where Scope lives (resolves the C1 consequence)

C1 ruled **Face = altitude** (developmental ladder), so CD's scope ladder **cannot be the
face**. But scope is doing real work: *a charge carries a scope; a played move carries a scope;
meeting at-or-above the charge's scope fruits it, below-scope grows a slice.*

**Scope is a distinct fourth axis**, and it almost certainly **already exists** as the
allyship-deck's **`Subject` enum (`self · other · group · system · campaign`)** — a near-exact
match for CD's `yourself → the moment → relationship → group → system → whole campaign`.

**Proposed model (the key decision this handoff must settle):**
- A **move-card** carries a **face** (its altitude — what level it operates at) *and* is
  **played at a scope** up to the player's current **reach**.
- The **charge** carries its own scope (how wide the pattern lives).
- **Meet outcome:** `playedScope ≥ chargeScope` → fruit; below → grows a slice.
- The **School has two functions**: teach a new **face** (climb altitude) *and* widen **reach**
  (unlock a wider scope). CD's "School spends Vibeulons to widen scope" becomes the *reach*
  half; earning a capacity/face is the *altitude* half.

**Decision needed:** confirm scope = `Subject`; confirm face (altitude) and scope (reach) are
**independent** (a Shaman-altitude move can be played at campaign scope if your reach allows),
vs. coupled. *Recommend independent* — it keeps C1 clean (faces stay altitude, not width).

---

## 5. Which completions have teeth (resolves C3 via the polarity)

Governed by `docs/VALUES_AND_POLARITIES.md` (Calm ↔ Progress) + register:

| Act | Register | Completion |
|---|---|---|
| **Meet a charge** (Tier 1 exercise) | charge / recovery → **Calm** | **Mirror** — no pass/fail; completing the exercise applies the move (CD is right here) |
| **Earn a capacity** (Tier 2 School/Craft) | task / progress → **Progress** | **Teeth** — the demonstration bar (evidence-kind + movement) must pass to grant the card (ours is right here) |

CD didn't have the polarity context; this is the reconciliation. *Meeting* is always a mirror;
*earning new capacity* is where the teeth live. Nothing shames a player for how a meet went;
the only gate is on adding a permanent new power.

---

## 6. What maps to what (reuse, don't reinvent)

| Integrated concept | Built already (ours) | From CD | Canonical BARS type |
|---|---|---|---|
| Owned deck / play a move | `resolveGatePath` (own→Task) | draw/hand/discard | `MoveCard`, `HandSlot` |
| Deep blocker → capacity | `gate-confrontation` / `demonstration` / `move-crafting` (multi-channel, tested) | — | `MoveAttempt`, Technique Library |
| Myth shadow-cards | — | Myths in the deck | *Myths Read* diagnostic |
| Meet exercise (mirror) | — | rehearse→enact / meet→question→turn | `MoveAttempt` (`practiced`/`reflected`) |
| Scope | — (new axis) | scope ladder | **`Subject` enum** (`self…campaign`) |
| Draw-reliability | — (new) | Dominion draw | deck curation (new) |
| Overcrowding pressure | `fertility` (tested) | compost-at-harvest | `CompostLedger` |

---

## 7. Open decisions (for the author + Claude Design)

1. **Scope = `Subject`?** and **face ⟂ scope independent** (recommended) or coupled? (§4)
2. **Draw-reliability lever:** deck-thinning vs favored-draw vs School reliability-upgrade; do
   **myths dilute the draw** (recommended)? (§3)
3. **Escalation trigger from Tier 1 → Tier 2:** what marks a charge as "exceeds a single Clean
   Up" — player self-report only, or also an automatic signal (repeated failed meets, or the
   recommender returning a multi-thread route)? (§1)
4. **Exercises as `MoveAttempt`:** confirm the exercise steps persist as the `MoveAttempt`
   lifecycle (`chosen → practiced → reflected → completed`) rather than a new model.

## 8. Build / verification sketch

- **Reuse** the tested `ontology/*` for Tier 2 unchanged (multi-channel blocker, demonstration,
  craft, fertility). **New pure code** needed: a Tier-1 **deck** (draw/hand/discard over owned
  capacities, myth dilution) and the **scope meet** resolver (`playedScope ≥ chargeScope →
  fruit|slice`), both tsx-testable like the rest.
- **Feed Claude Design** this doc + `docs/VALUES_AND_POLARITIES.md` so their "mirror, never a
  grade" is scoped to Tier 1 and faces are corrected to altitude.
- **Verify** headlessly: escalation (own→Tier1, not-own→Tier2), earned-capacity-enters-deck,
  scope meet fruit-vs-slice, myth-dilution lowers draw odds, and the Tier-2 regression suite
  (already green).

---

### Related
- Reconciliation: `docs/handoffs/2026-07-12-inner-garden-reconciliation-with-claude-design.md`.
- Our built lib: `src/lib/inner-garden/ontology/*`; specs `inner-garden-blocker-route-hand`,
  `inner-garden-action-economy-fertility`.
- Polarity: `docs/VALUES_AND_POLARITIES.md`. CD side: `design_handoff_inner_garden/`.
