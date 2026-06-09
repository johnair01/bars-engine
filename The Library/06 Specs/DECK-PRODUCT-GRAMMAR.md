---
type: spec
title: Deck Product Grammar
created: 2026-05-25
status: canonical
supersedes:
  - ../04 Quests/Friendcraft Game/DESIGN-BRIEF-FRIENDCRAFT-64.md (provenance +12 option)
related:
  - DECK-PRODUCT-GRAMMAR-6FACE-ANALYSIS.md
  - unstuck-deck/SPEC.md
  - ../04 Quests/Friendcraft Game/FRIENDCRAFT-14_TWO_DECK_ARCHITECTURE.md
  - ../07 Book OS/07 Book OS/HEXAGRAM_CARD_MANUSCRIPT_INTEGRATION_SPEC.md
  - ../../bars-engine/.specify/specs/creator-scene-grid-deck/spec.md
  - ../../bars-engine/.specify/specs/deck-product-grammar/spec.md
tags: [deck-grammar, friendcraft, allyship, relationships, polarity]
---

# Deck Product Grammar

One pattern across craft lines, books, and games.

---

## Three layers

| Layer | Size | Role | Storage |
|-------|------|------|---------|
| **Intake** | Dynamic | Who/what you practice with | Friend cards, ally list, parts roster, parts-of-partner map |
| **Application** | **52** | Moves in the field | `deck.json` / `BarDeck` application deck |
| **Exploration** | **64** | Book / deep layer | Published oracle JSON; earn via read + capture |

```
INTAKE (dynamic)  →  APPLICATION (52)  →  EXPLORATION (64)
   collect               practice              book integrates
```

**Book** owns exploration 64. **Game** owns intake + application 52.

---

## Intake variants

| `intake_kind` | Collects | Used by |
|---------------|----------|---------|
| `people_list` | Whole people | Friendcraft game, Allyship game, Flirtcraft, Networking |
| `parts_of_self` | Interior parts | Parts / inner work |
| `parts_of_other` | Parts of a partner | **Relationships hybrid** |
| `single_person` | One named person (collapsed intake) | Named-person allyship (Casey) |

---

## Product lines

| Line | Intake | Application 52 | Exploration 64 |
|------|--------|------------------|----------------|
| **Mastering Allyship** | Ally list (game) | Workshop / practitioner deck | MTGOA hexagram (Gate × Chapter) |
| **Mastering Friendcraft** | Friends deck (game) | Quest deck | **Friendcraft book oracle** — I Ching 8×8 (trigram identities TBD) |
| **Mastering Relationships** | Parts of other | Practice deck | Relationships book oracle — TBD |
| **Parts work** | Parts of self | Practices deck | **BAR creation** deck (64) |
| **Flirtcraft / Networking** | People list | Practice deck | Book oracle when book exists |
| **Unstuck Deck** | Stuckness self-sort | 48 Door/Gate journey cards + 4 meta cards | Future deeper journey / book layer TBD |

**Named-person allyship (Casey):** `single_person` intake + application 52 only (gift ritual). Not Friendcraft.

---

## What 64 means (same count, different job)

| Kind | Example | Earn mechanic |
|------|---------|---------------|
| `book_oracle` | MTGOA hexagram, Friendcraft book | BAR capture / read gate |
| `bar_creation` | Parts exploration 64 | Draw → BarDraft |
| ~~rank extension (+12)~~ | **Retired** — was `FRIENDSHIP_64` stub | — |

**Campaign hub 64 slots** (`CAMPAIGN_LATTICE_64` in engine) is **not** craft-line exploration — it is a 64-cell binding grid for campaign instances. Do not conflate with book 64.

---

## Scene Atlas & polarity (cross-cutting mechanic)

**Read first:** `POLARITY-TYPES-CANON.md` — **structural** polarity (grid mapping) ≠ **governing** polarity (teaching tensions). Scene Atlas is structural only.

Scene Atlas is **not** a craft-line product. It teaches **deck literacy** + **structural polarity resolution**.

### What Scene Atlas has that craft decks lack

Four application suits are a **Cartesian product** of two axis pairs:

```
pair1 (−/+)  ×  pair2 (−/+)  →  4 quadrants  →  4 suit keys
```

Resolution order (`polarities.ts`):

1. Adventure / `gridPolarities` in `storyProgress` (Wake Up orientation)
2. Nation element + playbook archetype trigram (derived)
3. Default: Top/Bottom × Lead/Follow

**Storage:** stable `BarDeckCard.suit` keys; **display** from resolved pairs.

### Integration roadmap (polarity → craft lines)

| Phase | Work |
|-------|------|
| **Now** | Scene Atlas owns polarity; WCGS craft lines use fixed suit semantics |
| **Next** | Extract `GridAxisPair` + resolution into shared `deck-polarity` module |
| **Relationships** | Parts-of-partner intake may use **pair1 = self/other**, **pair2 = surface/depth** (design session) |
| **Friendcraft book 64** | **I Ching 8×8 confirmed** — friendship-native lower/upper 8 TBD after governing interview (`I-CHING-EXPLORATION-STRUCTURE.md`) |
| **Application 52** | Optional per-instance `ResolvedGridPolarities` overlays suit **labels**, not WCGS meaning |

**Principle:** Polarity answers *how the four suits are labeled for this player*; WCGS answers *what the four suits do developmentally*. Scene Atlas proved the engine; craft lines adopt gradually.

Scene Atlas remains the **entry path** — not optional forever, but the place polarity is learned before craft-line decks.

---

## Engine mapping (bars-engine)

| `DeckType` | Layer | Notes |
|------------|-------|-------|
| `SCENE_ATLAS` | Application 52 + polarity | Onboarding / literacy |
| `APPLICATION_52` | Application 52 | Craft + campaign 52-slot |
| `CAMPAIGN_LATTICE_64` | 64 binding slots | Campaign hub only |
| `EXPLORATION_64` | Exploration 64 | Book oracle snapshots (future BarDeck or static JSON) |

Published readers: `/decks/[slug]` (Casey `/oracle` alias).

`deck.json` metadata:

```json
{
  "product_line": "mastering_allyship",
  "deck_layer": "application",
  "intake_kind": "single_person",
  "exploration_deck_slug": "mtgoa-hexagram-64"
}
```

---

## Open design questions

1. **Governing polarities** — interview Wendell per line (`GOVERNING-POLARITIES-INTERVIEW-PROTOCOL.md`); seed: allyship care↔impact, friendcraft safety↔growth
2. **Friendcraft 8+8 trigram identities** — after governing pass; same I Ching structure as MTGOA, different semantics (`I-CHING-EXPLORATION-STRUCTURE.md`)
3. **MTGOA domain integration** — hexagram tasks + Show Up domains (`POLARITY-DESIGN-SESSION-BRIEF.md` Phase B)
4. **Friendcraft book locale** — journey shape (forest-like?) distinct from allyship chapter names
5. **Scene Atlas gate** — structural literacy only; required before craft line pick?
6. **Relationships parts intake UX** — hybrid spec before API

---

## References

- Six-face analysis: `DECK-PRODUCT-GRAMMAR-6FACE-ANALYSIS.md`
- Allyship exploration: `HEXAGRAM_CARD_MANUSCRIPT_INTEGRATION_SPEC.md`
- Scene Atlas polarity: `bars-engine/.specify/specs/creator-scene-grid-deck/spec.md`
