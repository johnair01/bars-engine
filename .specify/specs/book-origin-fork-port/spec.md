# Spec: Book origin modes, fork-from-library, and gameplay porting

## Purpose

Define how **library books** (ingested / extracted / analyzed) differ from **authoring books** (manuscript composition under Book OS), how stewards **fork** a library book into a new writable work that **mirrors TOC structure and inferred reader journey**, and how **optional** imports bring **BARs, NationMoves, Quests (CustomBar)**, and **linked game campaigns** into a fork or new book—with **provenance and steward gates**.

**Practice**: Deftness Development — spec kit first, API-first (contracts before UI), deterministic TOC→section scaffolding before “AI intuit” assists; stewardship and rights per [book-cyoa-stewardship](../book-cyoa-stewardship/spec.md).

## Problem

Today `Book` conflates **upload pipeline artifacts** and **manuscript authoring** in one mental bucket. Admins discover Book OS sections only after a book exists; there is no first-class **origin**, **fork lineage**, or **structured clone** from TOC → `BookSection` + journey template. Teams cannot safely reuse **deep structure + reader arc** of a canonical work to compose a derivative without explicit product rules, nor **port** gameplay layers without lineage chaos.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Book origin / mode** | Persist `bookOrigin` (or equivalent) on `Book`: `library_ingested` \| `manuscript_composed` \| `forked_derivative`. Default existing rows → `library_ingested` via migration default. |
| **Fork lineage** | `parentBookId` nullable FK on `Book`; optional `forkedAt`, `forkMetadataJson` (TOC snapshot hash, steward id, notes). Fork **always** creates a **new** `Book` row; never overwrite parent. |
| **TOC → sections** | Phase 1: deterministic mapping from `Book.metadataJson` TOC (or extracted headings) → `BookSection` rows with `orderIndex`, title, slug; **empty** `draftText` / `approvedText` until author fills. |
| **Reader journey “intuit”** | Phase 2: optional steward-reviewed assist populates `goal`, `teachingIntent`, `emotionalTarget`, `targetReaderState`, `exitReaderState` from templates or bounded LLM; **never** auto-approve prose. |
| **BAR / Move / Quest import** | **Preview + explicit confirm** per batch; default **clone** with provenance fields (`sourceBookId`, lineage in `SectionBARLink` / quest metadata) vs **link**-only where legally/technically required. |
| **Campaign port** | Only books (or forks) with an existing `QuestThread` / `Instance` / `Adventure` link may run **port wizard**; creates **new** targets or rebinds per [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md) rules—no silent cross-instance hijack. |
| **Stewardship** | Fork and import surfaces show **parent title + steward acknowledgment**; third-party and external works follow Phase B gates in [book-cyoa-stewardship](../book-cyoa-stewardship/spec.md). |

## Conceptual Model

| Dimension | In this spec |
|-----------|----------------|
| **WHO** | Library steward, authoring steward, admin; future players only see ported content when published under existing publish rules. |
| **WHAT** | `Book` (+ origin) → fork child `Book` → `BookSection` scaffold → optional `CustomBar` / `NationMove` / thread clones → optional campaign/instance rebind. |
| **WHERE** | Admin: book hub, fork wizard, import wizard, campaign port wizard (`plan.md` paths). |
| **Energy** | Fork metabolizes library **structure** into new creative throughput; imports carry **provenance** so BAR/quest energy traces to source. |
| **Personal throughput** | **Wake Up** (see origin), **Grow Up** (learn structure), **Show Up** (confirm imports, publish). |

```
Library Book (ingested) ──fork──► Derivative Book (forked_derivative, parentBookId)
        │                                    │
        └ TOC / metadata ───────────────────► BookSection scaffold + journey fields
        └ optional import wizards ───────────► BARs / Moves / Quests / Campaign links (cloned or linked)
```

## API Contracts (API-First)

### `forkBookFromLibrary`

**Input**: `{ parentBookId: string; newTitle: string; options?: { includeTocSections?: boolean; stewardNote?: string } }`  
**Output**: `{ success: true; bookId: string } | { error: string }`

- **Server Action** (`'use server'`): admin-only; creates `Book` with `bookOrigin: 'forked_derivative'`, `parentBookId`, runs TOC→`BookSection` when `includeTocSections` true.

### `listBookForkCandidates`

**Input**: `{ bookId: string }`  
**Output**: `{ parent: BookSummary; tocEntryCount: number; hasThread: boolean; hasLinkedCampaignHints: boolean }`

- **Server Action**: read-only; powers fork wizard step 1.

### `previewImportBookGameplay`

**Input**: `{ targetBookId: string; sourceBookId: string; kinds: ('quest'|'move'|'bar')[] }`  
**Output**: `{ items: ImportPreviewRow[] }` — counts and ids only; no writes.

### `commitImportBookGameplay`

**Input**: `{ targetBookId: string; sourceBookId: string; selectedIds: string[]; mode: 'clone' | 'link' }`  
**Output**: `{ success: true; imported: number } | { error: string }`

- **Server Action**: transactional batches; writes provenance on created rows.

