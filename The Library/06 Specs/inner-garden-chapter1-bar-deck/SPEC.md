---
type: spec
spec_kit_id: inner-garden-chapter1-bar-deck
title: "Inner Garden — Chapter 1: BAR → Deck (Pallet Town vertical slice)"
created: 2026-05-07
last_reviewed: 2026-05-07
integrated_6gm: true
tags:
  - inner-garden
  - bars-engine
  - deck
  - chapter-1
status: draft
---

# Spec: Inner Garden — Chapter 1 BAR → Deck vertical slice

## Purpose

Deliver a **playable first chapter** on the **existing garden map** (Pallet Town analogue) where the player’s **primary authored input is a BAR** (not free-form journal), that input **materializes as cards in a persistent deck**, and at least **one non-combat gameplay surface** consumes a card so the loop is real before **any** battle system exists.

**Problem**: The live prototype still centers **journal → seed → farm** while design canon and **bars-engine** converge on **BAR → deck → representation of world systems**. Without a thin end-to-end slice, card combat and 321 work risk building on sand.

**Practice**: Spec-first; **data contract before UI polish**; **offline-first** (`SaveManager` + localStorage); alignment with **`BARS_ENGINE_INNER_GARDEN_GAP.md`** (shared JSON contract when ready, not day-one server coupling).

## Design decisions

| Topic | Decision |
|-------|----------|
| Input canon (Ch.1) | **BAR capture** is the **primary** player-authored loop; legacy **journal** may remain internally for one release as migration shim **or** map journal UI to BAR fields—see §Migration. |
| Cards vs combat | **Cards and deck persistence ship before** `BattleSystem` / time-freeze hand. No encounter map required for this spec. |
| Garden scope | **Single scene** (current inner-garden map); chapter beats are **flags + NPC/dialog**, not new nation tilesets. |
| Deck model | **Collection + ordered deck list** (or draw pile stub); minimum fields in §API Contracts. **Empty deck** behavior per `DESIGN.md` / Q18: no silent filler for **future** combat; for **this** slice, “empty” only affects **non-combat** actions that require a card. |
| 321 unlock | **Out of scope for Phase A**; **Phase B** (same spec, later tasks): unlock **321** (or first 321-equivalent) as **chapter capstone** tied to story flags, granting **skills/abilities** without requiring combat. |
| bars-engine bridge | **L0**: BAR JSON shape **documented** to match bars-engine export when available; **L1** (optional same release): import file or paste JSON in dev tools—**not** required for Phase A acceptance. |
| Journal → BAR (Ch.1 implementation) | **Migration B (dual write):** BAR UI replaces the **player-facing** journal flow (key **J**). Submitting a BAR creates `BarRecord` + minted `GameCard` **and** calls `EmotionSystem.recordEmotion` with the same emotion/intensity and description = concatenated B/A/R so **seeds / farming** keep working until **Migration C** lands. |
| Spent cards | **Tombstone:** `spent: true` remains in `deck.cards` and **order** for provenance; Deck UI shows spent state, no silent deletion. |
| Rate limits (Ch.1) | **Max 24** `BarRecord` entries per save for Phase A (soft cap; adjust later). **One minted card per BAR** (`mintedBarIds` / idempotent mint). |
| Merge gate | Phase A PRs require **L3 manual script** pass ([TASKS.md](./TASKS.md) A17 / `docs/MANUAL_TEST-ch1-bar-deck.md`). |
| Shaman / player text | First **non-combat spend** must surface **at least one line** from the card `body` (BAR fragment) in the feedback string (HUD or dialog)—not a generic “+1” with no quote. |
| Sage / claims | External copy and README: **Chapter 1 deck slice** — combat, full alchemy-on-cards, and nation-flavored BAR→seed bias are **not** claimed until implemented. |
| Card kinds | All `kind` values live in **`js/data/BarDeckConstants.js`** (`CARD_KIND`); do not scatter magic strings. |
| Deck owner | **`DeckSystem`** owns bars, cards, order, mint/spend; Game wires it—single owner (see [PLAN.md](./PLAN.md)). |

## Integrated 6-face GM advisory

This section **folds in** the review from [SIX-GM-ANALYSIS.md](./SIX-GM-ANALYSIS.md) (archived stub) so the spec stands alone.

| Face | Integration |
|------|-------------|
| **Architect** | Phase A/B boundary locked; enums in `BarDeckConstants.js`; `DeckSystem` sole owner of deck state; save keys `bars` + `deck.{cards,order,mintedBarIds}`. |
| **Regent** | Preserve garden, `SaveManager`, Menu, quest flags; elevate L3 manual as **merge gate**; autosave on BAR, mint, spend. |
| **Challenger** | v1→v2 save migration **must not** nuke saves (see NFR1); mid-flow reload must not duplicate BAR (submit is atomic on Enter); max BAR count; spent = tombstone; Phase B 321 rewards must **stack or replace** explicitly when designed—document in Phase B PR. |
| **Diplomat** | `SPEC_DECK_MECHANICS.md`: add one-line that ♦ / “journal” language maps to **BAR fields** for Show Up—see that file’s header note. |
| **Shaman** | BAR capture copy framed as **invocation** (titles, steps), not a tax form; spend feedback quotes the player’s words (FR-A5b below). |
| **Sage** | “Everything is a card” = **north star**; Phase A only promises **BAR → one card kind → one spend**. |

