---
type: design-analysis
topic: deck-product-grammar
method: six-game-master-integral-design
date: 2026-05-25
hexagram: "3 — Difficulty at the Beginning (Water over Thunder)"
status: draft — integration advisory
related:
  - ../04 Quests/Friendcraft Game/DESIGN-BRIEF-FRIENDCRAFT-64.md
  - ../04 Quests/Friendcraft Game/FRIENDCRAFT-14_TWO_DECK_ARCHITECTURE.md
  - ../07 Book OS/07 Book OS/HEXAGRAM_CARD_MANUSCRIPT_INTEGRATION_SPEC.md
  - ../04 Quests/Casey's Birthday Deck/docs/SPEC-oracle-deck-editor-publisher.md
  - ../../bars-engine/.specify/specs/dominion-style-bar-decks/spec.md
  - ../../bars-engine/.specify/specs/creator-scene-grid-deck/spec.md
tags: [deck-grammar, 6-face, integration, friendcraft, allyship, relationships]
---

# Deck Product Grammar — Six Game Master Analysis

**Cast statement:** We are building a repeatable three-deck grammar (Intake → Application 52 → Exploration 64) across craft lines and book/game pairs — and we need to integrate it without breaking what already ships (Scene Atlas, Casey oracle, MTGOA hexagrams, Friendcraft game).

**Hexagram:** #3 — Difficulty at the Beginning. New order is visible; integration friction is expected, not a sign the grammar is wrong.

---

## The grammar (what we're doing)

| Layer | Size | Role | Examples |
|-------|------|------|----------|
| **Intake** | Dynamic | Collect targets of practice | Friends, allies, crushes, network contacts, parts (self), parts (of partner) |
| **Application** | **52** | Practical moves in the field | Quest deck, allyship practice, flirt practice, parts practices |
| **Exploration** | **64** | Book / deep layer | MTGOA hexagram oracle, Friendcraft book oracle, Relationships book oracle, Parts BAR-creation deck |

**Intake variants:**

| Variant | Used by |
|---------|---------|
| Whole people | Friendcraft game, Allyship game, Flirtcraft, Networking |
| Parts of self | Inner work / parts line |
| Parts of other | **Relationships hybrid** — map partner's parts, practice against that map |
| Single person (collapsed intake) | Named-person allyship (Casey) |

**Book vs game:** The **book** owns the 64 and the teaching frame. The **game** owns intake + 52 play loops. Same grammar, different emphasis.

---

## 🏛 Regent — What must we preserve?

### Already working — do not recreate

| Asset | What it is | Preserve as |
|-------|------------|-------------|
| **Casey `/oracle`** | Named-person allyship **application 52** + reader | Reference impl for `application` + `single_person` intake |
| **MTGOA hexagram 64** | Allyship **exploration** deck (Gate × Chapter) | Canonical `exploration_kind: book_oracle` for allyship line |
| **Oracle editor (vault)** | Author → publish → reader pipeline | Port to bars-engine as deck studio; don't fork |
| **ALLYSHIP_DECK workshop** | Human intake → 52 assembly | Becomes intake + application authoring curriculum |
| **Friendcraft Friends + Quest** | Intake + application 52 | Game layer; don't merge into one deck |
| **Scene Atlas** | BAR binding grid (`SCENE_ATLAS`) | Parallel track — **deck literacy** onboarding, not craft-line product |
| **321 → BAR pipeline** | Charge → draft → library | Feeds **Parts 64 (BAR creation)** and campaign decks |
| **Dominion Library → Deck → Hand** | BAR scarcity model | Intake ≈ library of targets; application 52 ≈ equipped deck |

### What must not be compromised

1. **WCGS four moves** traceable on every application card.
2. **Provenance as score** in Friendcraft game — not stats.
3. **Named-person allyship** stays gift/ritual — not generalized into Friendcraft intake.
4. **MTGOA 64** stays book-earned hexagram content — not repurposed as generic "+12."
5. **Graduation as win** in Friendcraft game.

