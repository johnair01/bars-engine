---
type: design-analysis
topic: polarity-design-mtgoa-friendcraft
method: six-game-master-integral-design
date: 2026-05-25
hexagram: "48 — The Well (Water over Wind)"
status: advisory — precedes live polarity session
parent:
  - POLARITY-DESIGN-SESSION-BRIEF.md
  - DECK-PRODUCT-GRAMMAR.md
related:
  - DECK-PRODUCT-GRAMMAR-6FACE-ANALYSIS.md
  - ../07 Book OS/07 Book OS/BARS_ICHING_ARCHITECTURE.md
  - ../../bars-engine/.specify/specs/creator-scene-grid-deck/POLARITY_DERIVATION.md
tags: [polarity, 6-face, mtgoa, friendcraft, scene-atlas]
---

# Polarity Design (MTGOA + Friendcraft) — Six Game Master Analysis

**Cast statement:** Before Friendcraft book 64 or MTGOA domain integration ship, we must decide what **polarity** means on exploration decks — and wire Scene Atlas’s proven pair-resolution method into both allyship and friendship lines without collapsing them into one vocabulary or one grid.

**Hexagram:** #48 — The Well. The structure is already dug (Scene Atlas engine, MTGOA 64 drafts, deck grammar). The work is drawing water cleanly — not digging a second well per product line.

**Scope:** Joint polarity session brief + deck product grammar + Scene Atlas cross-cut + engine `DeckType` rename.

---

## WAVE Summary

### Wake — What’s true

- **Three-layer grammar** is locked: Intake → Application (52) → Exploration (64).
- **Scene Atlas** implements polarity on **application**: `pair1 × pair2 → 4 suits`, resolved labels, stable storage keys (`polarities.ts`).
- **MTGOA exploration 64** exists as **Gate × Chapter** (8×8 hexagram matrix); 64 cards drafted; earn via BAR gate capture.
- **Allyship domains** (4 Show Up action types) are spec’d but **not on cards** — orthogonal to WAVE, per `ALLYSHIP_DOMAINS_SPEC.md`.
- **Friendcraft book 64** has **no axes**; game has Quest 52 + Friends intake only.
- **Engine:** `FRIENDSHIP_*` renamed → `APPLICATION_52`, `CAMPAIGN_LATTICE_64`, `EXPLORATION_64` — campaign lattice ≠ book exploration.

**The gap:** Craft lines have WCGS suits and (for MTGOA) a 64 matrix, but only Scene Atlas has **player-resolved polarity**. MTGOA may already *be* polar at Gate×Chapter — that’s the first decision, not Friendcraft’s first decision.

### Assess — What’s charged

| Charge | Release | Keep |
|--------|---------|------|
| “MTGOA 64 is done — only Friendcraft needs design” | Hexagram text ≠ polarity integration | 64 drafts as content asset |
| “Copy Scene Atlas 2×2 onto exploration 64” | Force 4 quadrants on 8×8 | Cartesian **method**, not same factorization |
| “Allyship domains = fifth suit” | Collapse WCGS + domains | Domains as orthogonal Show Up frame |
| “One polarity vocabulary for all crafts” | Universal axis labels | Shared **engine pattern** only |
| “Polarity session delays shipping Casey” | Block reader | Casey = application 52; unaffected |
| “I Ching is the polarity” | Trigram cosplay | Gate×Chapter as **structural** axes if confirmed |

### Grow — What becomes possible

- MTGOA cards gain **domain specificity** without rewriting 64 from scratch.
- Friendcraft book 64 gets **friendship-native axes** (not allyship clone, not +12 stub).
- Shared `exploration-deck-polarities` types: stable cell keys + resolved display + provenance source.
- Scene Atlas becomes explicit **primer**: learn pair resolution before craft-line exploration.
- Relationships / Flirtcraft inherit the same session **format** later.

### Show — What the session must produce

