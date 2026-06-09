---
type: spec
title: I Ching 8×8 Exploration Structure
created: 2026-05-25
status: canonical — structure confirmed; Friendcraft axes pending
authority: Wendell session 2026-05-25
related:
  - FORMAL-STRUCTURAL-POLARITY-MAPPING.md
  - POLARITY-TYPES-CANON.md
  - DECK-PRODUCT-GRAMMAR.md
  - ../07 Book OS/07 Book OS/BARS_ICHING_ARCHITECTURE.md
  - POLARITY-THINKING-RESEARCH.md
tags: [iching, exploration-64, allyship, friendcraft, book-oracle]
---

# I Ching 8×8 Exploration Structure

**Decision (2026-05-25):** The **I Ching 8×8 matrix** (lower trigram × upper trigram → 64 cells) is the canonical **exploration layer** structure for book-integrated oracles in craft lines where the book owns depth.

**Confirmed for:**

- **Mastering Allyship** — MTGOA hexagram deck (Gate × Chapter)
- **Mastering Friendcraft** — Friendcraft book oracle (trigram identities **TBD**)

**Why I Ching works here:** It provides an **exhaustive combinatorial topology** for exploration — every cell is a distinct state of two interacting dimensions, suitable for book-paced discovery, BAR capture, and re-read gates. See `POLARITY-THINKING-RESEARCH.md` §2.6.

**What I Ching is NOT in BARs:** Divination authority, governing polarity substitute, or proof that allyship and friendcraft share the same locale.

---

## 1. Shared structural pattern

```
EXPLORATION_64 := lower_axis[8] × upper_axis[8]

Each cell:
  id:           stable key (hexagram index or row_col)
  lower:        one of 8 lower-trigram identities
  upper:        one of 8 upper-trigram identities
  content:      book card (prompt, task, image, governing fields)
  earn_gate:    read milestone / BAR capture (per product)
```

Same algebra as Scene Atlas (Cartesian product), different scale and semantics:

| Layer | Dimensions | Cells |
|-------|------------|-------|
| Application 52 | 2 × 2 × 13 | 52 |
| Exploration 64 | 8 × 8 | 64 |

---

## 2. Mastering Allyship — MTGOA (reference implementation)

**Source of truth:** `../07 Book OS/07 Book OS/BARS_ICHING_ARCHITECTURE.md`

| Axis | Set | Mapping |
|------|-----|---------|
| **Lower (inner)** | 8 Gates | Earlier Heaven sequence — allyship interior encounters (Skeptic, Victim, …) |
| **Upper (outer)** | 8 Chapters | Later Heaven / King Wen — book journey (Forest, Shaman, …) |

**Example cell:** Gate 1 (Skeptic) × Ch1 (Forest) → Hexagram 63 — *Skeptic in the Forest*.

**Governing polarity:** Care↔impact and allyship domains live in **card fields and chapter teaching**, not in the Gate×Chapter multiplication itself.

---

## 3. Mastering Friendcraft — book oracle (structure confirmed, content pending)

**Decision:** Friendcraft book exploration 64 uses **8×8 I Ching structure**, not an alternate topology (e.g. plain 2×2×16 or rank extension).

**Not decided yet (requires governing interview + locale session):**

| Question | Status |
|----------|--------|
| Lower 8 identities | **TBD** — friendship-native, not MTGOA gates |
| Upper 8 identities | **TBD** — likely book chapter / journey beats (forest-like **shape** OK, different **place/name**) |
| Locale name | **TBD** — may share journey archetype (threshold → walk → return) without copying "The Forest" |
| Governing fields on cards | safety↔growth + follow-ups from register |

### Design constraints (from Wendell)

1. **Same exploratory structure** as MTGOA — players/learners who earn book 64 get a familiar navigation grammar
2. **Different semantics** — friendcraft trigrams, chapter names, and card copy are authorship, not copy-paste
3. **Governing polarities inform content** — they do not replace lower/upper axis definition
4. **Game ≠ book** — Friendcraft game owns intake + application 52; book owns exploration 64

### Candidate workflow

```
Phase A: Governing interview (safety↔growth + supplements)
    ↓
Phase B: Name lower 8 + upper 8 (friendship locale)
    ↓
Phase C: 64-cell authoring grid + bars-engine EXPLORATION_64 seed
    ↓
Phase D: Oracle reader at /decks/friendcraft-book-64 (or slug TBD)
```

---

## 4. Engine & storage

| Field | Value |
|-------|-------|
| `DeckType` | `EXPLORATION_64` |
| `deck_layer` | `exploration` |
| `exploration_deck_slug` | `mtgoa-hexagram-64` (allyship); `friendcraft-book-64` (TBD) |
| Reader route | `/decks/[slug]` (Casey `/oracle` alias) |

Metadata pattern (`DECK-PRODUCT-GRAMMAR.md`):

```json
{
  "product_line": "mastering_friendcraft",
  "deck_layer": "exploration",
  "intake_kind": "people_list",
  "exploration_deck_slug": "friendcraft-book-64",
  "exploration_structure": "iching_8x8"
}
```

---

## 5. Classical I Ching relationships (optional depth layer)

For book OS authors — not required for MVP reader:

| Derived form | Chinese | Meaning |
|--------------|---------|---------|
| Inverse | 錯卦 Cuò Guà | All lines flip — opposite energy |
| Reverse | 綜卦 Zōng Guà | Hexagram turned upside down — other's perspective |
| Nuclear | 互卦 Hù Guà | Inner four lines — hidden core |

MTGOA may use these in manuscript integration; Friendcraft TBD. External reference: [Master Sean Chan — 64 hexagrams](https://www.masterseanchan.com/iching-64-hexagrams/).

---

## 6. Anti-patterns

| Anti-pattern | Correct approach |
|--------------|------------------|
| "Friendcraft doesn't need I Ching" | Structure confirmed — differentiate via **content**, not topology |
| "Friendcraft uses same gates as allyship" | Same **math**, different **8+8 identities** |
| "Hexagram 37 = safety pole" | Cell address ≠ governing polarity |
| "+12 provenance pack as 64" | Retired — exploration 64 is book oracle |

---

## 7. Open questions

1. Friendcraft lower 8 — faces? friendship modes? Dunbar tiers? (**interview**)
2. Friendcraft upper 8 — chapter names aligned to journey locale (**interview**)
3. Shared `exploration-deck-polarities` types in bars-engine (**engineering**)
4. Earn path from quest 52 → book 64 (**game + book OS**)

---

## References

- Formal mapping: `FORMAL-STRUCTURAL-POLARITY-MAPPING.md`
- MTGOA architecture: `BARS_ICHING_ARCHITECTURE.md`
- Polarity types: `POLARITY-TYPES-CANON.md`
- Research: `POLARITY-THINKING-RESEARCH.md`
- Session brief Phase B: `POLARITY-DESIGN-SESSION-BRIEF.md`