**Cross-face priority (pre-flight):** Save migration + spent-card tombstone policy + single `DeckSystem` owner are **blocking** for Phase A merge.

## API contracts (data-first)

> These are **in-game persistence contracts**, not HTTP routes. Version with `SaveManager.SAVE_VERSION` bump on breaking changes.

### `BarRecord` (authored capture)

**Minimum viable fields** (extend when aligning to bars-engine Prisma/export):

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `id` | string (UUID) | yes | Stable id |
| `createdAt` | number (epoch ms) | yes | |
| `behavior` | string | yes | B — player text |
| `activation` | string | yes | A — context / trigger |
| `result` | string | yes | R — outcome / feeling |
| `emotionTag` | string \| null | no | Maps to existing `Emotions` / nation flavor bias later |
| `source` | `"player"` \| `"import"` | yes | Default `player` |

**Derived**: none required in Phase A; optional `normalizedSlug` for analytics later.

### `GameCard` (deck object)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `id` | string (UUID) | yes | |
| `createdAt` | number | yes | |
| `provenanceBarId` | string \| null | yes | null only for dev-granted story cards |
| `title` | string | yes | Short display |
| `body` | string | no | Flavor or quoted BAR fragment |
| `kind` | string | yes | e.g. `"witness"`, `"seed"`, `"boon"` — start with **one** kind for Ch.1 |
| `tags` | string[] | no | nation, element, suit hooks for `SPEC_DECK_MECHANICS.md` later |
| `spent` | boolean | no | if single-use consumable outside combat |

### Save blob extension (`inner_garden_save`)

**New top-level keys** (names illustrative—pick one naming style in implementation):

```json
{
  "version": 2,
  "bars": [ "BarRecord" ],
  "deck": {
    "cards": [ "GameCard" ],
    "order": [ "card-id-1", "card-id-2" ],
    "mintedBarIds": [ "bar-uuid-…" ]
  }
}
```

- **FR persistence**: New game → `bars: []`, `deck.cards: []`. After first BAR + mint, reload tab → **cards and bars still present**.

### `mintCardFromBar(barId) → GameCard`

**Input**: `barId`  
**Output**: `GameCard`  
**Rules**: **One card per BAR** (idempotent mint: second call returns existing card or `already_minted`).

### Non-combat card spend (Phase A)

**Contract**: `DeckSystem.trySpendCardForCultivationReflection(cardId, cultivation)` — sets `spent`, grants small cultivation XP, returns `{ ok, message?, reason? }` for HUD (message **must** satisfy **FR-A5b**).

**Input**: `cardId`, optional context id  
**Output**: `{ ok: boolean, reason?: string }`  
**Acceptance**: Spending sets `spent: true` (**tombstone** in `deck.cards`), persists in save, **visible** in deck UI.

- **FR-A5b (Shaman):** Spend feedback (HUD notify or dialog) **includes** a short quoted fragment from `card.body` or the BAR **R** line—not generic numbers alone.

## User stories

### P1: Write a BAR

**As a** new player, **I want** to record a situation using B/A/R fields, **so that** my progress feels tied to structured reflection (aligned with bars-engine).

**Acceptance**: Submitting valid BAR creates a `BarRecord`, shown in a list or confirmation; autosave runs.

### P2: See it become a card

**As a** player, **I want** my BAR to **create a card** in my deck, **so that** “everything becomes a card” is believable in chapter 1.

**Acceptance**: After mint, deck UI shows new card title + link to BAR id; reload preserves.

### P3: Use a card outside battle

**As a** player, **I want** to **use** one card for a **garden or cultivation benefit**, **so that** cards matter before combat exists.

**Acceptance**: One implemented spend path + feedback (HUD toast or dialog line); save reflects spent state.

### P4: Playable chapter rail (Pallet Town)

**As a** player, **I want** a short **quest sequence** on the starter map, **so that** I know why BARs and cards exist.

**Acceptance**: Story flags gate: intro → open BAR UI → complete first BAR → mint → optional NPC line from `StoryScript` / `Quests.js`; chapter flag `ch1_bar_deck_complete` or equivalent set at slice end.

## Functional requirements

### Phase A — Vertical slice (this spec’s MVP)

