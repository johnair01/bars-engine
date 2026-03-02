# Spec: Book Upload — Fix "Unexpected Response from Server"

## Purpose

Fix the runtime error when uploading a PDF on `/admin/books`: "An unexpected response was received from the server" at BookUploadForm. This blocks the Book-to-Quest Library Phase 2 certification flow.

## Root cause

Next.js Server Actions enforce a **1 MB default body size limit**. PDFs typically exceed 1 MB. When the limit is exceeded, the server returns a 400/413 before the action runs, producing a response that doesn't match the expected `content-type: text/x-component` format—hence "unexpected response."

**Reference**: [Next.js Discussion #74766](https://github.com/vercel/next.js/discussions/74766) — Server Action fails silently when body size exceeds limit.

## User story

**As an admin**, I want to upload PDFs (including files larger than 1 MB) on the Books page, so I can ingest books for the Quest Library without hitting a silent failure.

**Acceptance**: Uploading a PDF up to 20 MB on `/admin/books` completes successfully (or returns a clear error if something else fails).

## Functional requirements

- **FR1**: `next.config` MUST set `serverActions.bodySizeLimit` to at least 20 MB (20 * 1024 * 1024 bytes) to support typical book PDFs.
- **FR2**: The upload flow MUST continue to use the existing `uploadBook` server action with FormData.
- **FR3**: If upload fails for other reasons (e.g. disk full, permission), the error MUST be surfaced to the user (existing try/catch returns `{ error: msg }`).

## Non-functional requirements

- Minimal change: config only; no refactor of upload flow.
- 20 MB is a reasonable default for book chapters; full books may need more later.

## Out of scope

- Client-side file size validation (nice-to-have; config fix unblocks first)
- Chunked upload or streaming (future enhancement for very large files)

## Reference

- [next.config.js serverActions](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- Affected: [src/app/admin/books/page.tsx](../../src/app/admin/books/page.tsx), [src/actions/books.ts](../../src/actions/books.ts)
