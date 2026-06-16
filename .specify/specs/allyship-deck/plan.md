# Plan: Allyship Deck

Implements [spec.md](./spec.md). **Data-first**: define `allyship-deck.json` and assemble it from existing content before building UI; the digital reader forks Oracle; print export reuses the same card geometry. No DB in v1.

## Architecture strategy

The Oracle feature already is a consultable deck (shuffle/grid/single, themed `deck.json`, 300×420 = 2.5×3.5 cards). We **fork it**, swap the data source to `allyship-deck.json`, and add two things Oracle lacks: a **Consult/problem index** and a **print export**. Content is assembled deterministically from the three existing sources (templates, art registry, move-grammar) so the author only fills copy + the 5th move.

```
deck-templates/*  ─┐
card-art-registry ─┼─ assemble-allyship-deck.ts ─→ public/allyship-deck/allyship-deck.json
move-grammar/*    ─┘                                   │
                                                       ├─ AllyshipDeckReader (/deck)  [digital]
                                                       └─ export-allyship-deck.ts     [print: /output + manifest]
```

## File impact

| File | Change |
|------|--------|
| `src/lib/allyship-deck/types.ts` | **New** — `AllyshipDeck`/`AllyshipCard`/`AllyshipMove` |
| `scripts/assemble-allyship-deck.ts` | **New** — build JSON from templates + art + move-grammar |
| `public/allyship-deck/allyship-deck.json` | **New** — generated deck data (copy/guidance authored) |
| `src/components/deck/AllyshipDeckReader.tsx` | **New** — forked from `OracleReader`; draw/browse/single + Consult |
| `src/components/deck/ConsultIndex.tsx` | **New** — problem → cards picker |
| `src/app/deck/{page,layout}.tsx` | **New** — `/deck` route (mirror `/oracle`, `/handbook`) |
| `src/lib/deck/cardLayout.ts` | **New or reuse** `oracle/cardLayout.ts` for print geometry |
| `scripts/export-allyship-deck.ts` | **New** — Playwright render fronts+back at 300dpi + bleed → `/output` |
| `src/components/deck/GuidebookPanel.tsx` | **New** — in-app guidebook; export via script |
| `.gitignore` | Add `/output/allyship-deck/` |
| `package.json` | `deck:assemble`, `deck:export`, `seed:cert:allyship-deck` scripts |

## Reuse vs new

- **Reuse:** Oracle reader mechanics (shuffle/grid/single, depth selector), `cardLayout` geometry, `card-tokens` (element/move colors), `cultivation-cards.css`, `card-art-registry` (+ quarantine list), `move-grammar` resolver, card backs.
- **New:** the allyship data schema + assembly, the Consult/problem index, the print export pipeline, the guidebook surface.

## Print export approach

- Render each card's front DOM at `PRINT_W×PRINT_H + bleed` (default 750×1050 + 0.125" → 825×1125) via Playwright `page.setViewportSize` + `screenshot`. One shared back image. Emit `manifest.json` (cardId → file, size, bleed, dpi).
- Honor `card-art-registry` **quarantine list** — excluded cards are reported, not rendered.
- Print house specifics (size/bleed) are constants overridable by env/flag; default poker 2.5×3.5.

## Risks & mitigations
| Risk | Mitigation |
|------|-----------|
| 5th move undefined | `AllyshipMove` includes a placeholder slot; icon + label data-driven; nothing hard-codes only four. |
| Author copy not ready | Assembly produces a complete JSON with placeholder `guidance`/`prompt`; deck renders; copy swaps in without code change. |
| Print fidelity (fonts/bleed) | Reuse the exact reader DOM + `cardLayout`; verify one card at 300dpi before batch; manifest records specs. |
| Scope creep into the *play* deck | Explicitly out of scope; no `PlayerDeck` dependency. |

## Build / verification
- `npm run deck:assemble` → valid JSON; `npm run check`; `npm run build`.
- `/deck` smoke: draw, browse+filter, single guidance, consult, guidebook.
- `npm run deck:export` renders all non-quarantined cards at spec; eyeball one front + back.
- Verification quest `cert-allyship-deck-v1` end-to-end before marking the UX feature done.
