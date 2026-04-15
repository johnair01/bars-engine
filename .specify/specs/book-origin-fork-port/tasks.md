# Tasks: Book origin fork port

- [x] **T1** — Add Prisma fields on `Book`: `bookOrigin`, `parentBookId`, optional `forkedAt`, optional `forkMetadataJson` (or document keys in `metadataJson` if minimizing columns).
- [x] **T2** — Migration + default `bookOrigin = 'library_ingested'` for existing rows; `migrate deploy`; `npm run db:record-schema-hash`.
- [x] **T3** — Implement `lib/book-toc-to-sections.ts`: input TOC shape from `parseBookMeta` / `metadataJson`, output ordered `{ title, slug?, orderIndex }[]`; unit tests with fixtures.
- [x] **T4** — `forkBookFromLibrary` server action: validate admin + parent book; create child book; batch `BookSection` inserts; write `SectionRun` fork event.
- [x] **T5** — Admin UI: origin badge on book hub; “Fork for authoring” → confirm modal → calls T4; link to child book sections.
- [x] **T6** — Optional: journey field suggest action + steward confirm (stores via `updateBookSection` + `SectionRun`).
- [x] **T7** — `previewImportBookGameplay` / `commitImportBookGameplay` with provenance (see spec FR6).
- [x] **T8** — Campaign port wizard stub or full implementation per spec § Phase 4 + campaign ontology tasks.
- [x] **T9** — Verification quest `cert-book-origin-fork-port-v1` + seed hook in `scripts/seed-cyoa-certification-quests.ts` if required by cert pattern.
- [x] **T10** — `npm run check`; update [BACKLOG.md](../../backlog/BACKLOG.md) row status when shipped.
