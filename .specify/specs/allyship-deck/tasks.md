# Tasks: Allyship Deck

Implements [spec.md](./spec.md). Data-first. Canonical grammar:
[`move-library-core-rules.md`](./move-library-core-rules.md). No DB in v1.

## Phase 1 — Deck data + assembly  ← current build
- [ ] **T1** — `src/lib/allyship-deck/types.ts`: `BasicMove`, `Operation`, `AllyshipDomain`,
  `Capability`, `OutputBar`, `MoveCard`, `InstructionCard`, `AllyshipDeck` (per spec schema; incl.
  `primaryQuestion` + `campaignQuestion` + `status`).
- [ ] **T2** — `src/lib/allyship-deck/move-library.ts`: canonical data — 5 moves (label/purpose/
  question/outputBar), 6 operations (verb/essence), the **30 submoves** (move×operation: action +
  question), 4 domains (label/abbr/lens), 5 capabilities (channel→capability), and **authored
  overrides** (the 6 Open Up × Gathering Resources slice cards, fully written).
- [ ] **T3** — `scripts/assemble-allyship-deck.ts` (`npm run deck:assemble`): generate the **120**
  move cards (5×6×4) — both question registers, `status:'generated'`, authored overrides merged
  (`status:'authored'`) — plus a **starter instruction-card set** and a seeded **`problems`** index;
  write `public/allyship-deck/allyship-deck.json`. Deterministic; no AI.
- [ ] **T4** — Validate output: 120 move cards, unique ids, every (move×op×domain) present, 6
  authored; commit the generated `allyship-deck.json`. Add a small assert test
  (`npm run test:allyship-deck`).
- [ ] **T5** — `npm run check` green.

## Phase 2 — Digital consultable deck
- [ ] **T6** — `src/app/deck/{layout,page}.tsx` — `/deck` route (mirror `/oracle`).
- [ ] **T7** — `AllyshipDeckReader` forked from `OracleReader`: draw / browse+filter (move/op/domain) / single (anatomy).
- [ ] **T8** — Consult mode (problem + capability index) + **subject toggle** (self ↔ campaign) that swaps `primaryQuestion`/`campaignQuestion`.

## Phase 3 — Guidebook (instruction cards)
- [ ] **T9** — In-app guidebook surface (how to draw/consult, BAR flow, capability model, problem→move index).
- [ ] **T10** — Guidebook export from the same data.

## Phase 4 — Print-house export
- [ ] **T11** — `src/lib/deck/cardLayout.ts` (reuse Oracle geometry) + print constants (2.5×3.5 @300dpi + 0.125" bleed, overridable).
- [ ] **T12** — `scripts/export-allyship-deck.ts` (`npm run deck:export`): Playwright render fronts + back → `/output/allyship-deck/` + manifest; skip+report quarantined; gitignore `/output/allyship-deck/`.

## Phase 5 — (optional) sell the digital deck
- [ ] **T13** — `DeckEntitlement` + `redeemDeckLicense` mirroring the book paywall (adds § Persisted data).

## Verification Quest (required)
- [ ] **T14** — Twine `cert-allyship-deck-v1` (steps per spec); final passage no-link.
- [ ] **T15** — `scripts/seed-cert-allyship-deck.ts` + `npm run seed:cert:allyship-deck` (idempotent; isSystem/public; Bruised Banana frame).
- [ ] **T16** — Run end-to-end in preview.

## Author-owned inputs (track; engine ships first)
- [ ] Polish the 114 generated cards (titles, anatomy, flavor, campaignQuestion).
- [ ] The 30 instruction cards' copy.
- [ ] Print-house target → size/bleed. Access model (free vs sold).

## Definition of done (Phase 1)
- [ ] `npm run deck:assemble` → valid `allyship-deck.json` with 120 move cards (6 authored) + instruction set + problems index; committed.
- [ ] `npm run test:allyship-deck` + `npm run check` green.
- [ ] BACKLOG `1.81 ADK` updated.
