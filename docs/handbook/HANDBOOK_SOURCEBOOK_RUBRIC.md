# BARS Player’s Handbook — sourcebook rubric

This document defines **what “RPG sourcebook depth” means** for BARS Engine: a comparative lens on reference PDFs (uploaded via `/admin/books`), a **checklist of questions** great player-facing books answer, and how those questions map to **BARS primitives**.

**Reference PDFs (admin books):** Hearts Blazing, Kids on Bikes, Emissary’s Guide to Worlding — extract text, then use [`src/lib/book-toc.ts`](../../src/lib/book-toc.ts) + [`src/lib/book-toc-slices.ts`](../../src/lib/book-toc-slices.ts) for deterministic TOC-aligned chunks (see [`scripts/extract-book-toc-chunks.ts`](../../scripts/extract-book-toc-chunks.ts)).

**Copyright:** Use reference books only for **structure and tone analysis**. Shipped wiki prose must be **original** BARS copy; do not paste long quotations from commercial PDFs.

---

## 1. Comparative matrix (fill per book)

| Dimension | Book A | Book B | Book C | Notes |
|-----------|--------|--------|--------|-------|
| **Pitch / promise** (what the book says in the first pages) | | | | |
| **Who is this for** (players, GM, both) | | | | |
| **Character / party creation** | | | | Maps to Nation, Archetype, domains |
| **Core loop** (what a session looks like) | | | | Maps to four moves |
| **Facilitator / GM chapter** | | | | Maps to Game Master faces, Steward |
| **Safety / consent / table culture** | | | | Emotional First Aid, Roadblock Quests |
| **Economy / tokens / props** | | | | BARs, vibeulons, analog cards/dice |
| **Setting vs rules split** | | | | Lore vs mechanics |
| **Appendices** (sheets, quick ref) | | | | Hand, Scene Atlas, etc. |

---

## 2. Sourcebook question checklist → BARS primitives

Answer each in the wiki (see [`HANDBOOK_TOC.md`](./HANDBOOK_TOC.md)) with links to `/wiki/glossary`, `/wiki/moves`, `/wiki/nations`, `/wiki/archetypes`, and `/wiki/cultivation-sifu` as appropriate.

| Question | BARS hooks |
|----------|------------|
| What is a session? | Four moves; typical arc (Wake → Clean → Grow → Show) |
| What do I need at the table? | Analog: index cards, poker deck, dice, vibeulon tokens; app optional |
| What is a BAR? | Glossary; capture; quest completion |
| What are vibeulons? | Energy currency; glossary; rules wiki |
| Who am I “as a character”? | Nation (WHO pathway), Archetype (agency), optional Cultivation Sifu voice in 321 |
| What is “charge” and how do I metabolize it? | 321 process; Emotional Alchemy; Clean Up |
| Where does play happen socially? | Allyship domains (WHERE) |
| Who is the Game Master? | Six faces: Shaman, Challenger, Regent, Architect, Diplomat, Sage — canonical names only |
| What when we’re stuck? | Roadblock Quests; Emotional First Aid; 321 |
| How do we stay safe? | Table agreements; calibration; escalation (link EFA guide) |

---

## 3. Cultivation Sifu as editorial frame

The six Sifu in `src/lib/cultivation-sifu-guides.ts` align to GM faces. Use them as **section voices** or **reflection sidebars** — not as six unrelated settings, but as **tonal lenses** (precision, friction, law, beauty, myth, integration).

---

## 4. Outputs

- **Master TOC:** [`HANDBOOK_TOC.md`](./HANDBOOK_TOC.md)
- **Chunk manifests:** JSON from `npx tsx scripts/extract-book-toc-chunks.ts --bookId <id>` (per uploaded book)
- **GPT drafting:** [`GPT_PLAYERS_HANDBOOK_INSTRUCTIONS.md`](./GPT_PLAYERS_HANDBOOK_INSTRUCTIONS.md)
- **Wiki writes (API):** [`docs/WIKI_WRITE_API.md`](../WIKI_WRITE_API.md)
