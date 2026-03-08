# Prompt: Book Upload — Fix Client-Side Exception on Vercel

**Use this prompt when fixing "Application error: a client-side exception has occurred while loading bars-engine.vercel.app" during PDF upload on Vercel deployment.**

## Context

The book upload flow on /admin/books fails with a client-side exception on Vercel. This may be related to: (1) BLOB_READ_WRITE_TOKEN not set, causing mkdir fallback which fails on read-only Vercel filesystem; (2) module bundling pulling server-only code into client; (3) error response format confusing useActionState.

## Prompt text

> Fix the book upload client-side exception per [.specify/specs/book-upload-vercel-client-exception/spec.md](../specs/book-upload-vercel-client-exception/spec.md). Add fail-fast in uploadBook: when BLOB_READ_WRITE_TOKEN is unset and VERCEL env is set, return clear error instead of attempting mkdir. Add @vercel/blob to serverExternalPackages in next.config.ts. Document BLOB_READ_WRITE_TOKEN in deployment docs. Verify BLOB_READ_WRITE_TOKEN is set in Vercel project env. Deploy and test upload on bars-engine.vercel.app.

## Checklist

- [ ] Phase 1: Fail-fast when Blob token missing
- [ ] Phase 2: Add @vercel/blob to serverExternalPackages
- [ ] Phase 3: Document env; verify Vercel env; deploy and test

## Reference

- Spec: [.specify/specs/book-upload-vercel-client-exception/spec.md](../specs/book-upload-vercel-client-exception/spec.md)
- Plan: [.specify/specs/book-upload-vercel-client-exception/plan.md](../specs/book-upload-vercel-client-exception/plan.md)
- Related: [book-upload-vercel-enoent](book-upload-vercel-enoent.md), [book-upload-unexpected-response](book-upload-unexpected-response.md)
