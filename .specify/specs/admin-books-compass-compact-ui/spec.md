# Spec: Admin books list overflow + home compass row layout (ABCL)

## Purpose

Fix two shipped UX regressions / layout gaps: (1) **Admin Books** list rows overflow when many per-book actions render in a single non-wrapping row, clipping controls and breaking the card boundary; (2) **Home (NOW) dashboard** stacks the **Four moves** compass and **Current move** blocks vertically, using excessive vertical space before the rest of the dashboard. This spec defines responsive layout, a **book hub** route, and a **See more** pattern so operators can reach every action without horizontal overflow.

**Practice:** Deftness Development — spec kit first, **UI-first** (no new persistence required for v1); deterministic layout and links; extend existing admin book actions and `OrientationCompass` only.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Books: overflow strategy | **Primary actions stay on the list row** (wrapped / fluid width); **secondary actions** behind **See more** (expand in-card) **and** full matrix on **`/admin/books/[id]`** book hub. |
| Books: “book page” | New **`/admin/books/[id]`** hub: title, author, status, key stats, pillar panel, **all** actions in a **wrapping** grid + deep links to `/quests`, `/moves`, thread, PDF. |
| Books: API | **Optional v1**: load hub via server component + Prisma in page (admin-guarded), or thin **`getAdminBookForHub(id)`** server function colocated with `listBooks` — no new tables. |
| Compass: row layout | **≥ `sm` (640px):** single row — compass (fixed max width) + current move (`flex-1 min-w-0`). **< `sm`:** stack vertically for tap targets and readability (compass full width, then current move). |
| Compass: ritual gate copy | Keep existing check-in hint above the **combined** compass block when `showRitualGate`. |
| PHOS alignment | Extends [player-handbook-orientation-system](.specify/specs/player-handbook-orientation-system/spec.md) presentation only; does not change `deriveSuggestion` logic. |

## Conceptual Model

| Dimension | Application |
|-----------|-------------|
| **WHERE** | Admin Books surface (production / Quest Library operators). |
| **Personal throughput** | Four-move compass + “current move” = player orientation on NOW dashboard. |
| **WHAT** | Book rows = pipeline actions (extract, analyze, publish, review). |

## API Contracts (API-First)

> v1 is read-only hub + existing actions. No new public routes.

### `getAdminBookForHub` (recommended)

**Input:** `bookId: string`  
**Output:** `{ book: AdminBookHubDTO } | { error: string }`

```ts
// 'use server' — admin-only; same fields as list row + thread id + sourcePdfUrl
export async function getAdminBookForHub(bookId: string): Promise<
  { book: AdminBookHubDTO } | { error: string }
>
```

- **Server**: `requireAdmin()`, `db.book.findUnique` with `select` matching list needs (no `extractedText`).
- **Alternative v1**: inline `findUnique` in `page.tsx` if team prefers zero new exports.

### Existing actions (unchanged signatures)

Reuse `extractBookText`, `extractBookToc`, `analyzeBook*`, publish flows, etc. from `src/actions/books.ts` / `book-analyze.ts` — only **call sites** move between list, disclosure, and hub.

## User Stories

### P1: Admin — books list never clips actions

**As an** admin **I want** all book actions reachable without horizontal overflow **so that** I can run the pipeline on wide or analyzed books.

**Acceptance:**

- At viewport widths 320px–1440px, **no book card** clips action buttons off the right edge.
- **See more** (or equivalent) reveals hidden actions **or** copy explains **Open book** for the full set.
- **Open book** navigates to `/admin/books/[id]`.

### P2: Admin — book hub is the canonical action surface

**As an** admin **I want** a single book page with every action **so that** I don’t hunt across the list for rare buttons.

**Acceptance:**

- `/admin/books/[id]` shows title, author, status badges, stats from `metadataJson`, praxis pillar controls, and a **wrapping** action area with parity to list actions.
- Links to `/admin/books/[id]/quests`, `/admin/books/[id]/moves`, thread, PDF as today.

### P3: Player — compass + current move compact on tablet/desktop

