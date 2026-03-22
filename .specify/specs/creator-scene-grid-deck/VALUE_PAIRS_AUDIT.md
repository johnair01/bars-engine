# Scene Atlas — value pairs audit (vision alignment)

**Intent:** Before shipping or extending deck grammar, check that **axis labels** behave like **polarity pairs** (interdependent goods, map-ready), not like random metaphors or one-sided virtues.

**Related:** [POLARITY_DERIVATION.md](./POLARITY_DERIVATION.md), [spec.md](./spec.md) § Polarity pairs, [docs/VALUES_AND_POLARITIES.md](../../../docs/VALUES_AND_POLARITIES.md).

---

## 1. Where the confusion comes from (model clarity)

### What the product does today

- There is **one** Scene Atlas deck per player flow: **52 cells** = **4 row “suits”** × **13 ranks**.
- The **four rows** are always the **Cartesian product of exactly two axis pairs** (`pair1` × `pair2`).
- **Resolution today:** `pair1` is derived from **nation element** only; `pair2` from **playbook / archetype** (overlay → trigram table, then fallbacks). **Override:** `storyProgress.gridPolarities` sets **both** pairs at once.

So polarities do **not** live “in nation **or** archetype” as an either/or — they are **split by axis**: nation shapes **one** dimension, archetype **the other**, unless the player overrides **both** via adventure JSON.

### Mental models that clash

| Phrase | Risk |
|--------|------|
| “Self-made deck for nation” + “self-made deck for archetype” | Implies **two decks** or **two independent polarities per identity**. Implementation is **one grid** with **two axes** from **two sources**. |
| “Axes are polarities in nation OR archetype” | Suggests **one** source of truth per grid. Actually **pair1 ⊂ nation**, **pair2 ⊂ archetype** (unless full override). |
| “Customize deck by value pairs” (vision) | **Not implemented** as “pick among several pairs per playbook/WCGS.” Today customization is **implicit** (change nation/archetype) or **explicit** (orientation writes `gridPolarities`). |

**Conclusion:** The confusion is structural: **one combined 2×2** + **split provenance** reads like **two products** unless copy and specs say otherwise.

---

## 2. What “good” value pairs look like (Barry Johnson–style bar)

Use this as a **lint** for labels (not a legal requirement to cite Johnson in UI).

| Criterion | Question |
|-----------|----------|
| **Interdependence** | Does honoring pole A over time **naturally** call for pole B (and vice versa)? |
| **Both legitimate** | Are both poles **good** when in balance — not hero vs villain? |
| **Actionable** | Can a player **do** something toward each pole in scene/work planning? |
| **Map-ready** | Could you place each pole in a **polarity map** (upsides of A, upsides of B, downsides of **over**-A, downsides of **over**-B)? |
| **Symmetric weight** | Do names feel like **peers** (parallel grammar, comparable abstraction)? |

**Not required for deck v1:** Actually authoring upsides/downsides in JSON — but **if pairs fail the bar**, prompts feel arbitrary.

---

## 3. Audit: `ELEMENT_AXIS` (pair1 — nation element)

Source: `src/lib/creator-scene-grid-deck/polarities.ts`

| Pair | Interdependence | Both good? | Actionable? | Map-ready? | Symmetry | Verdict |
|------|-----------------|------------|-------------|------------|----------|---------|
| Rising · Rooting | Strong (growth vs grounding) | Yes | Yes | Yes | Strong | **Strong polarity** |
| Flare · Ember | Moderate (peak vs sustain) | Mostly | Yes | Yes | Strong | **Good** — “Ember” may need one-line pedagogy |
| Surface · Depth | Strong | Yes | Yes | Yes | Strong | **Strong polarity** |
| Define · Refine | Strong | Yes — interdependent craft / clarity loop | Yes | Yes | Strong (parallel verbs) | **Strong** — *revised 2026-03-19* (was Edge · Forge) |
| Flow · Still | Strong | Yes | Yes | Yes | Strong | **Strong polarity** |

**Summary:** All five element pair1 rows are **polarity-shaped** after metal → **Define · Refine** (§9).
</think>
Shell

---

## 4. Audit: `TRIGRAM_RELATIONAL_PAIR2` (pair2 — playbook / trigram)

Source: `src/lib/creator-scene-grid-deck/archetype-trigram-polarities.ts`

| Pair | Interdependence | Both good? | Actionable? | Map-ready? | Symmetry | Verdict |
|------|-----------------|------------|-------------|------------|----------|---------|
| Spark · Restraint | Strong | Yes | Yes | Yes | Strong | **Strong** |
| Nurture · Self-nurture | Strong | Yes | Yes | Yes | Strong | **Strong** — *revised* from Self-care for parallel form |
| Breakthrough · Timing | Strong | Yes | Yes | Yes | Strong | **Strong** |
| Subtle · Direct | Strong | Yes | Yes | Yes | Strong (peer adjectives) | **Strong** — *revised* from Indirect · Visible |
| Venture · Anchor | Strong | Yes — both legitimate in danger/water frame | Yes | Yes | Strong | **Strong** — *revised* from Enter risk · Adapt |
| Clarify · Tact | Strong (truth vs care) | Yes | Yes | Yes | Strong | **Strong** |
| Pause · Proceed | Strong | Yes | Yes | Yes | Strong (parallel imperatives) | **Strong** — *revised* from Pause · Cross |
| Widen · Deepen | Strong | Yes — breadth vs depth of connection | Yes | Yes | Strong (parallel verbs) | **Strong** — *revised* from Gather · Bound joy |