1. MTGOA: Gate×Chapter **is / is not** exploration polarity + domains placement (A/B/C/D).
2. Friendcraft: locked axis A + axis B + 8×8 sketch.
3. Unified table (both lines) + engine vs vault-only scope.
4. **No card rewrites** in the live session — decisions only.

---

## 🏛 Regent — What must we preserve?

### Do not touch

| Asset | Why |
|-------|-----|
| **64 hexagram card texts** | Years of gate×chapter work; session adds frame, not rewrite |
| **FRIENDCRAFT-10 quest grammar** | Channel at send-time; application 52 load-bearing |
| **WCGS four moves** | Shared soul; polarity labels, not suit function |
| **Scene Atlas suit keys** | `SCENE_GRID_*` stable; display derives from pairs |
| **Casey `/oracle`** | Named-person application 52; out of scope for polarity session |
| **BAR gate prompt → unlock** | MTGOA earn mechanic (`HEXAGRAM_CARD_MANUSCRIPT_INTEGRATION_SPEC.md`) |
| **Provenance-as-score** (Friendcraft game) | Game layer; not exploration 64 definition |

### Regent verdict on the joint session

**Yes — one session, two tracks.** Shared method prevents Friendcraft from inventing axis logic that MTGOA later contradicts. But **preserve separate vocabularies**: allyship gate/chapter language ≠ friendship axis language.

**Regent recommendation:** Session output is **spec amendments only**. No engine refactor in the same week as decisions.

---

## 🏗 Architect — What structure holds this?

### Two polarity layers (critical distinction)

| Layer | Factorization | Example | Resolution |
|-------|---------------|---------|------------|
| **Application polarity** | 2×2 → 4 suits | Scene Atlas | Player-derived pair labels on WCGS or grid suits |
| **Exploration polarity** | 8×8 (or 4×16) → 64 cells | MTGOA hexagram | Book structure; earn per cell; optional overlay |

Scene Atlas pattern **scales by factorization**:

```
stable_cell_key  +  resolved_labels  +  resolution_source
```

Application: 4 keys. Exploration: 64 keys. Same **contract**, different grid size.

### MTGOA structural proposal (Architect lean)

**Exploration 64 axes = Gate × Chapter** (confirm in session).

- **Lower/trigram axis:** interior voice (Earlier Heaven mapping)
- **Upper/trigram axis:** chapter face (Later Heaven mapping)
- This *is* polarity at exploration layer — not Scene Atlas 2×2, but **8×8 Cartesian product**

**What’s missing architecturally:**

1. **Allyship domains** — third orthogonal frame (4 values), not a third axis multiplying to 256. Placement options:
   - **Recommended:** Option C-lite — domain tags on exploration card tasks + appendix routing (extends existing footer pattern)
   - Avoid Option A (5th dimension at draw) until UX proof

2. **Application 52 overlay** — optional `ResolvedGridPolarities` on practitioner deck **labels only** (Phase 2 engine)

### Friendcraft structural proposal (Architect lean)

**Do not use Gate×Chapter or I Ching trigrams.**

Candidate **8×8** from two friendship-native **4-point** axes (each axis = 4 stages, not 2 poles) — *or* two 8-value axes. Session must pick.

**Architect warning:** Two 2-pole axes only give **4** exploration quadrants unless multiplied by 16 ranks inside each — that collapses toward application 52. Friendcraft exploration 64 likely needs **two 8-way axes** (like MTGOA), not two 2-way axes (like Scene Atlas application).

**Reframe for session brief:** Scene Atlas teaches **method** (Cartesian product + resolved labels). MTGOA and Friendcraft exploration use **8×8**, not 2×2.

### Engine integration (post-session)

```
src/lib/deck-polarity/
  types.ts          — GridAxisPair, ExplorationAxis, ResolvedLabels
  exploration.ts    — cellKey(gateIdx, chapterIdx), metadata on deck.json
```

`EXPLORATION_64` decks: static JSON + `exploration_axes` block; no campaign auto-seed.