- **FR-A1**: BAR UI (modal or panel): B, A, R text inputs + submit + validation (non-empty fields).
- **FR-A2**: `BarRecord` storage in memory + **serialize/deserialize** via `SaveManager` with version handling.
- **FR-A3**: `GameCard` template + mint from BAR after scripted beat or immediate post-submit (design pick in `PLAN.md`).
- **FR-A4**: Deck tab (or extend existing **Menu** tab): list cards, show title + kind + spent state.
- **FR-A5**: **One** non-combat spend action wired to deck.
- **FR-A6**: Quest/story flags for chapter rail; no new maps.
- **FR-A7**: Update `BACKLOG.md` / `DESIGN.md` cross-links only if a single sentence avoids drift (optional).

### Phase B — Chapter capstone (same kit, later)

- **FR-B1**: **321** (or minimal “shadow / transformation” step) **unlocked** by flags after Phase A beats; ties to **skill or ability** bump (cultivation stat, tool tier, or new **ability** bit on player).
- **FR-B2**: Document mapping to bars-engine `/shadow/321` concepts in `REFERENCES` appendix (no full engine integration required).

## Non-functional requirements

- **NFR1**: **Backward compatibility**: Saves at **version 1** upgrade in-memory to **version 2** with empty `bars` and `deck` (`cards`, `order`, `mintedBarIds`); then apply normally—**do not** return `null` solely due to v1→v2 bump. Unknown future versions may still reject with warning.
- **NFR2**: **No network dependency** for Phase A acceptance.
- **NFR3**: BAR/card text is **player-generated**; treat as sensitive in any future sync—stay local until a bridge spec exists.

## Verification tests

| Level | Name | What it checks |
|-------|------|----------------|
| L1 | Smoke | Game boots; no import errors; menu opens |
| L2 | Data contract | Serialized save JSON includes `bars` and `deck` with expected shapes after actions |
| L3 | Integration | Create BAR → mint card → spend card → hard reload → state matches |
| L4 | UI | Manual or agent-browser: BAR flow + deck tab visible (document URL if hosted) |

**Rule**: Add **automated** L2/L3 where the repo already has a test runner for inner-garden; if none, **L3 manual script** in `TASKS.md` until CI exists.

## Migration: journal → BAR

| Approach | When to use |
|----------|-------------|
| **A — Replace UI** | Journal panel becomes BAR panel; `emotion.journalEntries` deprecated or filled from BAR `result` only for one release. |
| **B — Dual write** | BAR submit also creates legacy seed entry if farming still requires journal-shaped data—**temporary**. |
| **C — Farm reads BAR** | `EmotionSystem` (or successor) derives seed stats from latest BAR or linked `GameCard`—**preferred** long-term; may slip to post–Phase A. |

**Decision record (locked for Phase A):** **B — Dual write** (see Design decisions table). `PLAN.md` reflects this.

## Dependencies

- Code: `The Library/04 Quests/Campaigns/inner-garden/` (`SaveManager.js`, `EmotionSystem.js`, `Menu.js`, `QuestSystem.js`, `StoryScript.js`, `Quests.js`).
- Design: `inner-garden/DESIGN.md`, `inner-garden/SPEC_DECK_MECHANICS.md`, `inner-garden/BARS_ENGINE_INNER_GARDEN_GAP.md`.
- External (informative): bars-engine BAR + 321 routes per gap doc—not blocking Phase A.

## References

- [SIX-GM-ANALYSIS.md](./SIX-GM-ANALYSIS.md) — archived pointer; substantive text lives in **§ Integrated 6-face GM advisory** above.
- [SIX-GM-BRIDGE-BARS-ENGINE.md](./SIX-GM-BRIDGE-BARS-ENGINE.md) — six-face **humane bridge** (inner-garden ↔ bars-engine charge capture / Hand).
- [BAR_CHARGE_BRIDGE.md](./BAR_CHARGE_BRIDGE.md) — L0/L1 vocabulary + export JSON contract for inner-garden BARs and bars-engine `charge_capture`.
- `The Library/04 Quests/Campaigns/inner-garden/BARS_ENGINE_INNER_GARDEN_GAP.md` — BAR ↔ seed/card alignment, 321 pointer.
- `The Library/04 Quests/Campaigns/inner-garden/SPEC_DECK_MECHANICS.md` — suits; update when ♦ / journal language is reconciled with BAR.
- `The Library/06 Specs/SPEC-TEMPLATE.md` — canonical spec structure.
- `The Library/05 Research/STRAND-Obsidian-Multi-Context-Library.md` — spec kit authority pattern (`spec.md` / `plan.md` / `tasks.md` naming in other repos).

## Open questions

- [ ] Exact **bars-engine** BAR field parity (names, max lengths, optional metadata).
- [ ] Harvest producing **additional** card types in the same chapter (beyond first mint from BAR)—deferred.
- [x] **Non-combat spend (Phase A):** **Cultivation reflection** — spend one **witness** card from **Menu → Deck** for **+12 cultivation XP** and HUD copy that **quotes** `card.body` / BAR fragment (**FR-A5b**).
