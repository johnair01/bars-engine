# Plan: Book Upload — Fix Unexpected Response

## Summary

Increase Next.js Server Actions body size limit so PDF uploads larger than 1 MB succeed.

## Implementation

**File**: `next.config.ts`

Add `serverActions.bodySizeLimit`:

```ts
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};
```

**Note**: `serverActions` remains under `experimental` in Next.js 16 per official docs.

## Verification

1. Run `npm run dev`
2. Open `/admin/books` as admin
3. Upload a PDF > 1 MB (e.g. 2–5 MB)
4. Confirm upload succeeds; book appears in list with status draft