**Summary:** After **§9 (2026-03-19)** all eight trigram rows are **polarity-shaped** in code; Heaven, Thunder, Fire were already strong. **Pedagogy** in wiki/UI can still add one-line “neither pole is bad” copy.

---

## 5. Audit: `WAVE_RELATIONAL_AXIS` (fallback pair2)

Source: `polarities.ts` — used when trigram/profile resolution fails.

| Pair | Notes | Verdict |
|------|--------|---------|
| Seeing · Choosing | Classic wake-up tension | **Strong** |
| Clearing · Holding | Cleanup polarity | **Strong** |
| Practicing · Integrating | Grow-up rhythm | **Strong** |
| Offering · Receiving | Show-up relational | **Strong** |

**Irony:** Fallback pairs are **more uniformly polarity-shaped** than some trigram rows — because they were written as **process tensions**, not as **one-word I Ching glosses**.

---

## 6. Alignment with your stated vision

**Vision elements:**

1. **True value pairs** — neutral, actionable, polarity-map compatible, emergent from overdoing one side.  
   → **Met for default tables (2026-03-19):** element + trigram pair2 revised per §9; wave fallback unchanged **strong**.

2. **Axes could belong to nation *or* archetype in player imagination** —  
   → **Today:** Nation **only** supplies pair1; archetype **only** supplies pair2 (unless `gridPolarities` replaces both). If you want **nation-only** or **archetype-only** grids, or **swappable** assignment, that is a **spec change**.

3. **Each archetype driven by several value pairs, perhaps tied to Wake / Clean / Grow / Show — players connect to pairs to customize deck** —  
   → **Not in current grammar.** Today: **one** pair2 per archetype (from trigram). **Direction:** see §7.

---

## 7. Recommended directions (without blocking current build)

**A. Copy / pedagogy (low cost)**  
- Add **one sentence** on the deck UI or wiki: *“Each row mixes two good tensions; overdoing one side is what makes the other necessary.”*  
- ~~Worst trigram/metal labels~~ — **done** in code (§9). Optional: per-pair tooltip upsides/overuse later.

**B. Explicit polarity metadata (medium cost)**  
- Optional JSON on deck template or `gridPolarities`: `poleAHigherOrder`, `upsideA`, `upsideB`, `overuseA`, `overuseB` — powers real **polarity map** UI later.

**C. WCGS-linked pair menus (your vision — larger change)**  
- Model: `Archetype` (or overlay) exposes **`pair2Candidates: { wakeUp: GridAxisPair, cleanUp: … }`** (or a pick list).  
- Player **selects** one active pair2 (or two pairs over time) → writes `gridPolarities` or a new `gridAxisProfile` field.  
- Nation could similarly offer **`pair1Candidates`** per element or per nation id if element metaphors are too thin.

**D. Model honesty in specs**  
- In [spec.md](./spec.md), add a **“Split-axis provenance”** callout: one deck, two sources, optional full override — so “nation deck vs archetype deck” language is avoided unless you **add** second deck type.

---

## 8. Next steps (product / ontology)

1. **Playtest copy** — Read all 8 trigram pair2 strings + 5 element pair1 strings aloud; adjust if any still feel off in *your* voice.  
2. **Split axis vs player-picked pairs** — Still open (§6–7): defaults are now sane; WCGS menus / catalog remain future.  
3. **Run matrix print** (needs `DATABASE_URL`): `npm run audit:scene-atlas-polarities` — review nation × archetype output.

---

## 9. Revisions applied (2026-03-19)

Canonical implementation: `ELEMENT_AXIS` in `polarities.ts`, `TRIGRAM_RELATIONAL_PAIR2` in `archetype-trigram-polarities.ts`.

| Location | Was | Now | Rationale |
|----------|-----|-----|-----------|
| Pair1 metal | Edge · Forge | **Define · Refine** | Peer verbs; interdependence (spec vs iteration) without opaque metaphor. |
| Pair2 Earth | Nurture · Self-care | **Nurture · Self-nurture** | Parallel grammar with first pole. |
| Pair2 Wind | Indirect · Visible | **Subtle · Direct** | Clear both/and communication stance. |
| Pair2 Water | Enter risk · Adapt | **Venture · Anchor** | Co-equal goods (lean in vs steady); “Adapt” was consequence-like. |
| Pair2 Mountain | Pause · Cross | **Pause · Proceed** | Self-explanatory still vs move. |
| Pair2 Lake | Gather · Bound joy | **Widen · Deepen** | Peer verbs; breadth vs depth of connection for Joyful Connector. |

Heaven, Thunder, Fire were **unchanged**. `WAVE_RELATIONAL_AXIS` unchanged.

---

*This audit is design authority for value-pair grammar; tables in `polarities.ts` and `archetype-trigram-polarities.ts` reflect §9 until the next intentional change.*
