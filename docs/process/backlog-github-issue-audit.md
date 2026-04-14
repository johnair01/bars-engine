# Backlog ↔ GitHub issues audit

**Ledger of record:** [.specify/backlog/BACKLOG.md](../../.specify/backlog/BACKLOG.md) Objective Stack (plus [ARCHIVE.md](../../.specify/backlog/ARCHIVE.md) for done/superseded). Optional DB mirror: `npm run backlog:seed`.

**Goal:** every **tracked GitHub issue** that represents product/engineering work maps to **at least one** backlog row (or is explicitly deferred in the issue + a Future row). Use this doc to **batch** related issues into one release train.

**Titles below** were pulled from `https://api.github.com/repos/johnair01/bars-engine/issues/{n}` (public API). Re-fetch if titles drift.

---

## GitHub issues #39–#46, #53 (Conclave / ontology / walkable / books)

| # | Title (as on GitHub) | State | Backlog ID | Spec / notes |
|---|----------------------|-------|------------|----------------|
| [39](https://github.com/johnair01/bars-engine/issues/39) | Docs: Campaign ontology glossary + architecture note | open | **1.75 COG** | [campaign-ontology-alignment](../../.specify/specs/campaign-ontology-alignment/spec.md), `docs/architecture/` |
| [40](https://github.com/johnair01/bars-engine/issues/40) | Tech debt: campaignRef inventory + classification | open | **1.75 COG** | [campaignref-inventory-audit](../../.specify/specs/campaignref-inventory-audit/spec.md), [CAMPAIGNREF_INVENTORY.md](../CAMPAIGNREF_INVENTORY.md) |
| [41](https://github.com/johnair01/bars-engine/issues/41) | Schema: Parent-child Campaign hierarchy | open | **1.75 COG** + **1.59 CSC** | Prisma `parentCampaignId`, [campaign-subcampaigns](../../.specify/specs/campaign-subcampaigns/spec.md) |
| [42](https://github.com/johnair01/bars-engine/issues/42) | Design: Nested campaign stewardship | open | **1.75 COG** | Steward UX / ops alongside ontology; may split tasks under COG `plan.md` |
| [43](https://github.com/johnair01/bars-engine/issues/43) | Migrate: Attach hub/spoke models to canonical Campaign | open | **1.75 COG** | [ADR 0001](../adr/0001-two-ontology-window-during-mtgoa-demo.md) |
| [44](https://github.com/johnair01/bars-engine/issues/44) | Provenance: Campaign-tree-aware lineage | open | **1.75 COG** (+ **1.39 PSS**) | Tree-aware provenance; stamp system may own parts — coordinate specs |
| [45](https://github.com/johnair01/bars-engine/issues/45) | Spike: Walkable sprite pipeline demo (env + WASD) | open | **1.76 HWC** | [humanoid-v1-walkable-contract](../../.specify/specs/humanoid-v1-walkable-contract/spec.md), [walkable-sprite-pipeline-demo](../../.specify/specs/walkable-sprite-pipeline-demo/spec.md) |
| [46](https://github.com/johnair01/bars-engine/issues/46) | Spec: 1st-party book → CYOA stewardship (Phase A pilot) | open | **1.78 BCS** | [book-cyoa-stewardship](../../.specify/specs/book-cyoa-stewardship/spec.md) |
| [53](https://github.com/johnair01/bars-engine/issues/53) | Epic: Player signal garden + library charge metabolism (PSG) | open | **1.74 PSG** | [player-signal-garden-library-metabolism](../../.specify/specs/player-signal-garden-library-metabolism/spec.md) |

---

## Other indexed issues

| # | Backlog ID | Spec / notes |
|---|------------|----------------|
| [20](https://github.com/johnair01/bars-engine/issues/20) | **1.24 ST** | [strand-system-bars](../../.specify/specs/strand-system-bars/spec.md) |
| [21](https://github.com/johnair01/bars-engine/issues/21) | **1.24 ST** (historical) | Strand MVP — verify closed vs **ARCHIVE** |

---

## Pixel identity (**1.77 PIV**)

No separate GitHub issue in the #39–#46 set. Options: open a child of **#45**, or reference **#45** until split.

---

## Book OS v1 authoring

Not a numbered issue in the set above. When `.specify/specs/book-os-v1-authoring/` exists, add a backlog row and GitHub issue; link from **1.78 BCS** ([GAP](../conclave/construc-conclave-9/GAP_ANALYSIS.md)).

---

## Batching opportunities (high value)

| Batch | Rows + issues | Why |
|-------|----------------|-----|
| **Ontology spine** | **1.75 COG** (#39–#44) + **1.59 CSC** (#41) | One vocabulary (`campaignRef`, parent/child, hub/spoke, stewardship design, migration, provenance). |
| **Walkable** | **1.76 HWC** (#45) + **1.77 PIV** | Contract + resolver before compositor (**1.66 BLW** Future). |
| **Library → engine** | **1.78 BCS** (#46) + **1.53 BCY** + **1.57 LCG** + **40 AZ** | Stewardship → CYOA → GM retrieval → ingestion. |

---

## What to work on next (suggested)

1. **Drive #39–#44** from **1.75 COG** / **1.59 CSC** `tasks.md`; close issues when AC match.  
2. **#45** — confirm demo shipped vs remaining AC; align **HWC** T6 / walkable spec tasks.  
3. **#46** — Phase A pilot vs **BCS** `tasks.md`.  
4. **#53** — **1.74 PSG** Future; spike when charge/library priority rises.

---

## Incoming work checklist

- [ ] New GitHub issue? Add one **Objective Stack** row (or extend an existing row’s Feature cell with the issue link + title).  
- [ ] Run **`npm run backlog:seed`** after `BACKLOG.md` edits.

See also: [spec-prework-iching-six-faces.md](./spec-prework-iching-six-faces.md).