---

## ⚔️ Challenger — What fails if we get this wrong?

| # | Failure | Face |
|---|---------|------|
| 1 | **Friendcraft 64 = I Ching reskin** | Reads as allyship DLC; friendship voice lost |
| 2 | **MTGOA domains bolted as 5th suit** | WCGS grammar breaks; cards unreadable |
| 3 | **Scene Atlas 2×2 forced on 64** | Wrong math; 4 cards instead of 64 |
| 4 | **Polarity session never ends** | No Friendcraft book 64 seed; MTGOA domain pass stalls |
| 5 | **Player-resolved labels on hexagram cells** | 64 × personalization = untestable; keep exploration labels **book-stable** |
| 6 | **Skip Scene Atlas primer** | Players hit exploration 64 without understanding quadrants |
| 7 | **Conflate CAMPAIGN_LATTICE_64 with book 64** | Already split in engine — document in session |

### Challenger hard rules for session

1. **Timebox Friendcraft axis pick** — top 2 candidates by end of Track B; no “keep brainstorming.”
2. **MTGOA Track A default yes** on Gate×Chapter unless owner says no in first 15 min.
3. **Domains: reject Option A** (5th draw dimension) unless Challenger objections answered.
4. **Rejection test for Friendcraft axes:** “Could this axis label appear on a quest deck 52 card?” If yes, wrong layer.

---

## 🎭 Diplomat — How do MTGOA and Friendcraft stay siblings?

### Same grammar, different dialect

| Shared | MTGOA dialect | Friendcraft dialect |
|--------|---------------|---------------------|
| Intake → 52 → 64 | Ally list; justice frame | Friends deck; friendship frame |
| WCGS suits | Allyship moves | Relational moves (same four, different copy) |
| Exploration earn | Read gate → BAR → hexagram | Read chapter → capture → book oracle (TBD) |
| Polarity method | 8×8 gate×face | 8×8 axis A × axis B (TBD) |
| Optional bridge | Friendcraft Grow Up → allyship pull | Never reverse-required |

### Scene Atlas diplomatic role

**Not** “the friendcraft deck” or “the allyship deck.”

**Is:** “Here is how axes become four corners become a deck you can play.”

**Bridge copy:** After Scene Atlas onboarding, player chooses craft line — allyship book path vs friendcraft book path vs relationships hybrid. Same literacy, different intake.

### Diplomat integration with existing products

| Product | Session touch |
|---------|---------------|
| MTGOA manuscript | Domain tags on hexagram tasks; appendix lines confirmed |
| Friendcraft game | Book 64 linked, not merged; provenance stays game layer |
| Casey oracle | Unchanged |
| Calrunia skins | Apply to fixed deck faces after axes locked |
| Relationships (future) | Session **format** reused; intake = parts_of_other |

---

## 🌊 Shaman — Shadows and guardrails

### Shadow 1: Mapping people on grids

Friendcraft intake + Flirtcraft + allyship lists all **grid humans**. Exploration 64 adds **symbolic coordinates** on top.

**Guardrail:** Exploration cells are about **moves and invitations**, not ranking people. Intake holds people; 64 holds **questions**, not faces.

### Shadow 2: Allyship hexagram as mystique

I Ching depth can intimidate or perform wisdom.

**Guardrail:** Hexagram **names** on cards follow two-tier rule already in oracle formula — replace misleading, keep evocative. Polarity session does not add occult layering.

### Shadow 3: Domain pass as rewrite mandate

“All 64 need domain specificity” can feel like invalidating drafted cards.

**Guardrail:** Domain pass = **task line + routing**, not new oracle voice. Shaman honors existing card soul.

### Shadow 4: Friendship reduced to allyship-lite

Shared WCGS triggers “same book, different skin.”

**Guardrail:** Friendcraft axis vocabulary must include **play, async, gift, graduation** — words allyship deck never uses.

### Shadow 5: Polarity as surveillance (Scene Atlas bleed)

