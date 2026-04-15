# Tasks: BAR ↔ quest links and campaign drafts

## Conventions

- [ ] = pending, [x] = done.  
- **GM faces:** only **Shaman, Challenger, Regent, Architect, Diplomat, Sage** (`src/lib/quest-grammar/types.ts`).

---

## T1 — Spec kit & traceability

- [x] Add spec kit (this folder).  
- [ ] Link from [docs/specs-ingest/conclave-construct/README.md](../../../docs/specs-ingest/conclave-construct/README.md) to [spec.md](./spec.md).  
- [ ] Optional: `.specify/backlog/` prompt + `BACKLOG.md` row when prioritized.

---

## T2 — Phase 0: data model & migrations

- [ ] Inventory existing BAR registry / quest storage; map to **D1** canonical catalog + provenance.  
- [ ] Prisma (or agreed ORM) models: **BarQuestLink**, **CampaignDraft** (+ arcs / joins as per spec).  
- [ ] Migration + `npm run db:sync` / migrate per [docs/PRISMA_MIGRATE_STRATEGY.md](../../../docs/PRISMA_MIGRATE_STRATEGY.md).  
- [ ] Seed or backfill strategy for existing registry rows (if any).

---

## T3 — Matcher & API (core)

- [ ] Align `matchBarToQuests` (or wrapper) with **FR1** match contract; unit tests for scoring.  
- [ ] REST or server actions: create/list/patch **BarQuestLink**; accept/reject for stewards (**D2**).  
- [ ] Quest catalog **GET** endpoints (list + by id) **FR3**.

---

## T4 — Phase 1: in-app slice

- [ ] Choose entry route / flow (resolve optional Q2 in [spec.md](./spec.md)).  
- [ ] UI: suggestions + **why** (reason + factors).  
- [ ] Wire **take quest** / save to existing quest/thread flows where applicable.

---

## T5 — Campaign drafts

- [ ] CRUD for **CampaignDraft** with **playerArc** + **campaignContext** + arcs **FR4**.  
- [ ] Optional: `POST .../generate` stub or AI hook — behind flag.

---

## T6 — Phase 3: bulk & OpenAPI

- [ ] Bulk BAR + bulk match endpoints (ingested API spec).  
- [ ] OpenAPI updates (per optional Q5 in spec).  
- [ ] Clustering: minimal implementation + steward override.

---

## T7 — Octalysis v1 schema only (**D3**)

- [ ] Add Core Drive enum + fields on analysis / quest design **FR6**.  
- [ ] **Do not** ship `infer-motivation` until tasks T7.1–T7.3 define review + logging.

---

## T8 — Phase 4 (deferred)

- [ ] LoopTemplate + recommend-loops.  
- [ ] infer-motivation API + evaluation.

---

## Verification

- [ ] `npm run check` / `npm run build` after schema changes.  
- [ ] Manual: private vs shared link → **D2** behavior.
