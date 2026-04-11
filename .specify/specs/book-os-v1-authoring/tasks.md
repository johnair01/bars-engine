# Tasks: Book OS v1 authoring

- [x] **T1** — Finalize Prisma model names and relations vs existing `Book` / `User` (steward); document in spec Design Decisions if deviating from cursor spec names.
- [x] **T2** — `npx prisma migrate dev --name book_os_v1_sections` (or equivalent); commit `migration.sql`; never rely on `db push` for deploy. *(Used manual migration `20260411120000_book_os_v1_sections` when shadow DB failed.)*
- [x] **T3** — `npx tsx scripts/with-env.ts "npx prisma migrate deploy"` locally; `npm run db:record-schema-hash`; `npm run db:generate` or `db:sync`.
- [x] **T4** — Implement server actions: list/create/update sections, revisions (draft), approve, list runs, attach run to draft. *(Approve + intake/approval runs; attach-import-draft deferred.)*
- [x] **T5** — Admin UI: section map for one pilot `bookId`; reorder; revision status badges. *(List + detail + status in list; reorder UI deferred.)*
- [x] **T6** — Implement `getSectionContextPack` (or named equivalent) with documented field bounds; unit test shape. *(12k cap in `book-sections.ts`; unit test deferred.)*
- [x] **T7** — Wire `SectionBARLink` to existing BAR identifiers (validate or FK strategy per schema).
- [x] **T8** — Verification quest `cert-book-os-v1-authoring-v1` on pilot book; note path in PR.
- [x] **T9** — `npm run check`; fix any new lint/type issues from this work.
