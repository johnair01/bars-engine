# Plan: Book CYOA campaign (MtGoA Chapter 1 demo)

## Implementation order

1. **Spec kit** — `spec.md`, `plan.md`, `tasks.md` (this folder); BACKLOG row + `npm run backlog:seed`.
2. **Phase A — Data + content** — Seed `Adventure` + `Passage` rows for MtGoA Chapter 1; wire `QuestAdventureLink` / `linkedQuestId` to published library quests; set `QuestThread.adventureId` for the book thread (script in `scripts/` or extend existing seed pattern).
3. **Phase A — Contracts** — Implement or wire server actions per [spec § API contracts](./spec.md) (may be thin wrappers over existing assign/progress flows); document the happy path in the runbook.
4. **Phase A — Demo package** — `docs/runbooks/BOOK_CYOA_MTGOA_CHAPTER1_DEMO.md` (or agreed name): URL, auth, bullets, limitations.
5. **`npm run check`** — after any app code changes.
6. **Phase B** — Template slot doc + authoring guide (markdown in this spec folder or `docs/` as referenced from spec).
7. **Phase C** — Optional cert quest + `seed:cert:*` script entry (defer).

## File impacts (expected)

| Area | Files / artifacts |
|------|-------------------|
| Seeds | New or extended script under `scripts/` (pattern: `seed-*.ts`, idempotent upserts) |
| Actions | `src/actions/` — only if new wrappers are required; prefer reusing campaign / library assign |
| Reader | `CampaignReader`, `src/app/campaign/*` — only if Phase A requires new entry params or progress hooks |
| Prisma | None for v1 if `Passage.metadata` convention suffices |
| Docs | `docs/runbooks/…`, [spec.md](./spec.md) / [plan.md](./plan.md) updates |
| Backlog | [.specify/backlog/BACKLOG.md](../../backlog/BACKLOG.md) |

## Alignment notes

- **UGA** — When Passage admin save validation lands, reuse shared graph validator; until then, manual QA + seed review.
- **COC** — Book CYOA is **campaign onboarding** in the broad ontology only where product IA touches the same surfaces; do not block P1 on COC builder phases.

## Cursor plan overlay

Strategic overlay (vision + GM table): `.cursor/plans/book_cyoa_allyship_demo_9c34b122.plan.md` (local Cursor plans directory). **This spec kit is canonical** for implementation.
