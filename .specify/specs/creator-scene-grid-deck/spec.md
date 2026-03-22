# Spec: Scene Atlas (52-Card BAR Deck)

**Product name:** **Scene Atlas** — a private map of BARs players use as a **personal compass** (what to do next), including **self-authored divination** (return to a layout you wrote, not external prophecy).  
**Technical:** instance slug `creator-scene-grid`, route `/creator-scene-deck`, lib folder `creator-scene-grid-deck` (stable identifiers).

## Purpose

Support **content creators** (including adult-industry workers planning **scenes for production**) who think in **structured creative grids**—specifically a **2×2** of **top/bottom × dom/sub**—by providing a **BARs-native mini-game** that:

1. Uses a **full 52-card topology** (4 suits × 13 ranks) aligned with existing **`BarDeck` / `BarDeckCard`** shape.
2. Turns **creative reflection** into **BARs** (`CustomBar`) and **binds** them to card slots (`BarBinding`) so the deck becomes a **personal, replayable library** of scene design moves.
3. Teaches **all players** the same **Charge → BAR → Deck → (draw/play)** literacy already described in [dominion-style-bar-decks](../dominion-style-bar-decks/spec.md) and [deck-card-move-grammar](../deck-card-move-grammar/spec.md)—without requiring this use case to appear in public marketing copy for minors or non-consenting audiences.

**Practice**: Deftness Development — consent-forward, private-by-default, pedagogical clarity; no assumption that adult content is stored in shared campaign surfaces without explicit visibility choices.

## User Stories

### P1: Creator (primary)

**As a** creator planning shoots, **I want** each card in my 52-grid to hold a **prompt** I can answer with a **BAR** (note, intention, logistics, boundary, shot idea) **so** I externalize structure, vary ideas, and return to a **saved deck** between sessions.

**Acceptance**: For a dedicated **instance** (or template), 52 `BarDeckCard` rows exist; creator can bind a BAR per slot (or leave empty); prompts are editable where permissions allow.

### P2: Learner (all players)

**As any** player, **I want** a **short quest/onboarding** that teaches **how to build a BARs deck** (create BAR → place on card → optional draw/hand metaphor) **so** I can reuse the pattern for **any** creative or inner-work grid—not only scene design.

**Acceptance**: Documented **golden path** (quest steps or Twine-adjacent flow) with screenshots or in-app copy; links to `/hand` and deck concepts in [wiki rules](../../../src/app/wiki/rules).

### P3: Custodian / admin

**As** operator, **I want** this deck **scoped to an instance** with **clear data residency** (who can see bindings) **so** creator safety and platform policy stay aligned.

**Acceptance**: Bindings respect `CustomBar.visibility` and instance membership; no accidental public publish path.

## Design: Mapping the 2×2 to Four Suits

Mechanically, `BarDeckCard` already supports **four suits** and **ranks 1–13** (`@@unique([deckId, suit, rank])`). The **allyship domains** (`GATHERING_RESOURCES`, etc.) are the **default** narrative for campaign decks; **this feature uses the same storage** but **semantic suits** that describe the **scene grid**.

| Quadrant (example) | Proposed `suit` string (stable, unique) | Notes |
|--------------------|----------------------------------------|--------|
| Top + Dominant | `SCENE_GRID_TOP_DOM` | Copy layer maps to “energy / frame” in pedagogy |
| Top + Submissive | `SCENE_GRID_TOP_SUB` | |
| Bottom + Dominant | `SCENE_GRID_BOTTOM_DOM` | |
| Bottom + Submissive | `SCENE_GRID_BOTTOM_SUB` | |

**Ranks 1–13**: Assigned meaning in **tutorial copy** only (e.g. “lens” or “beat” index, escalation step, checklist column)—not enforced in schema. Optional: `metadata` JSON on each card:

```json
{
  "playingCard": { "symbol": "♠", "rankName": "Ace" },
  "pedagogyHint": "Logistics / safety check",
  "axis": { "vertical": "top", "power": "dom" }
}
```

This avoids overloading **allyship** semantics in filters while staying compatible with **one row per card** in Prisma.

## Polarity pairs (core): what “suits” mean

The four rows are **not** free-floating labels. They are the **four corners of two independent polarity pairs**:

