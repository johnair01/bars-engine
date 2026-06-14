# Spec: Allyship Deck — a spellbook for Mastering Allyship Moves

## Purpose

A **consultable deck** of allyship cards: you draw at random for inspiration, or consult deliberately to solve a specific allyship problem. A companion **guidebook** teaches how to use the deck against real situations. It ships as a **digital deck** (in-app, consultable) and **print-house-ready files** for a physical deck — saleable to Kickstarter backers and as a standalone product, independent of the book's timeline.

**Problem**: The deck system is ~65% built (40 card-art PNGs, 18 card templates, move-grammar resolver, `CultivationCard` + card tokens, 4 card backs) but has **no consultable experience and no print pipeline** — the two things that make it a shippable product. The interactive *play* deck is blocked on a `PlayerDeck` migration; a *consultable/print* deck is not, so this is unblocked.

**Practice**: Deftness Development — spec kit first, data/contract before UI, deterministic over AI. The deck content is authored data, not model output.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Core metaphor | A **spellbook / oracle of allyship moves**. Two modes: **draw** (random inspiration) and **consult** (problem → relevant cards). |
| Reuse | **Fork the Oracle feature** (`src/components/oracle/OracleReader.tsx`, `/oracle`, `src/lib/oracle/cardLayout.ts`, `deck.json` schema) — already a themed, consultable deck with shuffle/grid/single views. The handbook reader was built this same way. |
| Card composition | Combines **identity** (nation/archetype, the 40 art cards) **and move/domain** action cards, unified under the **5 moves** — the four base moves (Wake Up, Clean Up, Grow Up, Show Up) plus a **5th move that "opens up"** (progression card; definition author-supplied — see § Open inputs). |
| Content source | Existing `src/lib/deck-templates/*` (card text), `card-art-registry` + `public/card-art/*` (art), and `src/lib/move-grammar/*` (composed move sentences) feed a single **`allyship-deck.json`** (Oracle deck schema, extended). |
| Card geometry | Oracle layout is **300×420 (5:7)** = the **2.5"×3.5"** poker ratio. Digital renders at screen scale; print export renders the same cards at **300 dpi (750×1050) + 0.125" bleed (→ 825×1125)**, configurable per print house. |
| Delivery | **Digital deck** (in-app consultable) **+ print-house-ready files** (per-card front images + shared back + manifest). Print-and-play is out of scope unless requested. |
| Access model | **Deferred** (§ Open inputs). v1 can ship the digital deck as a free/sample experience; selling it later reuses the `BookEntitlement` pattern as `DeckEntitlement`. No schema change in v1. |
| Guidebook | A **problem → moves/cards** mapping (data) + a guidebook surface in the deck UI and an exportable document. Copy is author-owned. |

## Conceptual Model

Game language (WHO/WHAT/WHERE/Energy/Moves):

| Dimension | In the deck |
|-----------|-------------|
| **WHO** | Identity cards — Nation (element) × Archetype (trigram). The 40 art cards. |
| **WHERE** | Allyship domains — Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing. Card `domain`. |
| **Moves** | The spine: **Wake Up · Clean Up · Grow Up · Show Up · [5th move]**. Card `move`. |
| **Energy** | n/a for consult/print v1 (no vibeulon economy in the deck experience). |

Use modes:
- **Draw** — shuffle, reveal 1–3 cards for inspiration (Oracle "shuffle" view).
- **Consult** — pick a problem (or browse) → the guidebook surfaces the relevant move(s) and cards (Oracle "grid"/"single" + a new problem index).

## Data / API contracts (data-first)

### `allyship-deck.json` (static, public — Oracle schema extended)

```ts
type AllyshipMove = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up' | 'open_up' /* 5th — name TBD */
type AllyshipDomainKey = 'GATHERING_RESOURCES' | 'DIRECT_ACTION' | 'RAISE_AWARENESS' | 'SKILLFUL_ORGANIZING'

interface AllyshipCard {
  id: string                  // e.g. "WAKE-DA-01"
  move: AllyshipMove          // the spine
  domain: AllyshipDomainKey | null
  identity?: { nationKey?: string; archetypeKey?: string } // art cards
  artKey?: string             // → public/card-art/{nation}-{archetype}.png, or move icon
  rank?: string
  title: string
  prompt: string              // the consult question
  flavor?: string
  guidance: string            // how to apply this move/card to a problem
}

interface AllyshipDeck {
  deck_slug: 'allyship-deck'
  deck_name: string
  theme: { /* colors per move/element, reuse card-tokens */ }
  problems: { id: string; label: string; cardIds: string[] }[] // guidebook index
  cards: AllyshipCard[]
}
```

### Print export (Route Handler or script)

```ts
// scripts/export-allyship-deck.ts  (deterministic; no model calls)
// Renders each AllyshipCard front at PRINT_W×PRINT_H + bleed via headless browser,
// plus the shared back, into /output/allyship-deck/{cardId}.png and a manifest.json
// sized for the chosen print house (default 2.5×3.5 @300dpi, 0.125" bleed).
```

- **Digital deck**: static JSON + client reader (no server action needed for consult). Selling later → Server Action `redeemDeckLicense` (mirror `redeemBookLicense`).

## User Stories

### P1: Draw for inspiration
**As someone stuck on allyship**, I want to shuffle and reveal a card, so I get an unexpected move to consider. **Acceptance**: `/deck` shuffle view reveals a random card with its move, prompt, and guidance.

