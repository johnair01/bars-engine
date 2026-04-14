# Six Game Master faces — Construc Conclave (9) bundle

Implications of adopting **Book OS v1**, **pixel identity / humanoid v1**, and the **ontology** narrative alongside existing **book→CYOA stewardship** and **walkable demo** work. One lens per face (shaman, regent, challenger, architect, diplomat, sage).

---

## Shaman (pattern, energy, what is “felt”)

The bundle asks the engine to hold **living manuscripts** (draft/approved sections, runs, emotional overlays on sprites) as first-class ritual objects—not only extracted threads. Players and stewards will **feel** whether tone and canon stay coherent; if Book OS sections drift from approved voice, trust in “the book inside the game” erodes. Pixel identity ties **BAR / emotional state** to **what you see**, so the Shaman read is: *does the visible character match the inner state we’re asking people to metabolize?* Misalignment becomes a felt lie.

---

## Regent (governance, stewardship, boundaries)

Book OS v1 centers **approval events**, **named stewards**, and **section-level canon**. That is Regent terrain: who may approve, audit trail, and rollback. Overlap with [book-cyoa-stewardship](../../../.specify/specs/book-cyoa-stewardship/spec.md) must stay crisp—**stewardship** is rights and attribution; **Book OS** is operational manuscript governance. Humanoid and pixel specs add **asset approval** and palette discipline: Regent questions are *who signs off on generated layers* and *what is blocked from ship*.

---

## Challenger (risk, falsification, what breaks)

Without **CharacterIdentity → resolver → layers**, “pixel identity” stays a slide deck; without **section runs + approval**, Book OS collapses into another Google Doc. Challenger asks: *what experiment proves the contract?* Humanoid v1 is falsifiable (dimensions, anchor, frame order, JSON metadata). Book OS needs the same—e.g. “no player-facing retrieval from unapproved section revision.” Ontology work already challenges sloppy `campaignRef` usage; adding Book OS multiplies surfaces where wrong IDs leak into UI.

---

## Architect (structure, migrations, system fit)

Architecturally, Book OS implies **new Prisma models** and admin routes under `/admin/books/.../sections`, plus server actions for draft push, runs, and context packs. Pixel identity implies **types + optional asset pipeline** (registry layout, validation script or CI check). Humanoid v1 should **unify** walkable sheet layout with [walkable-sprite-pipeline-demo](../../../.specify/specs/walkable-sprite-pipeline-demo/spec.md) and [WALKABLE_SPRITES.md](../../WALKABLE_SPRITES.md)—one anchor and frame contract to avoid forked Pixi math. Dependency order: **humanoid contract** before dynamic compositing; **Book OS** after or parallel with **book ingestion** but must not duplicate `Book` lifecycle without a merge story.

---

## Diplomat (We quadrant, community, external works)

Book OS full spec imagines **agent-assisted drafting** and rich internal tooling. Diplomat pressure: community allergy to opaque AI, and **third-party books** (deferred in stewardship Phase B). Pixel AI pipeline must degrade to **human-only canon** and show **provenance** where assets are visible. Narrative in public UI should avoid implying “the machine wrote the canon” when stewards have not approved.

---

## Sage (integration, sequencing, meta)

Sage synthesis: **three streams**—(1) **ontology / campaignRef / hierarchy** for where content lives, (2) **Book OS + stewardship** for how written canon enters the engine, (3) **humanoid + walkable + optional VIE** for how bodies appear in space. Sequencing suggestion: lock **humanoid v1 contract** and align existing walkable assets; land **Book OS v1** schema + minimal admin map; grow **pixel identity** phases only when resolver and validation exist. Campaign ontology remains the spine; Book OS hangs off **Book** and **Campaign**; sprites hang off **identity** and **instance presence** (future hub work stays in ontology tasks).

---

## Cross-face summary

| Face | Primary tension in this bundle |
|------|--------------------------------|
| Shaman | Felt truth of voice + sprite vs inner state |
| Regent | Approval, stewards, asset gates |
| Challenger | Enforceable contracts vs aspirational docs |
| Architect | Migrations, single frame/anchor contract, no duplicate truths |
| Diplomat | AI visibility, third-party restraint |
| Sage | Order dependencies and one integrated story |

For file-level mapping and repo overlap, see [GAP_ANALYSIS.md](./GAP_ANALYSIS.md).
