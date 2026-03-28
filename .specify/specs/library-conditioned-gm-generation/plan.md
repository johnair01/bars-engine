# Plan: Library-conditioned Game Master generation

Implement per [.specify/specs/library-conditioned-gm-generation/spec.md](./spec.md).

## Architecture (Phase A)

1. **Request** hits `POST /api/agents/generate-passage` (and internal `_generate_slot`) with optional `LibraryConditioningInput`.
2. **Retriever** loads `Book.extractedText` for each `sourceBookId` (Prisma/query from Python DB layer or HTTP to Next—**decide in tasks**: prefer single-process DB access in FastAPI if SQLAlchemy models mirror `Book`).
3. **Chunk** text using algorithm **documented to match** `src/lib/book-chunker.ts` (port, subprocess, or shared WASM—tradeoff in tasks).
4. **Score** chunks by keyword overlap with `queryText` built from `kernel + domain + kotter + face + slot` + `libraryTags`.
5. **Truncate** to `maxExcerptChars`; format `## Reference excerpts (authoritative)` for the model.
6. **Append** `LIBRARY_USE_POLICY` to system prompt for the active face.
7. **Generate** as today; optional debug chunk ids in response when flagged.

## File impacts

| Area | Path |
|------|------|
| Retriever + chunk | `backend/app/library_retrieval.py` (new) |
| Prompt policy | `backend/app/agents/_library_policy.py` or inline in `routes/agents.py` |
| API | `backend/app/routes/agents.py` — request models, `_generate_slot`, `generate_passage` |
| MCP | `backend/app/mcp_server.py` — optional args on tools that call generation |
| Types / client | `src/lib/agent-client.ts` or callers if Next invokes generate-passage with new fields |
| Tests | `backend/tests/test_library_retrieval.py`, golden JSON under `backend/tests/fixtures/library_gm/` |
| Cert | `prisma/seed*.ts` or cert quest seed file — `cert-library-conditioned-gm-v1` |

## Phase B (optional)

- Prisma: `Instance.librarySourceBinding Json?`
- Admin UI: Instance edit form — pick Books as defaults
- Embeddings provider + env docs

## Verification

- `cd backend && make test` (or pytest target) includes retrieval + policy smoke
- `npm run test:gm-agents` still passes
- Manual: spec **Verification Quest**
- Phase B: `npm run db:sync` + migrate after schema edit
