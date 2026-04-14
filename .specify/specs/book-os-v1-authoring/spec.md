# Spec: Book OS v1 — governed section authoring

## Purpose

Add a **governed manuscript layer** for books already in the engine: versioned **sections**, **draft vs approved** content, **runs** (e.g. ChatGPT / agent drafts), **approval events**, **BAR links**, and a **section context pack** for retrieval—plus **admin UI** to map and manage sections under a book.

**Practice**: Deftness Development — API-first contracts, Prisma migrations only (`migrate deploy`), deterministic fallbacks where agents are optional.

## Problem

Today, `Book` and related actions focus on **ingestion → extraction → gameplay** (threads, quests). There is no persisted model for **living manuscript structure** (sections, sources, style/canon rules, approval history) or **governed draft flow** as described in the Conclave cursor spec.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Authority | Repo-grounded detail lives in [docs/conclave/construc-conclave-9/book_os_v1_cursor_spec.md](../../../docs/conclave/construc-conclave-9/book_os_v1_cursor_spec.md); [book_os_full_spec.md](../../../docs/conclave/construc-conclave-9/book_os_full_spec.md) informs **later** agent/BookProject narrative, not duplicate v1 schema. |
| Stewardship | Rights, attribution, and 1st-party pilot process remain in [book-cyoa-stewardship](../book-cyoa-stewardship/spec.md); this spec owns **technical manuscript governance**. |
| Draft vs approved | Player-facing and production retrieval use **approved** section revision only unless an explicit **preview** role/flag is implemented (default: no). |
| Agent runs | `SectionRun` stores provider, model, prompt hash/summary, output snapshot; pushing to draft is an explicit steward action. |

## Conceptual Model

| Dimension | In this spec |
|-----------|----------------|
| **WHO** | Admin/steward authors; players consume approved content only (default). |
| **WHAT** | `Book` → ordered **sections** → revisions (draft/approved), runs, BAR links, context pack fields. |
| **WHERE** | Admin: `/admin/books/[bookId]/sections` (exact paths in `plan.md`). |
| **Energy** | BARs link to sections for traceability from gameplay back to manuscript. |

## API Contracts (sketch — refine in implementation)

### Server actions (representative)

**Input / output** (names illustrative; align with existing `books` action style):

- `listBookSections(bookId)` → ordered sections + latest approved revision summary.
- `getSectionContextPack(sectionId)` → bounded JSON for agent/retrieval (canon excerpt, style rules, linked BAR ids).
- `createSectionDraftFromRun(sectionId, runId)` → steward merges run into draft revision.
- `approveSectionRevision(revisionId)` → writes `ApprovalEvent`, promotes to approved.

```ts
// Shapes follow Prisma models introduced in Phase 1; see tasks.md
```

## User Stories

### P1: Schema + admin map

**As a steward**, I want books to have ordered sections with draft/approved revisions, so manuscript state is not trapped in external docs.

**Acceptance**: Prisma models migrated; admin page lists sections and shows approval state for a pilot book.

### P2: Runs + approval audit

**As a steward**, I want agent runs recorded and approval events immutable, so we can audit what reached players.

**Acceptance**: Create run → attach to section → approve revision → history visible in admin.

### P3: Context pack + BAR links

**As an integrator**, I want a bounded context pack and BAR links per section, so downstream features retrieve consistent canon.

**Acceptance**: API/action returns context pack; BAR ids stored and validated against existing BAR/campaign rules where applicable.

## Functional Requirements

### Phase 1

- **FR1**: Add Prisma models aligned with cursor spec: `BookSection`, `SectionSource`, `CanonRule` / `StyleRule` (or merged table per implementation), `SectionRevision` (draft | approved), `SectionRun`, `ApprovalEvent`, `SectionBARLink` (names may be adjusted in migration for consistency with codebase).
- **FR2**: Foreign keys to `Book` and existing user/steward identity model; indexes for `bookId`, `order`, `sectionId`.
- **FR3**: Admin UI: section list + create/reorder + link to detail (minimal v1).

### Phase 2

- **FR4**: Run ingestion endpoint or server action (payload size limits per NFR).
- **FR5**: `getSectionContextPack` (or equivalent) with documented max token/field bounds.

## Non-Functional Requirements

- Migrations committed; no `db push` for production path.
- Server actions: `{ success, error, data }` pattern; authz checks for admin routes.
- Large payloads: respect `serverActions.bodySizeLimit` and project scaling checklist.

## Persisted data & Prisma

| Check | Done |
|-------|------|
| Models named in Design Decisions / FR1 | |
| `tasks.md` includes migrate dev → commit SQL → deploy → `db:record-schema-hash` | |
| Human reviewed migration for additive vs destructive | |

## Verification Quest

- **ID**: `cert-book-os-v1-authoring-v1`
- **Steps**: Create pilot book section → draft revision → approve → confirm player/API path cannot read unapproved revision (default) → spot-check context pack payload.

## Dependencies

- [book-cyoa-stewardship](../book-cyoa-stewardship/spec.md)
- [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md) (where book-backed campaigns attach)
- Existing `Book` model and `src/actions/books.ts` patterns

## Follow-on

- [book-origin-fork-port](../book-origin-fork-port/spec.md) — library vs manuscript origin, fork-from-library (TOC → `BookSection`), optional BAR/move/quest import and campaign port (implements after this spec’s section slice).

## References

- [book_os_v1_cursor_spec.md](../../../docs/conclave/construc-conclave-9/book_os_v1_cursor_spec.md)
- [book_os_full_spec.md](../../../docs/conclave/construc-conclave-9/book_os_full_spec.md)
- [GAP_ANALYSIS.md](../../../docs/conclave/construc-conclave-9/GAP_ANALYSIS.md)
- [SIX_FACES_CONCLAVE_BUNDLE.md](../../../docs/conclave/construc-conclave-9/SIX_FACES_CONCLAVE_BUNDLE.md)