**As a** logged-in player **I want** the compass and current move in one row on larger screens **so that** the dashboard feels scannable and I see “where I am” and “what’s next” together.

**Acceptance:**

- At **`sm` and up**, compass and current-move panels sit **side by side** in one visual row (compass constrained width, current move uses remaining space).
- Below **`sm`**, layout **stacks** (compass then current move); no clipped text; handbook link still reachable.

### P4: Verification quest

**As** QA **I want** a cert quest **so that** layout fixes stay regressions-tested.

**Acceptance:** Quest `cert-admin-books-compass-compact-ui-v1` seeded; npm script documented in `tasks.md`.

## Functional Requirements

### A — Admin Books list (`BookList.tsx`)

- **FR-A1**: Remove patterns that prevent wrapping on the action cluster (e.g. `shrink-0` on a wide flex row of seven buttons without wrap).
- **FR-A2**: Action area uses **`flex flex-wrap gap-2`** and **`w-full`** on narrow viewports; metadata column stays **`min-w-0`** with **`truncate`** on title where needed.
- **FR-A3**: **Primary row** (product order — implementer may tune): `Open book` (new), `View PDF` (if URL), plus highest-priority stateful action for that status (e.g. `Review quests` when analyzed/published).
- **FR-A4**: **See more**: `<details>`/`<summary>` or button-controlled expander listing remaining actions **or** short copy “All actions on book page” + link only — **pick one in implementation**; spec prefers **expander + link** for redundancy.
- **FR-A5**: Book card layout: prefer **`flex-col`** on small screens; **`sm:flex-row`** allowed if wrap prevents overflow.

### B — Admin Book hub (`/admin/books/[id]/page.tsx`)

- **FR-B1**: New route; admin-only; 404 if missing book.
- **FR-B2**: Surfaces all actions currently on `BookList` for that book (parity).
- **FR-B3**: “Back to Books” link to `/admin/books`.

### C — Home compass (`OrientationCompass.tsx` + optional `page.tsx` wrapper)

- **FR-C1**: Refactor outer structure so **compass grid card** and **current move card** are siblings inside a **responsive flex/grid** container per Design Decisions.
- **FR-C2**: Preserve ritual gate copy placement (above the combined block).
- **FR-C3**: Touch targets ≥ ~44px where feasible on mobile stacked layout.

## Non-Functional Requirements

- No change to player data models.
- Admin hub must not select `extractedText` (P6009 / payload size).
- `npm run build` + `npm run check` after implementation.

## Verification Quest

- **ID**: `cert-admin-books-compass-compact-ui-v1`
- **Steps** (Twine passages):
  1. Sign in as admin test user (or document dev seed).
  2. Open `/admin/books` — pick a book with many actions; confirm no clipped buttons; use **See more** / **Open book**.
  3. Open `/admin/books/[id]` — confirm full action set wraps.
  4. Sign in as player; open `/` — resize to ≥640px: compass + current move on one row; &lt;640px: stacked, readable.
  5. Closing copy ties to **Bruised Banana** residency / party prep or engine quality (per cert quest convention).

Reference: [.specify/specs/cyoa-certification-quests/](../cyoa-certification-quests/), [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## Open decisions (optional answers from product)

1. **Primary three buttons** on the list — confirm order or allow implementer to follow FR-A3 defaults.
2. **See more** — strict preference: in-card expander vs book-page-only (spec recommends both).
3. **Compass below `sm`** — confirm stack-only vs horizontal scroll (spec defaults to stack).

## Dependencies

- [book-to-quest-library](.specify/specs/book-to-quest-library/spec.md) (AZ) — existing pipeline.
- [player-handbook-orientation-system](.specify/specs/player-handbook-orientation-system/spec.md) (PHOS) — compass semantics.

## References

- `src/app/admin/books/BookList.tsx`
- `src/app/admin/books/page.tsx`
- `src/components/dashboard/OrientationCompass.tsx`
- `src/app/page.tsx` (compass placement)
- `src/actions/books.ts`