### Regent integration advice

- **Do not rename** `FRIENDSHIP_52` / `FRIENDSHIP_64` in Prisma to mean "application/exploration" globally — those names already imply Relationships line. Add **`deck_layer`** and **`product_line`** fields instead of overloading enum values.
- **Ship grammar as documentation + schema** before migrating all decks. Casey oracle stays live; migrate behind flags.
- **Scene Atlas stays** the onboarding golden path for "what is a deck" — craft lines are the advanced course.

---

## 🏗 Architect — What structure holds this?

### Target schema (bars-engine)

```
DeckProduct {
  product_line:   mastering_allyship | mastering_friendcraft | mastering_relationships
                | flirtcraft | networking | parts_work | ...
  product_form:   book | game | both

  intake_deck:    IntakeDeckConfig     // dynamic — not 52/64 fixed
  application:    FixedDeck { size: 52, slug, deck.json }
  exploration:    FixedDeck { size: 64, slug, deck.json, exploration_kind }
}

IntakeDeckConfig {
  intake_kind:    people_list | parts_of_self | parts_of_other | single_person
  storage:        friendcraft_deck | ally_intake | relationship_parts | ...
}

FixedDeck.exploration_kind:
  book_oracle     // MTGOA hexagram, Friendcraft book 64, etc.
  bar_creation    // Parts line 64
```

### Map existing engine → grammar

| Existing | Grammar layer | Action |
|----------|---------------|--------|
| `public/oracle/deck.json` + `/oracle` | Allyship application 52, `single_person` | Tag metadata; generalize reader to `/decks/[slug]` |
| `HEXAGRAM_CARDS_CH*.md` (vault) | Allyship exploration 64 | Publish snapshot; earn via BAR gate capture |
| `DeckType.FRIENDSHIP_52` | Relationships **application** 52 | Rename in docs; enum alias OK short-term |
| `DeckType.FRIENDSHIP_64` | **Misaligned** — stub is 52+12 ranks, not book 64 | **Stop** treating as exploration; replace content or re-scope to Relationships extension only |
| `friendcraft_deck` localStorage | Friendcraft **intake** + provenance | Promote to first-class API/model |
| Friends Deck + Quest (spec) | Intake + application 52 | Keep; link exploration 64 when Friendcraft book ships |
| Scene Atlas `SCENE_ATLAS` | Onboarding / BAR literacy | Not a craft-line deck — separate `product_line: scene_atlas` |
| Campaign deck wizard | Admin **application** seeding | Pattern for intake wizard, not the consumer product |
| `deck-templates/` registry | Application 52 starters | Add `product_line` + `intake_kind` tags |

### Architect integration advice (phased)

**Phase 0 — Vocabulary lock (no code)**  
Publish grammar doc; tag every existing spec with `intake | application_52 | exploration_64`.

**Phase 1 — Reader generalization**  
`/decks/[slug]` reader (Casey → `casey-allyship` or keep `/oracle` alias). Same `OracleReader` component.

**Phase 2 — Metadata on deck.json**  
```json
{
  "product_line": "mastering_allyship",
  "deck_layer": "application",
  "intake_kind": "single_person",
  "for": "Casey",
  "exploration_deck_slug": "mtgoa-hexagram-64"
}
```

**Phase 3 — Intake API**  
Friendcraft game intake first (`FriendCard`, `ProvenanceEntry` from Architect face card schema). Relationships hybrid = `RelationshipPart` entity on intake.

**Phase 4 — Exploration 64 publish**  
MTGOA hexagram snapshot → static JSON + earn flags in user progress (gate × chapter unlock).

**Phase 5 — Editor port**  
Vault oracle editor → multi-slug studio for application 52 authoring.

**Do not:** Build one mega `DeckType` enum with 20 values. Use `(product_line, deck_layer, size)` compound key.

---

## ⚔️ Challenger — What will break if we ignore it?

### Failure modes

