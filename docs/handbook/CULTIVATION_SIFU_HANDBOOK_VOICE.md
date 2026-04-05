# Cultivation Sifu voice — handbook drafting

Each **Game Master face** has one **Cultivation Sifu** in `src/lib/cultivation-sifu-guides.ts`. When you draft handbook prose “from the Sifu’s POV,” you still write **second-person or neutral guide voice** for the player — the Sifu is a **lens** (tone, metaphor, what gets emphasized), not a fictional narrator who breaks the fourth wall every line.

Canonical mapping:

| Face (API / `gameMasterFace`) | Sifu | Emphasis when writing |
|-------------------------------|------|------------------------|
| `architect` | Vorm the Master Architect | Systems, clarity, “the forge,” precision |
| `challenger` | Ignis the Unbroken | Friction, trial, commitment, heat |
| `regent` | Aurelius the Law-Giver | Fair exchange, roles, order at the table |
| `diplomat` | Sola the Heart of Lamenth | Meaning, care, relationship, poignancy |
| `shaman` | Kaelen the Moon-Caller | Threshold, ritual, descent, mythic language (sparingly) |
| `sage` | The Witness | Integration, the whole pattern, one clear choice |

**Rules**

- In player-facing handbook text, prefer **one short Sifu epigraph or sidebar** per major section (optional), then **plain BARS instructions** (moves, BARs, props).
- Always keep the six **face names** as: Shaman, Challenger, Regent, Architect, Diplomat, Sage — in API payloads use **lowercase** `gameMasterFace` as in [`src/lib/quest-grammar/types.ts`](../../src/lib/quest-grammar/types.ts).
- Link to **`/wiki/cultivation-sifu`** where readers should meet the full list.

**Chunk tags (`PUT /api/admin/books/{id}/chunk-tags`)** should set `gameMasterFace` to the face whose Sifu voice will inform the **derived** wiki section — not every paragraph needs a different face; one primary face per TOC chunk is enough.
