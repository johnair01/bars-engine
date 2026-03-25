# Plan: Admin books list overflow + home compass row layout (ABCL)

Implement per [.specify/specs/admin-books-compass-compact-ui/spec.md](./spec.md).

## Phases

### Phase 1 — Admin book hub (unblocks list simplification)

1. Add **`src/app/admin/books/[id]/page.tsx`** (server): `requireAdmin`, load book by id (no `extractedText`), not found → `notFound()`.
2. Extract or duplicate action handlers from `BookList` into a shared **client** component **`BookAdminActions`** (props: `book` + metadata shape) used by both list and hub — **or** hub-only client island that imports the same action modules (avoid duplicating business logic).
3. Hub layout: header (title, author, badges, stats), `BookPraxisPanel`, wrapping grid of actions, links to quests/moves/thread.

### Phase 2 — Book list: wrap + See more + Open book

1. Restructure each book row: left column `min-w-0 flex-1`, right column `w-full sm:max-w-*` or full-width below title on mobile.
2. Replace rigid `flex gap-2 shrink-0` action strip with **wrap** + **primary** subset + **See more** per spec FR-A3–A4.
3. Add **`Link` to `/admin/books/[id]`** (“Open book” / “Manage”).

### Phase 3 — Orientation compass layout

1. In **`OrientationCompass.tsx`**, wrap the two inner cards in a container:
   - `flex flex-col sm:flex-row sm:items-stretch gap-2` (tune gap).
   - Compass: `sm:max-w-[240px] sm:shrink-0` (adjust after visual QA).
   - Current move: `min-w-0 flex-1`.
2. Verify ritual gate paragraph remains above the wrapper.
3. Optional: snapshot **`page.tsx`** only if wrapper must live outside component (prefer keeping logic inside `OrientationCompass`).

### Phase 4 — Verification quest + scripts

1. Add Twine story + seed entry `cert-admin-books-compass-compact-ui-v1`.
2. Add `npm run seed:cert:admin-books-compass` (or extend existing cert seed with a flag) per repo pattern.

## File impact (expected)

| Area | Files |
|------|--------|
| Admin hub | `src/app/admin/books/[id]/page.tsx` (new), possible `BookAdminActions.tsx` or `BookPipelineActions.tsx` (new) |
| List | `src/app/admin/books/BookList.tsx` |
| Compass | `src/components/dashboard/OrientationCompass.tsx` |
| Actions | `src/actions/books.ts` (optional `getAdminBookForHub`) |
| Cert | `.specify/specs/.../seed.twine` or story under `stories/`, `scripts/seed-cyoa-certification-quests.ts`, `package.json` script |

## Verification

- Manual: Chrome devtools 320 / 375 / 768 / 1280 for `/admin/books` and `/`.
- `npm run check`, `npm run build`.
- Run cert seed; complete quest in dev.
