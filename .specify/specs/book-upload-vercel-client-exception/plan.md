# Plan: Book Upload — Fix Client-Side Exception on Vercel

## Summary

Triage and fix the client-side exception when loading/uploading on bars-engine.vercel.app. Primary suspects: BLOB_READ_WRITE_TOKEN missing (causes mkdir fallback → ENOENT), module bundling, or error response format.

## Phase 1: Fail Fast When Blob Token Missing

### 1.1 Add production check in uploadBook

**File**: `src/actions/books.ts`

Before attempting upload, if `!process.env.BLOB_READ_WRITE_TOKEN` and `process.env.VERCEL` (production), return:

```ts
if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.VERCEL) {
  return {
    error: 'PDF upload requires BLOB_READ_WRITE_TOKEN. Add it in Vercel project settings → Environment Variables.',
  }
}
```

This prevents the mkdir fallback and surfaces the real cause instead of ENOENT or cascading errors.

### 1.2 Document env requirement

Add to `docs/ENV_AND_VERCEL.md` or README: `BLOB_READ_WRITE_TOKEN` is required for book upload on Vercel. Create Blob store in Vercel Dashboard → Storage; token is auto-added to env.

## Phase 2: Server-Only Module Isolation

### 2.1 Add @vercel/blob to serverExternalPackages

**File**: `next.config.ts`

```ts
serverExternalPackages: ["pdf-parse-new", "@vercel/blob"],
```

This ensures `@vercel/blob` is not bundled; it runs from node_modules at runtime. Prevents any accidental client-side evaluation.

### 2.2 Verify import chain

- `BookUploadForm` (client) imports `uploadBook` from `@/actions/books` — server action reference only; OK.
- `BookList` (client) imports `extractBookText`, `analyzeBook`, etc. — server action references; OK.
- No client component should import `pdf-extract` or `@vercel/blob` directly.

## Phase 3: Triage Checklist (for future debugging)

If client-side exception persists:

1. **Browser console** — Check for specific error (module not found, undefined, etc.).
2. **Network tab** — When uploading, check response status and body. 413 = body too large; 500 = server error.
3. **Vercel function logs** — Check server-side errors (ENOENT, Blob API errors).
4. **Env** — Confirm BLOB_READ_WRITE_TOKEN in Vercel project env (not just .env.local).

## Phase 4: Verification

1. Set BLOB_READ_WRITE_TOKEN in Vercel (if not already).
2. Deploy with Phase 1 + 2 changes.
3. Open /admin/books; upload PDF.
4. If token missing: expect clear error message, not generic client exception.
5. If token set: expect successful upload.
