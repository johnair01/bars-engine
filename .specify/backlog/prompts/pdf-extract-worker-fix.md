# Spec Kit Prompt: PDF Extract — Fix Worker Error

## Role

Fix the "Setting up fake worker failed: Cannot find module '.../pdf.worker.mjs'" error when extracting text from PDFs on `/admin/books`.

## Objective

Implement per [.specify/specs/pdf-extract-worker-fix/spec.md](../specs/pdf-extract-worker-fix/spec.md). Root cause: pdf-parse uses pdfjs-dist, which expects a worker file that Next.js bundling does not resolve correctly.

## Requirements

- **Fix**: Replace pdf-parse with pdf-parse-new (no worker; works in Node/server)
- **Contract**: extractTextFromPdf must still return `{ text: string, pageCount: number }`
- **Verification**: Upload PDF, click "Extract Text" on /admin/books; confirm success

## Deliverables

- [x] Remove pdf-parse, install pdf-parse-new
- [x] Update src/lib/pdf-extract.ts to use pdf-parse-new API
- [x] Test: extract text from uploaded PDF (scripts/test-pdf-extract.ts)

## Reference

- Spec: [.specify/specs/pdf-extract-worker-fix/spec.md](../specs/pdf-extract-worker-fix/spec.md)
- Plan: [.specify/specs/pdf-extract-worker-fix/plan.md](../specs/pdf-extract-worker-fix/plan.md)
