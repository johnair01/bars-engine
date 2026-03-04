# Spec Kit Prompt: Book Upload — Fix Vercel ENOENT

## Role

Fix the `ENOENT: no such file or directory, mkdir '/var/task/public'` error when uploading PDFs on `/admin/books` on Vercel. Uploads work locally but fail in production.

## Objective

Implement per [.specify/specs/book-upload-vercel-enoent/spec.md](../specs/book-upload-vercel-enoent/spec.md). Root cause: Vercel serverless functions use a read-only filesystem; the current flow writes to `public/uploads/books`, which is not writable in production.

## Requirements

- **Fix**: Replace local filesystem storage with Vercel Blob for PDF uploads
- **uploadBook**: Use `put()` from `@vercel/blob` when `BLOB_READ_WRITE_TOKEN` is set; store returned URL in `sourcePdfUrl`
- **extractBookText**: Fetch PDF from `sourcePdfUrl` when it's an http URL; otherwise read from local path (dev fallback)
- **Setup**: Create Blob store in Vercel Dashboard; add `BLOB_READ_WRITE_TOKEN` to project env

## Deliverables

- [ ] @vercel/blob installed
- [ ] Blob store created; token in env
- [ ] uploadBook refactored to use Blob
- [ ] extractBookText refactored to fetch from URL
- [ ] Test: upload + extract on Vercel deployment

## Reference

- Spec: [.specify/specs/book-upload-vercel-enoent/spec.md](../specs/book-upload-vercel-enoent/spec.md)
- Plan: [.specify/specs/book-upload-vercel-enoent/plan.md](../specs/book-upload-vercel-enoent/plan.md)
- [Vercel Blob — Server Upload](https://vercel.com/docs/storage/vercel-blob/server-upload)