If exploration earn keys include player polarity state, players feel tracked.

**Guardrail:** Exploration unlock = **gate read + BAR capture** only for MTGOA; book progress only. Polarity resolution affects **application label overlay** optionally, not earn gates.

### Ritual for session

Open with 321 or somatic check (book editing protocol). Close with one sentence per face — what the well gives each line.

---

## 📖 Sage — Principle underneath

**Polarity is not the grid. Polarity is how the player recognizes themselves in the grid.**

Scene Atlas: “My axes are Top/Bottom × Lead/Follow (or derived).”  
MTGOA exploration: “This moment is Victim × Diplomat chapter — this hexagram.”  
Friendcraft exploration: “This invitation is [A] × [B] — this cell.”

**One principle:** Application teaches **moves**. Exploration teaches **integration after contact with the book.** Polarity teaches **orientation before either.**

**Mastery sign:** Player can say: “Scene Atlas taught me corners. Allyship 64 integrates my reading. Friendcraft 64 integrates friendship the same way — different words, same depth.”

**Warning sign:** Player cannot explain why MTGOA and Friendcraft both have 64 but feel different.

---

## Cross-face synthesis

### Session recommendation (consensus)

| Topic | Recommendation | Dissent |
|-------|----------------|---------|
| Joint MTGOA + Friendcraft session | **Do it** | — |
| MTGOA exploration axes | **Confirm Gate × Chapter** as 8×8 polarity | Challenger: validate in first 15 min |
| Allyship domains | **Option C-lite** — task/routing tags, not 5th dimension | Architect wants explicit enum in metadata |
| Friendcraft exploration | **Two 8-way axes** (not Scene Atlas 2×2) | Session must name them |
| Scene Atlas primer | **Recommended** before craft exploration; not hard gate v1 | Diplomat: soft quest link from `/hand` |
| Application polarity overlay | **Phase 2** — after exploration axes locked | Regent: don’t scope creep session |
| Engine work in session | **No** — vault specs only | — |

### Revised session agenda tweak

Add at **10–25 block:** explicit statement — “Scene Atlas = 2×2 application. Exploration = 8×8. Same method, different factorization.” Prevents wrong mental model.

### Integration priority (post-session)

| P | Action | Owner |
|---|--------|-------|
| 1 | Session decisions → `FRIENDCRAFT-BOOK-64-AXIS-SPEC.md` + MTGOA domain amendment | @wendell |
| 2 | Update `BARS_ICHING_ARCHITECTURE.md` with “exploration polarity confirmed” | @zo |
| 3 | `DECK-PRODUCT-GRAMMAR.md` — resolve open Q1–Q2 | @zo |
| 4 | Seed empty 8×8 Friendcraft grid (titles only) | @zo |
| 5 | MTGOA domain pass on **tasks** (batch by chapter) | @wendell |
| 6 | `deck-polarity` shared types in bars-engine | @architect — after P1 |

---

## Open decisions (for live session only)

1. Friendcraft axis A and B — **names and pole/stage lists**
2. MTGOA domains — C-lite vs D-only (appendix)
3. Scene Atlas — soft quest vs required gate
4. Friendcraft book earn — book-only vs game provenance bridge
5. Exploration labels — 100% book-stable vs optional player overlay on application 52 only

---

## Reference cards (facilitator)

Use integral-design face cards from prior passes:

- `manuscripts/sources/integral-design/friendcraft-deck/*` — provenance, graduation, allyship bridge
- `DECK-PRODUCT-GRAMMAR-6FACE-ANALYSIS.md` — platform integration
- `POLARITY-DESIGN-SESSION-BRIEF.md` — agenda

---

## Next step

Schedule 90 min. Pre-read this analysis + session brief. Owner brings three artifacts (hexagram card, quest card, Scene Atlas quadrant view). **Default MTGOA opening motion:** “We confirm Gate×Chapter as exploration polarity unless someone stops us in the first fifteen minutes.”