- **Pair 1** (first axis): e.g. Top ↔ Bottom, Surface ↔ Depth, Expansive ↔ Focused — *authored or derived.*
- **Pair 2** (second axis): e.g. Lead ↔ Follow, Seeing ↔ Choosing — *authored or derived.*

**Cartesian product** (pair1.−, pair2.−), (pair1.−, pair2.+), (pair1.+, pair2.−), (pair1.+, pair2.+) maps 1:1 onto the four stable `BarDeckCard.suit` keys (`SCENE_GRID_*`). **Storage stays stable**; **display labels** come from resolution.

### Resolution order (implemented)

**Provenance (avoid confusion):** There is **one** 52-cell grid. **Pair1** defaults from **nation element**; **pair2** from **playbook/archetype** — not “nation deck XOR archetype deck.” Optional `gridPolarities` overrides **both** axes. Deeper vision (multiple pairs per archetype, WCGS pick lists) is **not** implemented; see [VALUE_PAIRS_AUDIT.md](./VALUE_PAIRS_AUDIT.md).

1. **Adventure / values surfacing** — If `Player.storyProgress` JSON contains `gridPolarities: { pair1, pair2, optional adventureSlug }`, use that (**Wake Up orientation**, values CYOA, or any authored flow). Helpers: `mergeStoryProgressGridPolarities`, `parseGridPoliciesFromStoryProgress` in `src/lib/creator-scene-grid-deck/polarities.ts`.
2. **Nation + playbook (`Archetype` row)** — Else, **derive**: `Nation.element` → pair1; **`Archetype` → `ARCHETYPE_PROFILES` (overlay)** → trigram → pair2 — not Prisma `Polarity` / `NationMove` taxonomy. `primaryWaveStage` is **last** fallback — see [POLARITY_DERIVATION.md](./POLARITY_DERIVATION.md).
3. **Default** — Else `Top/Bottom` × `Lead/Follow`.

UI shows **which source** is active and the two axes; per-card headings use resolved row labels × rank lens (`cardDisplayTitle`).

### Future / adjacent

- **Dedicated orientation Adventure** (Twine/CYOA) whose completion **only** writes `gridPolarities` (and optional copy deck) — spec can split to `grid-polarity-orientation-adventure` when designing passages.
- **Richer derivation** — Replace heuristics with authored `Nation × Archetype` matrix in TS or DB when lore is ready.

## Existing Features (Research Summary)

| Capability | Where / status | Relevance |
|------------|----------------|-----------|
| **BAR creation, charge capture** | `/hand`, `CreateBarForm`, `charge_capture` type | Creators capture **intention** and notes as BARs |
| **Library → quest** | Personal quests from `sourceBarId` / 321 | Work products leave the deck into **action** |
| **Instance scoping** | `Instance`, campaigns | Isolated “creator lab” instance |
| **BarDeck / BarDeckCard / BarBinding** | `prisma/schema.prisma` | **52 slots** and BAR linkage **already modeled** |
| **ActorDeckState** | `prisma/schema.prisma` | Draw/discard/hand (7 in schema today; dominion spec suggests 5) — optional for **draw** UX |
| **Domain deck draw** (Kotter × allyship) | `src/lib/campaign-domain-deck.ts` | **Different** mechanic (quest pools); do not conflate with this grid deck |
| **Deck templates (TS)** | `src/lib/deck-templates/*` | Pattern for **starter prompts**; could add `creator-scene-grid-starter` template |
| **Personal PlayerDeck** | [deck-card-move-grammar spec](../deck-card-move-grammar/spec.md) — **PlayerDeck/PlayerCard** not fully implemented | Long-term: promote BAR → personal card; **near-term: BarBinding suffices** |
| **CYOA / modular authoring** | [cyoa-modular-charge-authoring](../cyoa-modular-charge-authoring/spec.md) | Optional export of **walkthrough** for “how I use my deck” |

**Gap (honest):** Application code references to `BarDeck` / `BarDeckCard` in `src/` are **minimal** today; the **schema is ready**—**seeds + UI + quest thread** are the vertical slice.

## Non-Goals (this spec)

- Replacing allyship **campaign** decks or Kotter filtering.
- Hosting explicit media in-app (creators use **attachments** under normal `Asset` rules and visibility).
- Legal/compliance advice per jurisdiction—**document pointer** to operator policy only.

## Functional Requirements

### Phase 1 — Data + seed

