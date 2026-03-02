# Plan: PDF Extract — Fix Worker Error

## Summary

Replace `pdf-parse` with `pdf-parse-new` to avoid pdfjs-dist worker loading in Next.js server environment.

## Implementation

1. **Remove** pdf-parse
2. **Install** pdf-parse-new
3. **Update** [src/lib/pdf-extract.ts](../../src/lib/pdf-extract.ts) to use pdf-parse-new API

### Current (pdf-parse, class-based)

```ts
import { PDFParse } from 'pdf-parse'
const parser = new PDFParse({ data: buffer })
const result = await parser.getText()
// result: { text, pages, total }
```

### Target (pdf-parse-new, function-based)

```ts
import pdf from 'pdf-parse-new'
const data = await pdf(buffer)
// data: { text, numpages, info, ... }
return { text: data.text ?? '', pageCount: data.numpages ?? 0 }
```

Our contract: `{ text, pageCount }` — map `numpages` → `pageCount`.

## File impacts

| Action | Path |
|--------|------|
| Modify | package.json (deps) |
| Modify | src/lib/pdf-extract.ts |