### `previewPortBookCampaign` / `commitPortBookCampaign`

**Input/Output**: TBD in implementation against `QuestThread`, `Instance`, `Adventure` constraints; must align [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md).

```ts
// Illustrative
forkBookFromLibrary(input: ForkBookInput): Promise<ForkBookResult>
```

## User Stories

### P1: Origin visibility

**As an admin**, I want each book to show whether it is **library-ingested**, **authoring-first**, or a **fork**, so I choose the right workflow (upload vs sections vs fork).

**Acceptance**: `bookOrigin` (or equivalent) visible on admin book hub; filter optional on book list.

### P2: Fork from library

**As a steward**, I want to fork an ingested book and get **sections populated from TOC** with optional **journey field** scaffolding, so I can write a derivative without manually copying structure.

**Acceptance**: Fork action creates child book + ordered `BookSection` rows; parent link stored; TOC empty → clear error or manual section map.

### P3: Import gameplay (optional)

**As a steward**, I want to **preview** then **confirm** importing quests/moves/BARs from a source book into my fork, with provenance, so new work reuses mechanics without silent duplication.

**Acceptance**: Preview lists selection; commit creates clones or links per mode; rollback story in `tasks.md` if transaction fails mid-batch.

### P4: Campaign port (optional)

**As a steward**, I want to port or rebind a **game campaign** tied to a book to a forked book when policy allows, so CYOA / instance continuity can follow the manuscript fork.

**Acceptance**: Wizard enforces ontology checks; no cross-tenant or orphan `campaignRef` (per campaign spec).

## Functional Requirements

### Phase 1 — Origin + fork scaffold

- **FR1**: Add `Book.bookOrigin`, `Book.parentBookId` (nullable), optional `forkedAt`, `forkMetadataJson` (or merge into `metadataJson` keys documented in `plan.md` if fewer columns preferred).
- **FR2**: Migration + backfill default `bookOrigin = 'library_ingested'` for existing books.
- **FR3**: `forkBookFromLibrary` server action + admin UI entry (“Fork for authoring”) on book hub when origin is library and steward is admin.
- **FR4**: TOC → `BookSection` creation: slug collision rules, `orderIndex` monotonic.

### Phase 2 — Journey assist (optional)

- **FR5**: Steward-triggered “Suggest journey fields” for sections (bounded output, stored as draft suggestions or `SectionRun` type `intake`).

### Phase 3 — Gameplay import

- **FR6**: `previewImportBookGameplay` / `commitImportBookGameplay` with batch limits and provenance.

### Phase 4 — Campaign port

- **FR7**: `previewPortBookCampaign` / `commitPortBookCampaign` behind feature flag or admin gate; document dependency on `QuestThread` / `Instance` shape.

## Non-Functional Requirements

- **Rights**: Fork and import must not bypass book-cyoa-stewardship Phase B for external works.
- **Performance**: Batch imports chunked (e.g. ≤50 quests per transaction or configurable).
- **Audit**: `SectionRun` or dedicated `BookForkEvent` log for fork + import commits.

## Persisted data & Prisma

| Check | Done |
|-------|------|
| New `Book` fields in **Design Decisions** | |
| `tasks.md` includes `migrate dev` (or manual migration if shadow DB fails) + `db:record-schema-hash` | |
| Human reviewed migration additive vs destructive | |

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| LLM journey assist | Env model override; steward must confirm before persisting as section fields |
| Large imports | Chunked transactions; progress UI |

## Verification Quest

- **ID**: `cert-book-origin-fork-port-v1`
- **Steps**: (1) Open library book with TOC in metadata. (2) Fork → child book has origin fork + sections. (3) Edit one section draft; approve. (4) Optional: run import preview with zero selections → no-op. (5) Narrative frame: preparing accurate **library → fork** stewardship for residency / engine trust.
- Reference: [.specify/specs/cyoa-certification-quests/](../cyoa-certification-quests/)

## Dependencies

- [.specify/specs/book-os-v1-authoring/spec.md](../book-os-v1-authoring/spec.md) — `BookSection`, approval, context pack.
- [.specify/specs/book-to-quest-library/spec.md](../book-to-quest-library/spec.md) — ingestion, threads, quests from books.
- [.specify/specs/book-cyoa-stewardship/spec.md](../book-cyoa-stewardship/spec.md) — attribution and phased external gates.
- [.specify/specs/campaign-ontology-alignment/spec.md](../campaign-ontology-alignment/spec.md) — campaign/instance lineage.
- [.specify/specs/book-cyoa-campaign/spec.md](../book-cyoa-campaign/spec.md) — when porting CYOA-shaped threads.

## References

- [book_os_v1_cursor_spec.md](../../../docs/conclave/construc-conclave-9/book_os_v1_cursor_spec.md) — TOC, structure.
- [GAP_ANALYSIS.md](../../../docs/conclave/construc-conclave-9/GAP_ANALYSIS.md) — Book OS vs ingestion.
- `src/actions/books.ts`, `src/actions/book-sections.ts`, `prisma/schema.prisma` `Book`.
