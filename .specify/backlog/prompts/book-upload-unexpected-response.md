# Spec Kit Prompt: Book Upload — Fix Unexpected Response

## Role

Fix the "An unexpected response was received from the server" error when uploading PDFs on `/admin/books`.

## Objective

Implement per [.specify/specs/book-upload-unexpected-response/spec.md](../specs/book-upload-unexpected-response/spec.md). Root cause: Next.js Server Actions default 1 MB body limit; PDFs exceed it.

## Requirements

- **Fix**: Add `serverActions.bodySizeLimit: '20mb'` to `next.config.ts`
- **Verification**: Upload a PDF > 1 MB on /admin/books; confirm success

## Deliverables

- [x] next.config.ts updated with bodySizeLimit
- [ ] Test: upload PDF > 1 MB

## Reference

- Spec: [.specify/specs/book-upload-unexpected-response/spec.md](../specs/book-upload-unexpected-response/spec.md)
- [Next.js serverActions.bodySizeLimit](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
