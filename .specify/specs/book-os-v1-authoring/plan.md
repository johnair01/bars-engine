# Plan: Book OS v1 authoring

Implement per [.specify/specs/book-os-v1-authoring/spec.md](./spec.md).

## Phases

1. **Schema** — Prisma models for sections, revisions, runs, approval, BAR links; migration + `db:record-schema-hash`; regenerate client.
2. **Server actions** — CRUD for sections/revisions, run attach, approve; authz mirroring existing admin book routes.
3. **Admin UI** — `/admin/books/[bookId]/sections` list + detail; reorder; show draft vs approved.
4. **Context pack** — read-only action for integrators; document JSON shape in spec appendix or `docs/` if stable.
5. **Pilot** — one internal book wired end-to-end; verification quest in `tasks.md`.

## File impacts (expected)

- `prisma/schema.prisma`, `prisma/migrations/…`
- `src/actions/books.ts` or new `src/actions/book-sections.ts`
- `src/app/admin/books/...` (routes under existing admin layout)
- Optional: `src/lib/book-section-context-pack.ts` for shaping payloads

## Out of scope (v1)

- Full BookProject multi-agent orchestration from `book_os_full_spec.md` (defer to follow-up spec).
- Third-party licensing UI (book-cyoa-stewardship Phase B).

## Related

- [book-cyoa-stewardship plan](../book-cyoa-stewardship/plan.md)
- [docs/conclave/construc-conclave-9/GAP_ANALYSIS.md](../../../docs/conclave/construc-conclave-9/GAP_ANALYSIS.md)
