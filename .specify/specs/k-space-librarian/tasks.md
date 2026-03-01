# Tasks: K-Space Librarian

## Phase 1: Schema

- [x] Add LibraryRequest model to prisma/schema.prisma
- [x] Add DocNode model
- [x] Add DocEvidenceLink model
- [x] Add BacklogItem model
- [x] Add Schism model (Phase 4)
- [x] Extend CustomBar: docQuestMetadata, evidenceKind
- [x] Run npm run db:sync

## Phase 1: Actions + API

- [x] Create src/actions/library.ts (submitLibraryRequest, resolveOrSpawn, searchDocNodes)
- [x] Create src/actions/doc-node.ts (createDocNode, promote, merge)
- [x] Create POST /api/library/requests
- [x] Create GET /api/library/requests/[id]
- [x] Create GET /api/library/search
- [x] Create POST /api/library/requests/[id]/resolve (admin)
- [x] Create POST /api/docs/nodes
- [x] Create GET /api/docs/nodes/[slug]
- [x] Create POST /api/docs/nodes/[id]/promote
- [x] Create POST /api/docs/nodes/[id]/merge

## Phase 1: UI

- [x] Create LibraryRequestModal component
- [x] Add "Request from Library" to header or dashboard (logged-in)
- [x] Create /admin/library page
- [x] Create /admin/docs page
- [x] Add admin nav links for Library, Docs

## Phase 2: DocQuest + Evidence

- [ ] DocQuest creation in resolveOrSpawn (CustomBar type doc)
- [ ] DocQuest completion flow: evidence submission
- [ ] DocEvidenceLink creation on evidence submit
- [ ] Create src/lib/doc-assembly.ts (deterministic draft generation)

## Phase 3: RST/Sphinx Build

- [ ] Create scripts/export-docs-to-rst.ts
- [ ] Add Sphinx config (docs/source, conf.py)
- [ ] Add npm run docs:build script

## Verification Quest

- [ ] Add cert-k-space-librarian-v1 to seed script

## Backlog

- [ ] Add AI to BACKLOG.md
- [ ] Create .specify/backlog/prompts/k-space-librarian.md