| # | Failure | Why |
|---|---------|-----|
| 1 | **64 means three different things** | Allyship book oracle vs Relationships +12 stub vs "we need 64 for parity" |
| 2 | **Intake collapsed into BarDeckCard rows** | Intake is dynamic (150 friends, N parts); 52/64 are fixed products |
| 3 | **Friendcraft game absorbs the book** | Game provenance mechanics applied to exploration 64 — wrong layer |
| 4 | **Scene Atlas mistaken for craft deck** | Players think grid binding = Friendcraft; confuses BAR literacy with relational decks |
| 5 | **Casey pattern over-generalized** | Every line becomes named-person 52; loses practice + book 64 |
| 6 | **Parts 64 confused with Allyship 64** | BAR creation deck vs hexagram oracle — same count, different output |
| 7 | **Relationships hybrid flattened** | "List of partners" instead of parts-of-partner map — loses the design |

### Challenger integration advice

- **Kill** the narrative that `FRIENDSHIP_64` = exploration. Either rename to `RELATIONSHIPS_EXTENDED_52` (+12) or write real Relationships **book** 64 separately.
- **Gate** every new deck route: must declare `product_line`, `deck_layer`, `intake_kind`.
- **Rejection test for application cards:** "Could this card apply without an intake target?" If yes for Relationships hybrid, it's too generic.
- **Don't ship Flirtcraft/Networking** until intake_kind is spec'd — whole-people intake reuses Friendcraft engine; parts-of-other does not.

---

## 🎭 Diplomat — How does this bridge what exists?

### Bridge map

```
MTGOA Book ──64──► Allyship exploration (hexagram) ──earn──► BAR capture
       │
       ├──52──► Allyship application (workshop / practitioner)
       │              │
       │              └──named──► Casey oracle (single_person intake)
       │
       └──game──► Allyship intake (ally list) + 52 practice

Friendcraft Book ──64──► Friendship exploration (TBD matrix — not I Ching clone)
       │
       └──game──► Friends intake + Quest 52 + optional Allyship bridge

Relationships ──intake: parts_of_other──► 52 practice ──64──► book exploration

Parts work ──intake: parts_of_self──► 52 practice ──64──► BAR creation

Scene Atlas ──onboarding──► "deck literacy" ──feeds──► craft line choice
```

### Diplomat integration advice

| From | To | Bridge rule |
|------|-----|-------------|
| Scene Atlas | Craft lines | Quest: "Choose your craft" after first BAR bind |
| Friendcraft game | Allyship named | Optional Grow Up depth → offer allyship pull; never merge |
| Friendcraft game | Friendcraft book | Shared WCGS; book 64 linked in app as "read deeper" |
| MTGOA reader | Allyship 64 | BAR gate prompt → unlock hexagram card (existing spec) |
| Casey oracle | Allyship workshop | Workshop output format = same `deck.json` schema |
| OracleReader | Friendcraft save | `friendcraft_deck` localStorage → intake API migration path |
| 321 pipeline | Parts 64 | Exploration draw produces BarDraft candidate |
| Calrunia skins | All fixed decks | Same JSON, swap `image_file` + flavor; intake unchanged |

### Product line clarity (teaching)

> **Allyship** — justice practice (book + game).  
> **Friendcraft** — friendship practice (book + game).  
> **Relationships** — intimate bond, **parts of the other** (hybrid intake).  
> **Flirtcraft / Networking** — whole-people intake, different application copy.  
> **Parts** — interior intake, 64 = BAR factory.

---

## 🌊 Shaman — What must be honored? What shadows?

### What must be honored

- **The gift moment** (Casey, named-person allyship) — application 52 arrives as intentional object.
- **The book as portal** — 64 is not grind; it's "you read far enough to receive this question."
- **Graduation** — Friendcraft game celebrates relationships that outgrow the tool.
- **Hybrid intimacy** (Relationships) — parts-of-partner is vulnerable; intake UX must not feel like profiling.

### Shadows

