# Tasks: Admin books list overflow + home compass row layout (ABCL)

## Spec kit

- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [x] Register in [BACKLOG.md](../../backlog/BACKLOG.md) (row **ABCL**)
- [x] After BACKLOG edit: `npm run backlog:seed`
- [x] Backlog prompt: [admin-books-compass-compact-ui.md](../../backlog/prompts/admin-books-compass-compact-ui.md)

## Phase 1 — Book hub

- [x] `src/app/admin/books/[id]/page.tsx`: admin-only book load, layout shell, back link
- [x] Shared client actions UI (`BookPipelineActions`, `BookHubClient`, `useBookPipelineActions`) with parity for all pipeline buttons
- [x] `getAdminBookForHub` in `src/actions/books.ts` + shared `adminBookHubSelect` with `listBooks`

## Phase 2 — Book list

- [x] `BookList.tsx`: column layout, `min-w-0`, `BookPipelineActions` list mode with **More actions** + **Open book**
- [x] Primary actions + **See more** + **Open book** → `/admin/books/[id]`
- [ ] Visual check: 7+ button state (analyzed + chunks remaining + publish) fits without clipping (manual QA)

## Phase 3 — Compass row

- [x] `OrientationCompass.tsx`: responsive row (`sm+`) / stack (`<sm`); ritual copy above block
- [x] No change required to `src/app/page.tsx`

## Phase 4 — Verification quest

- [x] Twine: `cert-admin-books-compass-compact-ui-v1` (admin books + home layout + BB framing)
- [x] Wire seed in `scripts/seed-cyoa-certification-quests.ts` + `CERT_QUEST_IDS`
- [x] `package.json`: `seed:cert:admin-books-compass`

## Final

- [x] `npx tsc --noEmit`
- [x] `npm run build`
- [x] Implementation tasks above (except manual visual check)
