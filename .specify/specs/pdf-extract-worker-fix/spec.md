# Spec: PDF Extract — Fix "Cannot find module pdf.worker.mjs"

## Purpose

Fix the runtime error when extracting text from a PDF: "Setting up fake worker failed: Cannot find module '.../pdf.worker.mjs'". This blocks the Book-to-Quest Library Phase 2 flow (cert-book-to-quest-library-v1).

## Root cause

The `pdf-parse` package (v2) uses `pdfjs-dist` under the hood. In Next.js server actions, pdfjs-dist tries to load a worker file. The worker path gets mangled by Next.js/Turbopack bundling—the resolved path points to `.next/dev/server/chunks/ssr/` where the worker doesn't exist.

**Reference**: [pdf-parse-new issue #4](https://github.com/simonegosetto/pdf-parse-new/issues/4), [Stack Overflow](https://stackoverflow.com/questions/76641524/setting-up-fake-worker-failed-cannot-find-module-pdf-worker-js-error-afte)

## User story

**As an admin**, I want to extract text from uploaded PDFs on the Books page, so I can proceed to AI analysis and quest creation.

**Acceptance**: Clicking "Extract Text" on a draft book completes successfully; book status changes to extracted with page/word count.

## Solution options

| Option | Pros | Cons |
|--------|------|------|
| **A: Switch to pdf-parse-new** | No worker; pure JS; drop-in API | Different package; may have different edge cases |
| **B: Run extraction in child process** | Isolates bundling; keeps pdf-parse | Complex; spawn script; slower |
| **C: Configure pdfjs worker path** | Keeps pdf-parse | Worker path varies by Next.js build; fragile |

**Recommended**: Option A — switch to `pdf-parse-new`, which does not require a worker and works in Node.js/server environments.

## Functional requirements

- **FR1**: PDF text extraction MUST work in Next.js server actions (extractBookText).
- **FR2**: Extraction MUST return `{ text: string, pageCount: number }` (existing contract).
- **FR3**: Replace pdf-parse with pdf-parse-new (or equivalent that avoids worker).

## Out of scope

- Changing the extract API contract
- Supporting image-based PDFs (OCR)

## Reference

- [src/lib/pdf-extract.ts](../../src/lib/pdf-extract.ts)
- [src/actions/books.ts](../../src/actions/books.ts)
