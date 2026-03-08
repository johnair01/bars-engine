# Tasks: Book Upload — Fix Client-Side Exception on Vercel

## Phase 1: Fail Fast When Blob Token Missing

- [ ] In `src/actions/books.ts`, add check: if `!BLOB_READ_WRITE_TOKEN` and `VERCEL` env set, return clear error before attempting mkdir
- [ ] Document BLOB_READ_WRITE_TOKEN in docs/ENV_AND_VERCEL.md or README

## Phase 2: Server-Only Module Isolation

- [ ] Add `@vercel/blob` to `serverExternalPackages` in next.config.ts
- [ ] Verify no client component imports pdf-extract or @vercel/blob directly

## Phase 3: Verification

- [ ] Confirm BLOB_READ_WRITE_TOKEN is set in Vercel project env
- [ ] Deploy; test /admin/books upload on bars-engine.vercel.app
- [ ] If token missing: verify clear error message (not generic client exception)
- [ ] If token set: verify successful upload
