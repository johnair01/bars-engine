# Spec: BAR Seed Metabolization (BSM)

## Purpose

Give players a **first-class loop** to attach **context (“soil”)** to BARs, **mature** captures toward metabolization, and **compost** what no longer serves—without turning the dashboard into a **shame-driven productivity** tool. Emotional stance favors **curiosity, excitement, triumph, poignance** over anxiety/frustration as the default engine for backlog hygiene.

**Origin (strand):** [STRAND_CONSULT.md](./STRAND_CONSULT.md) — six-face research + Sage synthesis.

## Pipeline note

**Strand consult does not auto-advance phases.** After consult, update this spec + `plan.md` + `tasks.md` per [docs/STRAND_TO_SPEC_KIT.md](../../../docs/STRAND_TO_SPEC_KIT.md).

---

## Design decisions

| Topic | Decision |
|-------|----------|
| Naming | Loop = **witness → choose → metabolize or compost** — not “clear inbox.” |
| Default UX | **One-at-a-time spotlight** (Scannerz-style); bulk = advanced / opt-in. |
| Soil (MVP) | Single pick: **campaign** OR **thread** OR **holding pen** + optional `context_note`. |
| Maturity (concept) | Align with WCGS phases: captured → context named → linked/elaborated → shared/acted → closed/integrated (exact enum TBD in Phase 1). |
| Compost | Optional **release note** (one sentence); skippable; slows impulsive delete. |
| Garden view | **Opt-in**; default dashboard stays gentle — **no** shame counters. |
| High-volume capturers | **Never** require soil on every BAR at capture time. |
| Physical BARs | Optional **digital twin** / stub linking same `CustomBar` lineage (later). |
| Integration | Reuse `nationLibraryId` / archetype patterns from [quest-seed-composer](../../../src/lib/quest-seed-composer.ts); **Clean Up** copy may inform ritual text, not clinical therapy. |
| Non-AI path | **First-class** manual tags / ritual copy (community ethos). |

---

## User stories

### US1 — Name the soil
**As a** player with many BARs, **I want** to attach **one soil context** to a BAR (campaign, thread, or holding pen) **so that** the system and I know where the seed belongs.

**Acceptance:** One BAR can be updated without processing the whole list; no forced ordering.

### US2 — Compost with witness
**As a** player, **I want** to **compost** a BAR and optionally note what I’m releasing **so that** closure is witnessed, not silent deletion.

**Acceptance:** Compost is reversible only if spec explicitly allows (default: **archive** + hidden from main list).

### US3 — Optional garden
**As a** player, **I want** an **optional** “garden / nursery” view **so that** I can work the backlog when I choose, not when the app nags.

**Acceptance:** Feature flag or separate nav; not the default home.

### US4 — Whole-collection energy (later)
**As a** player, **I want** an optional ritual (e.g. **draw one seed**) **so that** the **whole collection** can supply curiosity **without** bulk processing.

**Acceptance:** Phase 3+; disabled by default until MVP stable.

---

## Functional requirements

### Phase 0 — Spec + research (current)
- **FR0.1** Strand consult captured in [STRAND_CONSULT.md](./STRAND_CONSULT.md).
- **FR0.2** Spec kit complete (this file, `plan.md`, `tasks.md`) + backlog row.
- **FR0.3** User research: ≥3 sessions (high-volume, grief-heavy, casual) before schema freeze.

### Phase 1 — MVP data + actions
- **FR1.1** Persist soil + maturity + `compostedAt` + optional `releaseNote` (Prisma migration **or** JSON on `CustomBar` per engineering choice).
- **FR1.2** Server action or API: `name_soil`, `compost`, `graduate_to_quest` (link existing flows).
- **FR1.3** Copy deck: **Playful** vs **Solemn** strings; error/help text Challenger-safe (no shame).

### Phase 2 — UI
- **FR2.1** BAR detail / garden entry: soil picker, compost flow, link to quest if already exists.
- **FR2.2** Filters: by soil, maturity, composted (hidden default list).

### Phase 3 — Optional
- **FR3.1** Random BAR draw; weekly “terrain” ritual (feature-flagged).
- **FR3.2** Physical BAR stub / QR linkage (if product wants).

---

## Non-functional requirements

- **NFR1** No **public** shame metrics (e.g. “200 unplanted” as primary dashboard).
- **NFR2** Performance: power user with **500+** BARs — list/detail remain usable.
- **NFR3** Child / teen safety: compost language reviewed for grief edge cases.

---

## Dependencies

- [game-loop-bars-quest-thread-campaign](../game-loop-bars-quest-thread-campaign/spec.md), [charge-capture-ux-micro-interaction](../charge-capture-ux-micro-interaction/spec.md) — adjacent loops
- [transformation-move-library](../transformation-move-library/spec.md) — ritual language / Clean Up alignment
- [CLAUDE.md](../../../CLAUDE.md) — composting ethos

---

## References

- [STRAND_CONSULT.md](./STRAND_CONSULT.md)
- [narrative-transformation-engine.md](../../../docs/architecture/narrative-transformation-engine.md)