### P2: Consult to solve a problem
**As someone facing a specific situation**, I want to pick my problem and see the relevant cards, so the deck points me to the right move. **Acceptance**: a problem index maps a chosen problem → the guidebook's recommended move(s) and card(s).

### P3: Browse the full deck
**As a curious reader**, I want to browse all cards by move/domain/identity. **Acceptance**: grid view filterable by move and domain.

### P4: Print-house-ready files
**As the publisher**, I want per-card front images + back at print spec, so I can fulfill a physical deck. **Acceptance**: `export-allyship-deck` produces correctly-sized, bleed-margined images + a manifest for every card.

### P5: Guidebook
**As a new owner**, I want a guidebook explaining how to use the deck. **Acceptance**: an in-app guidebook surface + an exportable guidebook document, driven by the `problems` index and per-card `guidance`.

### P6: Verification quest (§ Verification Quest)

## Functional Requirements

### Phase 1 — Deck data + assembly
- **FR1**: `AllyshipDeck`/`AllyshipCard` types + `public/allyship-deck/allyship-deck.json`.
- **FR2**: An **assembly script** (`scripts/assemble-allyship-deck.ts`) that builds the JSON from `deck-templates`, `card-art-registry`, and `move-grammar` (deterministic; author fills copy/guidance + the 5th move).

### Phase 2 — Digital consultable deck
- **FR3**: `/deck` route + `AllyshipDeckReader` (forked from `OracleReader`): **draw** (shuffle), **browse** (grid, filter by move/domain), **single** card view with prompt + guidance.
- **FR4**: **Consult** mode — problem picker driven by `deck.problems` → highlights recommended cards.

### Phase 3 — Guidebook
- **FR5**: In-app guidebook surface (how-to + problem index). **FR6**: exportable guidebook document (markdown/PDF) from the same data.

### Phase 4 — Print-house export
- **FR7**: `scripts/export-allyship-deck.ts` renders fronts + back at print spec (default 2.5×3.5 @300dpi + bleed) → `/output/allyship-deck/` + manifest. Reuses card geometry from `cardLayout.ts`.

### Phase 5 — (optional) Sell the deck
- **FR8**: `DeckEntitlement` + `redeemDeckLicense` mirroring the book paywall, if the digital deck is gated. Schema change — own spec section then.

## Non-Functional Requirements
- Deterministic content (no AI on the deck/print path). Art QA: honor the registry's **quarantine list** (watermarked cards excluded from print). Accessibility: deck reader keyboard-navigable. No `public/` writes in serverless (print export is a build/CLI step writing to `/output`, not a runtime route).

## Scaling Checklist (filesystem / export)
| Touchpoint | Mitigation |
|------------|------------|
| Print render output | Write to `/output` via CLI/build step, not a serverless route; large binaries not committed (gitignore `/output/allyship-deck/`). |
| Headless browser for print | Playwright as a dev/CI dependency; run as a script, not in request path. |

## Persisted data & Prisma
**None in v1** (digital deck is static JSON; print is a CLI step). Only Phase 5 (selling the digital deck) adds `DeckEntitlement` — defer until chosen.

## Open inputs (author-owned — flagged, non-blocking)
- **The 5th move**: name + meaning (placeholder `open_up`). Drives a move icon + the spine.
- **Final card list + copy**: per-card `title`/`prompt`/`flavor`/`guidance`. Engine + schema ship; copy fills in.
- **Guidebook copy** + the `problems` index entries.
- **Print house target** (The Game Crafter vs MakePlayingCards) → exact size/bleed (default poker 2.5×3.5 + 0.125").
- **Access model** (free vs sold) → whether Phase 5 is needed.

## Verification Quest (required — UX feature)
- **ID**: `cert-allyship-deck-v1`
- **Frame**: Bruised Banana Fundraiser — "Verify the Allyship Deck so backers can consult it and we can fulfill the Kickstarter."
- **Steps**: (1) open `/deck`, draw a card; (2) browse the grid, filter by a move; (3) open a card, read its guidance; (4) use Consult — pick a problem, see recommended cards; (5) confirm the guidebook surface explains how to use the deck.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/).

## Dependencies
- Existing: Oracle feature (`OracleReader`, `cardLayout`, `deck.json`), `deck-templates/*`, `card-art-registry` + `public/card-art/*`, `move-grammar/*`, `card-tokens`, `cultivation-cards.css`, card backs.
- Supersedes/absorbs the print half of backlog `1.80 DPX`.
- Independent of `PlayerDeck`/`PlayerCard` (the blocked *play* deck) and of the book launch.

## References
- Oracle: [src/components/oracle/OracleReader.tsx](../../../src/components/oracle/OracleReader.tsx), [src/lib/oracle/cardLayout.ts](../../../src/lib/oracle/cardLayout.ts), [src/lib/valkyrie-party/data/deck.json](../../../src/lib/valkyrie-party/data/deck.json)
- Deck system: [.specify/specs/deck-card-move-grammar/](../deck-card-move-grammar/), [seed-deck-card-move-grammar.yaml](../../../seed-deck-card-move-grammar.yaml)
- Tokens/CSS: [src/lib/ui/card-tokens.ts](../../../src/lib/ui/card-tokens.ts), [src/styles/cultivation-cards.css](../../../src/styles/cultivation-cards.css)
