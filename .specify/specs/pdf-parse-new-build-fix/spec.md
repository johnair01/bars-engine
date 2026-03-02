# Spec: PDF Parse New — Fix Next.js Build (pdf-child.js module not found)

## Purpose

Fix the Next.js build failure when bundling `pdf-parse-new`: "Cannot find module 'pdf-child.js'" (or similar). The package uses `child_process.fork()` with a sibling file; Next.js/Turbopack bundling mangles paths so the child script is not found. This blocks `npm run build` and deployment.

## Root cause

`pdf-parse-new` (v2.x) uses `fork(__dirname + '/pdf-child.js')` to run PDF parsing in a child process. During Next.js build, the package gets bundled; `__dirname` resolves to a path inside `.next/` where `pdf-child.js` does not exist. The bundler does not copy the child script.

**Reference**: [pdf-parse-new issue #4](https://github.com/simonegosetto/pdf-parse-new/issues/4), Next.js `serverComponentsExternalPackages`.

## User story

**As a developer**, I want `npm run build` to succeed, so I can deploy the app and run the Book-to-Quest Library flow.

**Acceptance**: `npm run build` completes; PDF extraction still works at runtime on `/admin/books`.

## Solution options

| Option | Pros | Cons |
|--------|------|------|
| **A: serverComponentsExternalPackages** | Standard Next.js approach; package not bundled | Requires Next.js config change |
| **B: Dynamic import** | Lazy load only when needed | May not fix fork path; still bundled |
| **C: Switch to different PDF lib** | Avoid pdf-parse-new entirely | Different API; more work |

**Recommended**: Option A — add `pdf-parse-new` to `serverComponentsExternalPackages` so Next.js does not bundle it; it runs from `node_modules` at runtime.

## Functional requirements

- **FR1**: `npm run build` MUST complete without "module not found" or fork-related errors.
- **FR2**: PDF text extraction MUST still work at runtime (extractBookText server action).
- **FR3**: Add `serverComponentsExternalPackages: ['pdf-parse-new']` (or equivalent) to Next.js config.

## Non-functional requirements

- No change to the extract API contract (`extractTextFromPdf`).
- Verify with `npm run build` and a quick extract test.

## Out of scope

- Changing PDF library
- Supporting image-based PDFs (OCR)

## Reference

- [src/lib/pdf-extract.ts](../../src/lib/pdf-extract.ts)
- [src/actions/books.ts](../../src/actions/books.ts)
- [next.config.ts](../../next.config.ts)
- [PDF Extract Worker Fix](../pdf-extract-worker-fix/spec.md) (prior fix: pdf.worker.mjs)
