# Spec: Book Upload — Fix Vercel ENOENT (mkdir public)

## Purpose

Fix the runtime error when uploading a PDF on `/admin/books` on Vercel deployment: `ENOENT: no such file or directory, mkdir '/var/task/public'`. Uploads work locally but fail in production.

## Root cause

The upload flow writes PDFs to the local filesystem at `public/uploads/books/{id}.pdf`:

- **Line 10** in `src/actions/books.ts`: `UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'books')`
- **Line 64**: `await mkdir(UPLOAD_DIR, { recursive: true })`
- **Lines 65–67**: PDF buffer written with `writeFile`
- **Line 81**: `sourcePdfUrl` set to `/uploads/books/${book.id}.pdf` (served from `public/`)

On Vercel, serverless functions run under `/var/task` with a **read-only filesystem**. The `public` directory is for build-time static assets; runtime writes are not allowed. Creating `public/uploads/books` or writing files there fails with ENOENT.

**Reference**: [Vercel Serverless Functions — read-only filesystem](https://vercel.com/docs/functions/serverless-functions/runtimes#file-system)

## User story

**As an admin**, I want to upload PDFs on the Books page in production (Vercel), so I can ingest books for the Quest Library without hitting an ENOENT error.

**Acceptance**: Uploading a PDF on `/admin/books` on bars-engine.vercel.app completes successfully; the book record is created and text extraction works.

## Functional requirements

- **FR1**: PDF storage MUST use cloud object storage (Vercel Blob or equivalent), not the local filesystem, when running on Vercel.
- **FR2**: `sourcePdfUrl` MUST store a URL that resolves to the uploaded PDF (Blob URL or equivalent).
- **FR3**: `extractBookText` MUST read the PDF from the same storage (Blob URL) instead of the local filesystem.
- **FR4**: Local dev MUST continue to work; use environment detection or feature flag to support both local filesystem (dev) and Blob (production), or use Blob in both environments for consistency.

## Non-functional requirements

- Minimal change: refactor upload and extract flows only; no schema changes to `Book` (sourcePdfUrl already stores a string).
- Vercel Blob has a [4.5 MB request body limit](https://vercel.com/docs/functions/runtimes#request-body-size) on Hobby. For larger PDFs, consider client-side upload or Pro plan. Document this constraint.

## Out of scope

- Client-side upload for files > 4.5 MB (future enhancement)
- Migration of existing books already stored in `public/uploads/books` (manual or separate task)

## Reference

- [Vercel Blob — Server Upload](https://vercel.com/docs/storage/vercel-blob/server-upload)
- [Vercel Blob — Using the SDK](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
- Affected: [src/actions/books.ts](../../src/actions/books.ts), [src/lib/pdf-extract.ts](../../src/lib/pdf-extract.ts)
