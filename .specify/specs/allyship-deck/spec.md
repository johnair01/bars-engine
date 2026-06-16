# Spec: Allyship Deck — a spellbook for Mastering Allyship Moves

## Purpose

A **consultable deck** of allyship "spells" — you draw at random for inspiration, or consult
deliberately to solve a specific allyship problem (for yourself, or on a campaign/milestone that
helps others). A companion **guidebook (delivered as in-deck cards)** teaches its use. Ships as a
**digital deck** (in-app, consultable) and **print-house-ready files** — saleable to Kickstarter
backers and as a standalone product, independent of the book's timeline.

**Practice:** Deftness Development — spec kit first, data/contract before UI, deterministic over AI.
Deck content is authored/assembled data, not model output.

> **Canonical design docs (read these — this spec points to them, doesn't duplicate):**
> - [`move-library-core-rules.md`](./move-library-core-rules.md) — **authoritative** move grammar.
> - [`sources-synthesis.md`](./sources-synthesis.md) — synthesis of the design documents.
> - [`slice-open-up-gathering-resources.md`](./slice-open-up-gathering-resources.md) — worked card template + schema.
> - [`test-playthrough-800-fundraiser.md`](./test-playthrough-800-fundraiser.md) — end-to-end validation.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Core metaphor | A spellbook/oracle of allyship **moves**: **draw** (random) and **consult** (problem → move). |
| Reuse | **Fork the Oracle feature** (`OracleReader`, `/oracle`, `cardLayout.ts` = 300×420 ≈ 2.5×3.5). |
| Move grammar | **5 Basic Moves × 6 Operations × 4 Domains = 120 move cards** + **30 instruction cards = ~150.** See core rules. |
| Basic Moves | Wake Up · Open Up · Clean Up · Grow Up · Show Up. (**Grow Up = Level Up**; no separate Level Up move.) |
| Operations (Faces) | Shaman · Challenger · Regent · Architect · Diplomat · Sage — **operations, not classes**; every move passes through all six. **Channel-agnostic.** |
| Domains | Gather Resources · Raise Awareness · Direct Action · Skillful Organizing — a multiplying axis (contextualizes every card). |
| Capability Model | Fire/Agency · Water/Connection · Metal/Exploration · Earth/Rest · Wood/Participation. A move restores a capability. |
| Card anatomy | Skill-stack: Primary Question · Optimizes For · Forbidden Moves · Failure Modes · Remediation (+ flavor). |
| Subject toggle | Every card has `primaryQuestion` (introspective) **and** `campaignQuestion` (for-others/milestone); consult-mode switch. Same 120 cards. |
| Content source | Assembled deterministically from the canonical grammar (`src/lib/allyship-deck/move-library.ts`); authored overrides for polished cards; art = separate identity lens (`public/card-art/*`). |
| Delivery | **Digital deck** (consultable) **+ print-house-ready files** (per-card fronts + back + manifest, 2.5×3.5 @300dpi + bleed). |
| Access model | Deferred. v1 may ship free/sample; selling later reuses the `BookEntitlement` pattern as `DeckEntitlement`. No DB in v1. |

## Conceptual Model

Three axes (lenses, **not** a matrix to enumerate beyond the 120):

| Axis | Members | Role |
|------|---------|------|
| **Basic Moves** | Wake · Open · Clean · Grow · Show | the developmental loop / *what kind of progress* |
| **Operations** | Shaman · Challenger · Regent · Architect · Diplomat · Sage | the *operation* performed (Notice/Challenge/Steward/Amplify/Care/Integrate) |
| **Domains** | Gather Resources · Raise Awareness · Direct Action · Skillful Organizing | the allyship *context* (WHERE) |

Plus the **Capability Model** (what's restored) and the **subject toggle** (self ↔ campaign).
Complete BAR flow (the game loop): Charge → Wake (Awareness) → Open (Experience) → Clean (Insight)
→ Grow (Wisdom/Capacity) → Show (Artifact). Show Up artifacts include **Deck Card** (the game makes the game).

## Data / API contracts (data-first)

### `allyship-deck.json` (static, public)

Assembled by `scripts/assemble-allyship-deck.ts` from `src/lib/allyship-deck/move-library.ts`.
Card schema (full in the slice doc):

```ts
interface MoveCard {
  id: string                 // `${MOVE}-${DOMAIN}-${OPERATION}` e.g. "OPEN-GR-SHAMAN"
  kind: 'move'
  move: BasicMove; operation: Operation; domain: AllyshipDomain
  outputBar: OutputBar       // fixed by move (open_up → 'experience')
  title: string
  submovePrompt: string      // canonical (core rules)
  primaryQuestion: string    // introspective register
  campaignQuestion: string   // for-others / milestone register
  defaultSubject?: 'self' | 'other' | 'collective'
  optimizesFor: string; forbiddenMoves: string[]; failureModes: string[]; remediation: string
  flavor?: string; capabilities?: Capability[]; artKey?: string
  status: 'authored' | 'generated'   // generated = scaffold awaiting human polish
}
interface InstructionCard { id; kind:'instruction'; topic; title; body }
interface AllyshipDeck {
  deck_slug: 'allyship-deck'; deck_name: string; theme: Record<string,string>
  problems: { id: string; label: string; cardIds: string[] }[]  // consult index
  cards: (MoveCard | InstructionCard)[]
}
```

### Print export (CLI/build step)
`scripts/export-allyship-deck.ts` — renders fronts + shared back at 2.5×3.5 @300dpi + 0.125" bleed
→ `/output/allyship-deck/` + manifest. Reuses `oracle/cardLayout.ts`. Honors quarantine list.

## User Stories
- **P1 Draw** — shuffle, reveal a card for inspiration.
- **P2 Consult** — pick a problem (or capability that's "offline") → recommended cards.
- **P3 Browse** — grid filtered by move / operation / domain.
- **P4 Campaign mode** — toggle to the `campaignQuestion` register for a milestone/campaign (e.g. the $800 fundraiser).
- **P5 Print files** — per-card fronts + back at print spec.
- **P6 Guidebook** — in-deck instruction cards teach use.
- **P7 Verification quest** (§ Verification Quest).

## Functional Requirements

### Phase 1 — Deck data + assembly  ← *this build*
- **FR1**: `src/lib/allyship-deck/types.ts` — canonical types.
- **FR2**: `src/lib/allyship-deck/move-library.ts` — data tables: 5 moves, 6 operations, the 30
  canonical submoves, 4 domains, 5 capabilities; authored overrides (the Open Up × GR slice).
- **FR3**: `scripts/assemble-allyship-deck.ts` (`npm run deck:assemble`) → `public/allyship-deck/allyship-deck.json`:
  generates 120 move cards (both question registers; `status:'generated'` with authored overrides
  merged) + a starter instruction-card set + a seeded `problems` index. Deterministic; no AI.

### Phase 2 — Digital consultable deck
- **FR4**: `/deck` route + `AllyshipDeckReader` forked from `OracleReader` (draw / browse+filter / single).
- **FR5**: Consult mode (problem/capability index) + **subject toggle** (self ↔ campaign).

### Phase 3 — Guidebook (instruction cards) — in-app surface + export.
### Phase 4 — Print-house export (`export-allyship-deck.ts`).
### Phase 5 — (optional) sell the digital deck (`DeckEntitlement`, mirrors book paywall).

## Non-Functional
Deterministic content (no AI on deck/print path). Honor `card-art-registry` quarantine list. No
`public/` writes in serverless (print export is a CLI/build step → `/output`, gitignored). Reader keyboard-navigable.

## Persisted data & Prisma
**None in v1** (static JSON + CLI export). Only Phase 5 adds `DeckEntitlement`.

## Open inputs (author-owned; engine ships first)
Per-card polish (titles, anatomy, flavor, campaignQuestion) for the 114 generated cards · the 30
instruction cards' copy · print-house target (size/bleed) · access model (free vs sold).

## Verification Quest (required — UX feature)
- **ID** `cert-allyship-deck-v1` — frame: Bruised Banana Fundraiser ("verify the deck so backers can
  consult it and we can fulfill the Kickstarter").
- Steps: open `/deck` & draw; browse+filter by a move; open a card (read anatomy); Consult — pick a
  problem → recommended cards; flip the **campaign toggle** and confirm the question reframes; confirm
  an instruction card explains use. Reference: [cyoa-certification-quests](../cyoa-certification-quests/).

## Dependencies
Oracle (`OracleReader`/`cardLayout`/`deck.json`), `card-art-registry` + `public/card-art/*`,
`card-tokens`, `cultivation-cards.css`, card backs. Supersedes the print half of `1.80 DPX`.
Independent of `PlayerDeck`/`PlayerCard` and of the book launch.

## References
See the canonical design docs listed under **Purpose**; Oracle code under **Design Decisions**.
