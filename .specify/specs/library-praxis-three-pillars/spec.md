# Spec: Library Praxis — Three Pillars (Antifragile · Networks · Felt Sense)

## Purpose

Codify three **foundational readings** added to admin books — *Antifragile*, *The Wealth of Networks*, and *Complete Focusing Instructions* — as **design pillars** for:

1. **Antifragile praxis** — development and gameplay that **learn from stressors** (builds, cert friction, emotional charge) rather than pretending instability does not exist.
2. **Commons / network praxis** — knowledge and value that grow through **peer production, threads, and shared artifacts** (Benkler), consistent with the **diplomat / strand** recommendation to prioritize this lens over a generic “missing manual.”
3. **Felt-sense praxis** — treat **felt sense** as a **trainable skill** strengthened by the **321 process**; support players who sense easily **and** those who need **practice** so engagement and effectiveness rise together.

**See:** [ANALYSIS.md](./ANALYSIS.md) for the full synthesis.

## Non-goals

- Replacing medical or clinical Focusing training; the game offers **optional** scaffolding and **original** copy.
- Mandating reading these books for players.
- Single authoritative “wiki manual” — we favor **commons-oriented, linked** documentation.

---

## Praxis pillars (canonical enum)

| Pillar ID | Working name | Primary question |
|-----------|--------------|------------------|
| `antifragile` | Antifragile praxis | How do we gain from disorder **ethically**? |
| `commons_networks` | Commons / networks | How does value compound through **shared production**? |
| `felt_sense` | Felt sense / Focusing | How do we **practice** inward contact so 321 and play deepen? |

---

## Functional requirements

### Data and admin

- **FR1:** Each `Book` can declare **one primary praxis pillar** (`antifragile` \| `commons_networks` \| `felt_sense` \| `unset`) stored in **`metadataJson`** (or dedicated columns in a follow-up migration if query volume requires it).
- **FR2:** Optional fields in the same metadata: `designIntentSummary` (short admin-facing text), `relatedWikiSlugs` (string array), `strandNote` (e.g. diplomat consult provenance — free text).
- **FR3:** Admin Books list/detail surfaces pillar badge + design intent **read-only** summary for operators (not players unless we later expose a “library” page).

### Player-facing (phased)

- **FR4 (felt sense):** Document in **player wiki** (or `docs/` linked from wiki) a **Felt sense & 321** page: why skill varies, how 321 supports practice, **no gatekeeping** language.
- **FR5 (felt sense):** Identify **one** high-leverage UX touchpoint (e.g. 321 step copy, charge capture helper text, or optional “check-in” line) for **gentle felt-sense scaffolding** — configurable or feature-flagged.
- **FR6 (commons):** Add or update **one** canonical doc page explaining **commons-based peer production** in BARS terms (BAR threads, campaigns, attribution) — cite Benkler as conceptual source, not as in-game lore.
- **FR7 (antifragile):** Add **Engineering praxis** subsection (README fragment or `docs/ANTIFRAGILE_PRAXIS.md`): tie to fail-fix, cert feedback triage, roadblock-as-quest; optional checklist for releases.

### Verification

- **FR8:** Books *Antifragile*, *Wealth of Networks*, *Complete Focusing Instructions* (titles normalized in admin) have **pillar tags** and **design intent** filled after admin pass.
- **FR9:** No PII required for felt-sense practice features; any analytics remain **opt-in** and spec’d separately.

---

## User stories

### Admin / operator

- **As an** operator, **I want** each foundational book tagged with a praxis pillar and intent, **so** quest extraction and future AI prompts align with **why** the book is in the library.

### Player

- **As a** player new to felt sense, **I want** clear, kind copy around 321/charge, **so** I can **practice** without feeling “bad at emotions.”
- **As a** player building in commons, **I want** to understand how BARs/campaigns fit a **networked value** story, **so** collaboration feels meaningful not extractive.

### Developer

- **As a** developer, **I want** antifragile praxis documented next to our fail-fix workflow, **so** we normalize learning from failure without glorifying burnout.

---

## Acceptance criteria

1. Schema or `metadataJson` shape documented in this folder (`metadata-shape.md` or section in `plan.md`).
2. Admin can **set and view** pillar + intent for the three named books (manual seed or UI form).
3. At least **one** player-facing artifact (wiki page or in-flow copy) ships for **felt sense**; at least **one** doc for **commons**; at least **one** doc for **antifragile dev** praxis.
4. `tasks.md` Phase 1 items checked before marking spec “implementation complete.”

---

## Dependencies

- [Book-to-Quest Library](../book-to-quest-library/spec.md) — extraction pipeline
- [singleplayer-charge-metabolism](../singleplayer-charge-metabolism/spec.md) — 321 / charge context
- [roadblock-metabolism](../../../.agents/skills/roadblock-metabolism/SKILL.md) — antifragile dev ethos (conceptual)

## References

- [ANALYSIS.md](./ANALYSIS.md)
- NavBar / game loop docs as needed for commons framing
