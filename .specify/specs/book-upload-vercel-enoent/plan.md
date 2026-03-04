# Plan: Book Upload — Fix Vercel ENOENT

## Summary

Replace local filesystem storage with Vercel Blob for PDF uploads. Use Blob in both dev and production for consistency; fall back to local filesystem only when `BLOB_READ_WRITE_TOKEN` is unset (optional, for offline dev).

## Implementation

### 1. Add dependency

```bash
npm install @vercel/blob
```

### 2. Create Vercel Blob store

- In Vercel Dashboard → Project → Storage → Create Database → Blob
- Name: e.g. `book-uploads`
- Access: **Private** (admin-only PDFs)
- Environment variables: `BLOB_READ_WRITE_TOKEN` (auto-created)
- Pull locally: `npx vercel env pull .env.local`

### 3. Refactor `uploadBook` in `src/actions/books.ts`

**Current flow:**
- `mkdir` + `writeFile` to `public/uploads/books/{id}.pdf`
- `sourcePdfUrl = /uploads/books/{id}.pdf`

**New flow:**
- If `BLOB_READ_WRITE_TOKEN` is set: use `put()` from `@vercel/blob` to upload buffer; store returned `url` in `sourcePdfUrl`
- If not set (offline dev): keep existing local filesystem logic as fallback

```ts
import { put } from '@vercel/blob'

// In uploadBook:
const token = process.env.BLOB_READ_WRITE_TOKEN
if (token) {
  const blob = await put(`books/${book.id}.pdf`, buffer, {
    access: 'public', // or 'private' if you need signed URLs for extract
    contentType: 'application/pdf',
  })
  await db.book.update({
    where: { id: book.id },
    data: { sourcePdfUrl: blob.url },
  })
} else {
  // Fallback: local filesystem (dev only)
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, `${book.id}.pdf`), buffer)
  await db.book.update({
    where: { id: book.id },
    data: { sourcePdfUrl: `/uploads/books/${book.id}.pdf` },
  })
}
```

**Note**: For `extractBookText` to read from Blob, the URL must be fetchable. Use `access: 'public'` so the URL is directly readable, or use `get()` from `@vercel/blob` with a blob path if private.

### 4. Refactor `extractBookText` in `src/actions/books.ts`

**Current flow:**
- `readFile(filePath)` where `filePath = UPLOAD_DIR + bookId.pdf`

**New flow:**
- If `sourcePdfUrl` starts with `http` (Blob URL): `fetch(sourcePdfUrl)` → `response.arrayBuffer()` → `Buffer.from()`
- Else (local path): `readFile(path.join(process.cwd(), sourcePdfUrl))` — handle leading slash

```ts
let buffer: Buffer
if (book.sourcePdfUrl?.startsWith('http')) {
  const res = await fetch(book.sourcePdfUrl)
  if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`)
  const ab = await res.arrayBuffer()
  buffer = Buffer.from(ab)
} else if (book.sourcePdfUrl) {
  const filePath = path.join(process.cwd(), book.sourcePdfUrl)
  buffer = await readFile(filePath)
} else {
  return { error: 'No PDF URL' }
}
```

### 5. Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `BLOB_READ_WRITE_TOKEN` | Yes (prod) | From Vercel Blob store; add to Vercel project env |

### 6. Size limit note

Vercel Hobby has a 4.5 MB request body limit. If PDFs exceed this, options:
- Upgrade to Pro (higher limit)
- Use [client upload](https://vercel.com/docs/storage/vercel-blob/client-upload) (generate upload URL from server, upload from client)
- Document max size in UI

## Verification

1. Create Blob store in Vercel; add `BLOB_READ_WRITE_TOKEN` to project env
2. Deploy; open `/admin/books` on bars-engine.vercel.app
3. Upload a PDF (< 4.5 MB for Hobby)
4. Confirm book appears; run "Extract text"; confirm extraction succeeds
5. Local dev: with `BLOB_READ_WRITE_TOKEN` in `.env.local`, upload and extract work; without it, local fallback works (if implemented)
