# Plan: Book origin modes, fork-from-library, and gameplay porting

Implement per [.specify/specs/book-origin-fork-port/spec.md](./spec.md).

## Phases

1. **Schema** — `Book.bookOrigin`, `Book.parentBookId`, optional `forkedAt` / fork metadata; migration + backfill; regenerate client.
2. **Admin visibility** — Book hub + list show origin badge; hide or soften “Fork” when TOC missing (copy explains).
3. **Fork action** — `forkBookFromLibrary` + revalidate; TOC parser shared helper (reuse `metadataJson.toc` shape from book pipeline where present).
4. **Sections** — Call into existing `createBookSection` patterns or internal batch insert after fork (transaction: create `Book` + N sections).
5. **Journey assist** (optional) — `SectionRun` + steward UI button; no auto-approve.
6. **Import wizards** — Preview/commit for quests/moves/BARs; provenance on `CustomBar` / links per spec FR6.
7. **Campaign port** — After ontology audit; feature-flagged wizard.

## File impacts (expected)

- `prisma/schema.prisma`, `prisma/migrations/…`
- `src/actions/books.ts` or new `src/actions/book-fork.ts`
- `src/lib/book-toc-to-sections.ts` (pure helper: TOC JSON → section DTOs)
- `src/app/admin/books/[id]/page.tsx`, `BookHubClient.tsx` — fork CTA + origin badge
- Optional: `src/app/admin/books/[id]/fork/page.tsx` wizard

## Out of scope (v1 of this spec)

- Public self-serve fork (non-admin).
- Automatic publication of forked content to players without steward review.
- Full Google Docs / OAuth live co-authoring.

## Related

- [book-os-v1-authoring plan](../book-os-v1-authoring/plan.md)
- [docs/process/spec-prework-iching-six-faces.md](../../../docs/process/spec-prework-iching-six-faces.md)