| Shadow | Line | Guardrail |
|--------|------|-----------|
| Loneliness shame | Friendcraft game | "Practice" not "fix your social life" |
| Allyship confusion | All lines | `product_line` visible in UI; never auto-merge |
| Surveillance | Intake + spaced repetition | Surface, don't score; no guilt copy |
| Crush objectification | Flirtcraft intake | Intake = intention + consent grammar, not a trophy list |
| Parts reductionism | Relationships hybrid | Parts map is relational field, not diagnostic chart |
| Book bypass | Exploration 64 | Earn mechanic tied to reading/capture, not paywall theater |
| Wendell as bottleneck | Asset creation | Player art lane + Calrunia skin lane (already decided) |

### Shaman integration advice

- **Ritual before schema:** Each line gets one somatic check in the play loop (Friendcraft already spec'd: "Did you have the conversation?").
- **Exploration 64 unlock** should feel like **receiving**, not **leveling up**.
- **Relationships intake** needs a Diplomat/Shaman co-design session before API — highest shadow risk.

---

## 📖 Sage — What is the principle underneath?

**One grammar, many crafts. Intake names the world. Application moves in it. Exploration integrates the book.**

Historical precedent: Tarot (78) separates major (exploration) from minor (application); you hold both. MTGOA already did this with BAR prompts (in chapter) vs hexagram cards (earned deck).

Mastery definition: A player can explain their line in one sentence — *"I collect [intake], I practice with [52], I go deep with [64 from the book]."*

Warning sign: Teams building features that can't name which layer they serve.

### Sage integration advice

- **Curriculum order:** Scene Atlas literacy → pick craft line → intake workshop → application 52 authoring → book 64 when book exists.
- **Don't pre-build** Flirtcraft/Networking 64 before the book frame exists — application 52 + intake can prototype earlier.
- **Friendcraft book 64** needs its **own** exploration matrix (Friendship × ?) — do not copy I Ching; copy the **earn + self-contained card** shape only.

---

## Cross-face synthesis — Integration priority stack

| Priority | Work | Face lead | Existing anchor |
|----------|------|-----------|-----------------|
| **P0** | Lock grammar doc + tag all specs | Regent | This document |
| **P1** | Fix `FRIENDSHIP_64` misalignment in engine/docs | Challenger | `bar-deck/prompts.ts` |
| **P2** | Generalize oracle reader + deck.json metadata | Architect | `/oracle`, Casey publish |
| **P3** | MTGOA exploration 64 publish + earn path | Diplomat | `HEXAGRAM_CARD_MANUSCRIPT_INTEGRATION_SPEC.md` |
| **P4** | Friendcraft intake API (game) | Architect | `friendcraft-deck/architect_card.md` schema |
| **P5** | Port deck editor (application 52) | Architect | `SPEC-oracle-deck-editor-publisher.md` |
| **P6** | Friendcraft book 64 matrix design | Sage | New — after book outline |
| **P7** | Relationships hybrid intake spec | Shaman + Diplomat | New |
| **P8** | Parts 64 BAR-creation pipeline | Architect | 321 + BDE specs |

---

## Open decisions (owner)

| # | Question | Faces |
|---|----------|-------|
| 1 | Is `FRIENDSHIP_64` renamed or repurposed for Relationships book 64? | Architect, Challenger |
| 2 | Friendcraft book 64 matrix — what are the two axes? | Sage, Architect |
| 3 | Single `DeckProduct` table vs JSON config per line for v1? | Architect, Regent |
| 4 | Exploration earn — global progress model or per-line? | Architect, Diplomat |
| 5 | Scene Atlas — mandatory before craft line, or parallel entry? | Diplomat, Regent |

---

## Next artifact

**`DECK-PRODUCT-GRAMMAR.md`** — one-page canonical grammar (no face analysis), linked from bars-engine `.specify/specs/deck-authoring-platform/` when created.

Supersedes the **provenance-earned 12** recommendation in `DESIGN-BRIEF-FRIENDCRAFT-64.md` — Friendcraft 64 = book exploration, not quest extension.