- **FR1**: Seed script (or admin action) creates **one `BarDeck` per target `Instance`** and **52 `BarDeckCard`** rows with suits `SCENE_GRID_*` and ranks 1–13, with **neutral prompt titles** (teachable, non-explicit defaults).
- **FR2**: Card `metadata` carries **grid + optional playing-card labels** for UI.

### Phase 2 — Player-facing teaching flow

- **FR3**: Quest or guided flow: (1) open deck, (2) pick a card, (3) **create BAR** answering prompt, (4) **bind** via `BarBinding`, (5) optional “draw hand” from `ActorDeckState` if implemented for this instance type.
- **FR4**: Reuse **`/hand`** patterns for BAR creation where possible—no duplicate capture philosophy.

### Phase 3 — Discovery + polish

- **FR5**: Wiki or in-app **“How to build a BARs deck”** page referencing this pattern as **one example template**.
- **FR6**: Optional: export deck outline (markdown/JSON) for offline shot lists—**privacy warning** in UI.

### Phase 4 — Polarity resolution

- **FR7**: `resolvePlayerGridPolarities(playerId)` — adventure JSON override → nation/archetype derivation → default; used by deck loader and UI.
- **FR8**: Document JSON contract for orientation authors (`gridPolarities` on `storyProgress`) and export `mergeStoryProgressGridPolarities` for adventure completion handlers.
- **FR9**: Quest **`completionEffects`** may include **`commitDerivedSceneAtlasAxes`** (writes nation+playbook-derived axes, `source: oriented`) or **`mergeGridPolarities`** (explicit `pair1`/`pair2` from effect or `fromInput`). Implemented in `quest-engine.ts` → `processCompletionEffects`.

## Dependencies

- [dominion-style-bar-decks](../dominion-style-bar-decks/spec.md) — conceptual Library → Deck → Hand loop.
- [deck-card-move-grammar](../deck-card-move-grammar/spec.md) — grammar and future `PlayerDeck` alignment.
- [scene-atlas-game-loop](../scene-atlas-game-loop/spec.md) — dashboard / Hand placement, daily limit, collective I Ching, north star, demos (broader loop).
- [prompt-deck-draw-hand](../prompt-deck-draw-hand/spec.md) — random draw from undealt pile, **shared 5-card hand** across decks, per-deck discard + reshuffle, rank→move mapping, wild at play time, quest use → discard.
- Instance + campaign infrastructure for **scoping**.

## Acceptance Criteria

- [x] 52-card deck can be created per instance via documented seed/command.
- [x] At least one **end-to-end path** binds a player-authored BAR to a card and displays it.
- [x] Teaching artifact exists so **generic players** learn deck-building **without** niche copy on the main landing.
- [x] Polarity pairs resolved per player (adventure → derived → default); UI shows axis source.
- [x] Orientation **quest completion** writes `gridPolarities` via **`commitDerivedSceneAtlasAxes`** on final onboarding quest (seed); **`mergeGridPolarities`** for custom CYOA pairs (`fromInput` or inline).
- [ ] `npm run check` passes for changed code (when repo lockstep green).

## Appendix: Scene Atlas cell BAR template (`completionEffects`)

BARs created or placed on the Scene Atlas grid carry **no extra Prisma columns**. Optional metadata closes the **Charge → BAR → deck → hand** compost loop:

- **`completionEffects.barTemplate`** — when present (bind or create from a cell):
  - `key`: `"scene_atlas_cell"` (stable identifier)
  - `version`: `1` (bump when scaffold semantics change)
  - `suit`: card suit string (e.g. `SCENE_GRID_TOP_DOM`) or `null`
  - `rank`: card rank `1–13` or `null`

Helpers live in `src/lib/creator-scene-grid-deck/bar-template.ts` (`buildSceneAtlasBarDescriptionScaffold`, `sceneAtlasDefaultTags`, `parseSceneAtlasBarTemplateFromCompletionEffects`). The create/attach flows merge this alongside existing **`sceneGridDeck`** `{ instanceId, cardId, instanceSlug }` in `completionEffects`.

## Safety & Consent (product note)

- Default prompts should be **structural** (“What boundary matters here?” “What’s the emotional beat?”) not **graphic**.
- **Private** BARs by default; any **shared** deck requires explicit visibility and instance membership.
- Align with operator **Terms** for user-generated content.
