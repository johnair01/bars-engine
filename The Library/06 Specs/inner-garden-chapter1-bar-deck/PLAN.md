# Plan: Inner Garden — Chapter 1 BAR → Deck

**Spec kit**: `inner-garden-chapter1-bar-deck`  
**Canonical spec**: [SPEC.md](./SPEC.md)  
**Task list**: [TASKS.md](./TASKS.md)  
**Humane bridge analysis**: [SIX-GM-BRIDGE-BARS-ENGINE.md](./SIX-GM-BRIDGE-BARS-ENGINE.md)

## Goal

Ship **Phase A** of [SPEC.md](./SPEC.md): BAR as primary authored input → persisted **deck** with at least one **non-combat** card use → short **on-map chapter rail**, without battle system or multi-scene travel.

Bridge direction: keep **inner-garden** fully playable offline while creating an **opt-in** path toward bars-engine’s `charge_capture` / `/hand` ecology. The bridge should start with vocabulary and JSON contracts, not auth or live sync.

## Codebase root

`The Library/04 Quests/Campaigns/inner-garden/`

## Architecture (target)

```
[HUD / key] → BarCapture UI → BarRecord[]
                    ↓
              mintCardFromBar()
                    ↓
         deck.cards + deck.order → Menu (Deck tab)
                    ↓
         spendCard*() → Farming | Cultivation | Story gate
                    ↓
              SaveManager.serialize / applySave
```

### Bridge Architecture (humane target)

```
inner-garden BAR (local, B/A/R)
        ↓ explicit export / preview
Bridge JSON v0 (loss-aware field map)
        ↓ optional import or deep link
bars-engine charge_capture CustomBar
        ↓ later, player-chosen
321 / Explore / Hand / Compost
```

Rules:

- **No forced login**: inner-garden remains complete offline.
- **No silent overwrite**: bridge operations append, import, or prefill; they do not replace reflective text.
- **No fake parity**: call the first bridge **export/import**, not “sync.”
- **Consent preview**: anything leaving localStorage shows the BAR text and mapped fields first.

## Implementation sequence

### Step 1 — Data layer

- Add `js/data/BarRecord.js` (or `PlayerBars.js`) with types/constants for `kind` enums.
- Add `js/data/GameCard.js` (or `DeckData.js`) for card shape + `mintCardFromBar`.
- Introduce `js/systems/DeckSystem.js` **or** fold into `EmotionSystem` / new `PlayerContentSystem`—**pick one owner** to avoid split brain (document choice in PR).

### Step 2 — Persistence

- Extend `js/systems/SaveManager.js`: `serialize` / `applySave` for `bars` + `deck`.
- Bump `SAVE_VERSION` and implement **default empty** structures for older saves.

### Step 3 — UI

- BAR capture: new component or extend existing journal UI (`HUD` / dialog flow—audit `EmotionSystem` + journal entry points in `Game.js`).
- Menu: new **Deck** tab (or rename **Inventory** section if deck lives there—prefer dedicated **Deck** for clarity).

### Step 4 — Chapter rail

- `js/data/Quests.js` + `QuestSystem.js`: flags for `bar_tutorial_started`, `first_bar_saved`, `first_card_minted`, `first_card_spent` (exact names TBD).
- `js/data/StoryScript.js` (and/or `SceneManager.js`): NPC lines when flags flip; keep on current garden map.

### Step 5 — One card spend

- Implement the single hook chosen in SPEC open questions; wire to cultivation or farming per SPEC **FR-A5**.

### Step 6 — Verification

- Execute L2/L3 checks in [TASKS.md](./TASKS.md); fix gaps.

### Step 7 — Phase B prep (optional same PR stack)

- Stub story flag `ch1_321_unlocked` and placeholder UI copy; implement 321 in follow-up PR per **FR-B1**.

## Bridge track — bars-engine convergence (after Phase A)

This track reflects [SIX-GM-BRIDGE-BARS-ENGINE.md](./SIX-GM-BRIDGE-BARS-ENGINE.md). It is **not** required for Phase A completion.

### Bridge Step 0 — Vocabulary and map

- Add a short bridge note or `BAR_CHARGE_BRIDGE.md` defining the shared terms: **BAR**, **charge**, **Witness card**, **Hand**, **compost**, **321**.
- Define field mapping:
  - inner-garden `behavior` / `activation` / `result`
  - bars-engine `CreateChargeBarPayload.summary`, `context_note`, `emotion_channel`, `intensity`, `satisfaction`, `personal_move`
- Define normalization:
  - inner-garden intensity `20–100` → bars-engine `1–5`
  - inner-garden emotion ids → bars-engine five emotion channels
  - missing `satisfaction` / `personal_move` stays `null`, never guessed.

### Bridge Step 1 — Export only

- Add an inner-garden export shape for one BAR + linked Witness card.
- Export is **download/copy JSON** only. No network, no auth, no server mutation.
- Include both raw and normalized values so future imports can be loss-aware.

### Bridge Step 2 — Import / prefill

- Add an inner-garden import path for bars-engine `charge_capture` exports as **read-only Witness cards** or **prefilled BAR drafts**.
- Prefer **append-only**: imports create new local records with `source: 'import'`; they do not overwrite local BARs.

### Bridge Step 3 — bars-engine deep link

- Add a bars-engine “Open in Inner Garden” link only after Bridge Steps 0–2 are stable.
- Deep link should **prefill** the local BAR/deck path, not auto-save.

### Bridge Step 4 — Account link / live sync (later)

- Only consider account linkage after export/import is boring.
- Live sync must preserve offline play, handle conflicts as siblings, and never use last-write-wins for reflective text.

## Migration decision (Phase A — locked)

**Migration B (dual write)** — SPEC §Design decisions. BAR replaces player-facing journal (J); BAR submit also calls `recordEmotion` so seeds/farming keep working.

## Out of scope (do not block Phase A)

- Combat, enemies, encounter maps.
- bars-engine auth, Prisma sync, server routes.
- Bidirectional live sync with bars-engine.
- Importing bars-engine’s one-charge-per-day rule into inner-garden Chapter 1.
- Claiming Witness card spend is equivalent to vibeulons, Hand, compost, or quest completion.
- Full `SPEC_DECK_MECHANICS.md` suit grid (52 cards, fragments)—only what Ch.1 needs.
- Nation zones, travel gates.

## Verification

Phase A complete when all **Phase A** tasks in [TASKS.md](./TASKS.md) are checked and SPEC **Verification** L3 manual (or automated) passes.
