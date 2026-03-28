# Tasks: Library-conditioned Game Master generation

Spec: [.specify/specs/library-conditioned-gm-generation/spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## Phase A — API + retrieval + prompts

- [ ] **LCG-A1** Document chunk-boundary parity with `src/lib/book-chunker.ts` in spec appendix or `docs/` one-pager (link from plan).
- [ ] **LCG-A2** Implement `library_retrieval.py` (load books, chunk, score, truncate).
- [ ] **LCG-A3** Add `LIBRARY_USE_POLICY` system prompt section; merge into face prompts when conditioning input present.
- [ ] **LCG-A4** Extend Pydantic/request models + `generate_passage` / `_generate_slot` to accept optional `LibraryConditioningInput`.
- [ ] **LCG-A5** Authorization: reject or no-op `sourceBookIds` for unauthenticated/non-admin callers (match existing agent route auth).
- [ ] **LCG-A6** Add **3+ golden traces** under `backend/tests/fixtures/library_gm/` + pytest asserting no excerpt → no fake mechanic phrase from fixture set.
- [ ] **LCG-A7** Update `docs/AGENT_WORKFLOWS.md` — when to pass `sourceBookIds`; link to this spec.
- [ ] **LCG-A8** (Optional) MCP tool args for generation wrappers — same JSON shape.

## Phase B — Instance defaults + ranking (optional)

- [ ] **LCG-B1** Add Prisma field on `Instance` for default library binding JSON — **§ Persisted data** in spec.
- [ ] **LCG-B2** `npx prisma migrate dev --name add_instance_library_source_binding` + commit migration.
- [ ] **LCG-B3** Admin Instances UI: multi-select books + default tags.
- [ ] **LCG-B4** Embeddings or improved ranker — spec update for env + cost.

## Certification + backlog hygiene

- [ ] **LCG-C1** Seed `cert-library-conditioned-gm-v1` per spec Verification Quest.
- [ ] **LCG-C2** Add translation-pair eval JSONL template to `docs/` or `.specify/specs/.../fixtures/` (steward training; optional CI hook).

## Verification

- [ ] `cd backend && make test` (or project-standard Python tests) pass after Phase A.
- [ ] `npm run test:gm-agents` pass.
- [ ] `npm run check` if TypeScript client types changed.
- [ ] Execute manual **Verification Quest** in spec; record pass/fail in PR or BB progress doc.
