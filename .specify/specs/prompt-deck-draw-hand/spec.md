# Spec: Prompt deck — draw, shared hand, discard cycle

**Status:** Spec kit (design locked from product interview 2026-03).  
**Relates to:** [creator-scene-grid-deck](../creator-scene-grid-deck/spec.md) (Scene Atlas topology), [dominion-style-bar-decks](../dominion-style-bar-decks/spec.md) (Library → deck → hand), [deck-card-move-grammar](../deck-card-move-grammar/spec.md).

## Purpose

Players build a **move set** for quests: **prompt cards** (52 topology per deck) resolve to **BARs** that act as **playable moves**. Drawing is **random from each deck’s undealt pile**; **one global hand (5 slots)** spans **all** decks a player uses. **Nation** and **archetype** (and future) variants = **multiple `BarDeck`s**; **hand is not duplicated per deck**.

**Practice:** Deftness — private-by-default BARs; grid-bound kit vs fluid hand; align copy with [Voice Style Guide](/wiki/voice-style-guide).

---

## Resolved design decisions

| Topic | Decision |
|-------|----------|
| Rank → move (per suit) | Ranks **1–3** Wake Up (levels 1–3), **4–6** Clean Up, **7–9** Grow Up, **10–12** Show Up, **13** **Wild**. Same mapping for every suit. |
| Draw | **Player picks a deck**, then **uniform random** over that deck’s **undealt** cards for the **play cycle** (see below — orthogonal to grid). |
| Prompt copy | **Archetype** (and **nation** for nation decks) drives **prompt text** on `BarDeckCard` (or overlay resolution); topology stable, copy variant per deck type. |
| Hand size | **5** cards **total** across all decks. |
| Wild (rank 13) | Player chooses **which of the four moves** the card counts as **at play time** (when used on a quest). |
| Quest use | When a move is **used on a quest**, **play-cycle** state moves that **play instance** to that deck’s **discard** (per-deck discard). **Does not** remove or alter **grid binding**. |
| Deck refresh | When a deck’s **draw pile is empty**, **reshuffle discard** (full cycle) for that deck — classic Dominion-style recycle **per deck**. |
| Grid completion | Completing a prompt **fills the Scene Atlas (grid) cell** — `BarBinding` as today. |
| Grid vs hand | **Grid-bound** BARs **do not** count toward the **5** hand slots. They are **not subject to vault composting** (stable move kit on the map). |
| Multi-deck | Player may have **many decks** (e.g. archetype Scene Atlas instance, nation decks, future templates). **One shared hand** — draws from any deck consume the same 5 slots. |
| Draw UX | **Player selects deck**, then **draw** (random undealt for that deck’s **cycle**). |
| **Deck picker placement** | **Both** **Scene Atlas** (`/creator-scene-deck`) **and** **`/hand`** — same eligibility, labeling, and draw/hand behavior (see [scene-atlas-game-loop](../scene-atlas-game-loop/spec.md) IA). |
| **Picker eligibility** | List **every instance** the player **is a member of** that has an associated **`BarDeck`** (nation instances, Scene Atlas instances, future). No extra filter unless security/visibility rules require it. |
| **Picker labels** | **`Instance` display name** + **type**: **Nation** or **Scene Atlas** (human-readable; not raw ids alone). |

---

## Orthogonal layers: grid binding vs play cycle

These are **different mechanics** and must stay **decoupled** in data and UI:

| Layer | Meaning | Typical storage |
|-------|---------|-----------------|
| **Grid / atlas binding** | Which `BarDeckCard` slots have a **BAR** placed for this player on **this** deck’s 52-map (`BarBinding`). **Stable** move kit on the compass. | `BarBinding` + `CustomBar` |
| **Play cycle** | **Draw → hand (5 global) → discard → reshuffle** for **using** moves in quests. Tracks **where a card is in the operational deck**, not whether the cell is filled. | `ActorDeckState`–style piles / dedicated play-state |

**Rules**

1. **Discard (quest use) never removes a card from the grid** — no `BarBinding` archive/delete as a side effect of discard.
2. **How cards are played / used** (quest hook, wild choice at play time, discard) operates on **play-cycle** state only.
3. **Which cards are bound** to which cells for a player is **independent** — filling a cell does not automatically solve play-cycle placement, and vice versa, unless product explicitly links them in a later quest (v1 keeps them separate).

*Implementation note:* whether a **bound** cell’s card id can also appear in draw/hand/discard is a **data-model choice** (e.g. cycle uses a parallel deck of tokens vs card ids). Tasks must pick one approach and document it; **invariant** is: **binding mutations ≠ discard mutations.**

---

## User stories

### P1 — Draw

**As a** player, **I want** to **draw a random prompt** from a chosen deck’s **remaining** cards **so** I get a fresh move to work without picking a grid cell.

**Acceptance:** Server action validates deck access; hand cap enforced; card identity recorded in hand state.

### P2 — Complete prompt → grid

**As a** player, **I want** finishing a drawn (or chosen) prompt to **place the BAR on the matching grid cell** **so** my move set stays aligned with the 52-map.

**Acceptance:** Reuse or extend Scene Atlas bind path; grid-bound excluded from hand count.

### P3 — Play move on quest

**As a** player, **I want** using a move on a quest to **advance the play-cycle** (e.g. into that deck’s discard) **so** scarcity and reshuffle matter — **without** losing my BAR on the grid.

**Acceptance:** Discard / play-state updated per `BarDeck`; **`BarBinding` unchanged** by this action; quest integration hook defined in tasks.

### P4 — Wild

**As a** player drawing rank 13, **I want** to **pick Wake / Clean / Grow / Show when I play** the BAR **so** the wild flexes into my build.

**Acceptance:** Metadata on play records chosen move; validators accept wild resolution.

---

## Non-goals (v1)

- Cross-player deck sharing (decks remain owner-scoped unless campaign spec says otherwise).
- Replacing `/hand` vault compost rules for non–grid-bound BARs.
- Full visual scripting or CYOA graph for draw (see [cyoa-modular-charge-authoring](../cyoa-modular-charge-authoring/spec.md)).

---

## Schema / persistence (directional)

- Reuse **`BarDeck` / `BarDeckCard` / `BarBinding`** for **grid** + prompt text.
- **Play cycle** (draw / hand / discard per deck, **hand global 5**): separate fields or table — **must not** encode grid binding; updates on quest play **do not** write to `BarBinding`.
- Prefer **generalized `ActorDeckState`** (or sibling) with **`deckId`**, **`playerId`**, per-deck piles, **`handCardIds` global** (see Dominion spec). **Hand card ids must be globally unique** (`BarDeckCard.id` is fine across decks).
- **Rank → moveType** can live in **TS helper** (`rankToMoveFamily(rank)`) and level within family; **wild** has no fixed `moveType` until play.

---

## References

- `src/lib/creator-scene-grid-deck/` — Scene Atlas read/bind.
- `prisma/schema.prisma` — `BarDeck`, `BarDeckCard`, `BarBinding`, `ActorDeckState`.
