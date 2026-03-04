# Tasks: Book Upload — Fix Vercel ENOENT

- [ ] Add `@vercel/blob` dependency
- [ ] Create Vercel Blob store in dashboard (book-uploads, private or public)
- [ ] Add `BLOB_READ_WRITE_TOKEN` to Vercel project env; pull to `.env.local`
- [ ] Refactor `uploadBook`: use `put()` when token present, fallback to local fs when not
- [ ] Refactor `extractBookText`: fetch from URL when `sourcePdfUrl` is http, else readFile from local path
- [ ] Remove or guard `mkdir`/`writeFile` for prod path (no-op when using Blob)
- [ ] Test: upload PDF on Vercel deployment
- [ ] Test: extract text on Vercel deployment
- [ ] Test: local dev with and without `BLOB_READ_WRITE_TOKEN` (if fallback implemented)
- [ ] Document 4.5 MB limit in spec or UI (if applicable)
