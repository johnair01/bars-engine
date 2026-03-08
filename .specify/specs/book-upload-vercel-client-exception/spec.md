# Spec: Book Upload — Fix Client-Side Exception on Vercel

## Purpose

Fix the "Application error: a client-side exception has occurred while loading bars-engine.vercel.app" when uploading a PDF via the book upload flow on Vercel deployment. This may be the same class of issue encountered before Vercel Blob was added, or a new manifestation (module bundling, env, or response handling).

## Root Cause (Triage)

Possible causes:

1. **BLOB_READ_WRITE_TOKEN not set on Vercel** — Code falls back to `mkdir` + `writeFile` to `public/uploads/books`. On Vercel, the filesystem is read-only; `mkdir` throws ENOENT. Server action fails; client may surface a generic error or "unexpected response."

2. **Server action response format** — When upload fails (e.g. ENOENT), the error response might not match the expected `content-type: text/x-component` format, causing useActionState to throw a client-side exception. (See [book-upload-unexpected-response](book-upload-unexpected-response/spec.md).)

3. **Module bundling** — `@vercel/blob`, `fs/promises`, or `pdf-parse-new` accidentally bundled for client. If a client component's import chain pulls in server-only code, the browser will throw when evaluating Node.js APIs.

4. **pdf-parse-new in client bundle** — If `pdf-parse-new` (or its child process) gets bundled for client, it will fail. Already in `serverExternalPackages`; verify it's not imported by any client component.

## User Story

**As an admin**, I want to upload PDFs on `/admin/books` on bars-engine.vercel.app without hitting a client-side exception, so I can ingest books for the Quest Library.

**Acceptance**: Navigating to `/admin/books` and uploading a PDF completes successfully; no "Application error" or client-side exception.

## Functional Requirements

### FR1: BLOB_READ_WRITE_TOKEN on Vercel

- `BLOB_READ_WRITE_TOKEN` MUST be set in Vercel project environment variables.
- If unset, `uploadBook` falls back to `mkdir` which fails on Vercel (read-only filesystem).
- Document in deployment checklist; add to `docs/ENV_AND_VERCEL.md` or equivalent.

### FR2: Fail fast when Blob token missing in production

- When `BLOB_READ_WRITE_TOKEN` is unset and `VERCEL` env is set (production), return a clear error instead of attempting `mkdir`: "PDF upload requires BLOB_READ_WRITE_TOKEN. Add it in Vercel project settings."
- Prevents ENOENT and surfaces the real cause.

### FR3: Server-only module isolation

- Ensure `@vercel/blob` and `books.ts` are never bundled for client. Add `@vercel/blob` to `serverExternalPackages` if bundling is suspected.
- Verify no client component imports from `books.ts` except for server action references (useActionState passes action by ID; implementation stays server-only).

### FR4: Error response format

- When `uploadBook` returns `{ error: string }`, ensure the response is valid for useActionState. Existing try/catch returns `{ error: msg }`; verify no serialization issues.

## Non-functional Requirements

- Add triage checklist for future "client-side exception" debugging.
- Minimal changes; prefer env + fail-fast over large refactors.

## Verification

1. Confirm `BLOB_READ_WRITE_TOKEN` is set in Vercel project env.
2. Deploy; open `/admin/books` on bars-engine.vercel.app.
3. Upload a PDF (< 4.5 MB for Hobby).
4. Confirm no client-side exception; book appears in list.

## Reference

- [book-upload-vercel-enoent](book-upload-vercel-enoent/spec.md) — Vercel Blob migration
- [book-upload-unexpected-response](book-upload-unexpected-response/spec.md) — Body size limit
- [pdf-parse-new-build-fix](pdf-parse-new-build-fix/spec.md) — serverExternalPackages
- Affected: [src/actions/books.ts](../../src/actions/books.ts), [next.config.ts](../../next.config.ts)
