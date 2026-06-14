# Prompt: Allyship Deck — spellbook for Mastering Allyship Moves (1.81 ADK)

Implement per the spec kit:

- **Spec:** [.specify/specs/allyship-deck/spec.md](../../specs/allyship-deck/spec.md)
- **Plan:** [plan.md](../../specs/allyship-deck/plan.md)
- **Tasks:** [tasks.md](../../specs/allyship-deck/tasks.md) — phases in order; v1 = digital + print (content-pending).

## Objective

A consultable deck — draw for inspiration or consult to solve a specific allyship problem — with a guidebook. Ships as a **digital deck** (fork the Oracle feature) **and print-house-ready files**. Saleable to Kickstarter backers, independent of the book timeline.

## Agent instructions (data-first)

1. **T1–T3**: types + `assemble-allyship-deck.ts` → `public/allyship-deck/allyship-deck.json`, built from `deck-templates/*` + `card-art-registry` + `move-grammar`. Placeholder copy + the 5th move slot; honor the registry quarantine list. Commit the JSON.
2. **T4–T6**: `/deck` route + `AllyshipDeckReader` forked from `src/components/oracle/OracleReader.tsx` (draw / browse+filter / single) + `ConsultIndex` (problem → cards).
3. **T7–T8**: guidebook surface + export.
4. **T9–T11**: print export (`export-allyship-deck.ts`, Playwright, 2.5×3.5 @300dpi + bleed, fronts+back+manifest) reusing `oracle/cardLayout.ts`. Gitignore `/output/allyship-deck/`.
5. `npm run check` && `npm run build`; verification quest `cert-allyship-deck-v1` (T13–T15).
6. Update `1.81 ADK` in `BACKLOG.md`; `npm run backlog:seed`.

## Decisions (2026-06-14)
- Combines identity + move/domain cards under **5 moves** (4 base + a 5th that opens up).
- Delivery: **digital deck + print-house-ready files** (not print-and-play).
- No DB in v1 (static JSON + CLI export). Selling the digital deck later = `DeckEntitlement` mirroring the book paywall.

## Author-owned inputs (non-blocking; engine ships first)
5th move name/meaning · per-card copy (title/prompt/flavor/guidance) · `problems` index + guidebook copy · print house target (size/bleed) · access model (free vs sold).
