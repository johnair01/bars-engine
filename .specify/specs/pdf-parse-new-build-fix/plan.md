# Plan: PDF Parse New Build Fix

## Summary

Add `pdf-parse-new` to Next.js `serverComponentsExternalPackages` so the package is not bundled. It will run from `node_modules` at runtime, and `fork(pdf-child.js)` will resolve correctly.

## Implementation

### 1. Update next.config.ts

Add `serverComponentsExternalPackages` (or `serverExternalPackages` in Next.js 15+):

```ts
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    serverComponentsExternalPackages: ["pdf-parse-new"],
  },
};
```

**Note**: In Next.js 15+, the option may be at top level as `serverExternalPackages`. Check [Next.js docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages).

### 2. Verify

1. Run `npm run build` — should complete.
2. Run dev, upload a PDF, click "Extract Text" — should work.

## File impacts

| Action | Path |
|--------|------|
| Modify | next.config.ts |

## Fallback

If `serverComponentsExternalPackages` does not fix it:
- Try `serverExternalPackages` (Next.js 15+)
- Consider dynamic import: `const pdf = (await import('pdf-parse-new')).default` inside the server action only
- As last resort: switch to `pdf2json` or `unpdf` (different APIs)
